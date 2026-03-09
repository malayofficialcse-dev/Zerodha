import mongoose from "mongoose";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { initKafkaProducer, publishTick } from "./services/kafkaService.js";
import { initStreamingServer } from "./websockets/streamingServer.js";

import connectDB from "./DB/connect.js";
import holdingRoutes from "./routes/holdingRoutes.js";
import positionsRoutes from "./routes/positionRoutes.js";
import ordersRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import intradayRoutes from "./routes/intradayRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import correlationRoutes from "./routes/correlationRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { loadActiveAlerts } from "./services/alertEngine.js";



import { seedStocks } from "./Data/seedStocks.js";
import StockModel from "./models/stockModel.js"; 
import redisClient from "./services/redisClient.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// In-memory OHLC tracker for the 5-second window
const memoryOHLC = {};

// Background Simulator: Generates instant ticks multiple times a second
const startLiveTicks = async () => {
  const stocks = await mongoose.model("Stock").find({});
  
  // Initialize memory map in Redis or local fallback
  for (const stock of stocks) {
    const last = stock.ohlc[stock.ohlc.length - 1] || { close: stock.currentPrice };
    const initialData = {
      _id: stock._id.toString(),
      open: last.close,
      high: last.close,
      low: last.close,
      close: last.close,
      volume: 0,
    };

    // Always seed local memory as fallback
    memoryOHLC[stock.symbol] = { ...initialData };

    if (redisClient.status === 'ready') {
      try {
        const exists = await redisClient.exists(`live_tick_memory:${stock.symbol}`);
        if (!exists) {
          await redisClient.hset(`live_tick_memory:${stock.symbol}`, initialData);
        }
      } catch (err) {
        console.warn(`[Simulator] Failed to init Redis memory for ${stock.symbol}`);
      }
    }
  }

  // Tick generator: Every 1 second, generate a tick for every stock
  setInterval(async () => {
    try {
      for (const stock of stocks) {
        const symbol = stock.symbol;
        let currentData = null;

        if (redisClient.status === 'ready') {
          currentData = await redisClient.hgetall(`live_tick_memory:${symbol}`);
        }
        
        // Fallback to local memory if Redis data is missing or Redis is down
        if (!currentData || !currentData.close) {
          currentData = memoryOHLC[symbol];
        }

        if (!currentData || !currentData.close) continue;

        let { _id, open, high, low, close, volume } = currentData;
        open = Number(open);
        high = Number(high);
        low = Number(low);
        close = Number(close);
        volume = Number(volume);

        const drift = (Math.random() - 0.5) * 5; 
        const newClose = close + drift;
        
        // Update in-memory candle constraints
        close = Number(newClose.toFixed(2));
        if (newClose > high) high = Number(newClose.toFixed(2));
        if (newClose < low) low = Number(newClose.toFixed(2));
        volume += Math.floor(Math.random() * 50);

        // Update local memory always
        memoryOHLC[symbol] = { _id, open, high, low, close, volume };

        // Save back to Redis if ready
        if (redisClient.status === 'ready') {
          await redisClient.hset(`live_tick_memory:${symbol}`, {
            high, low, close, volume
          });
        }

        // Publish tick instantly (Kafka service handles its own fallback to Socket.io)
        publishTick({
          symbol,
          date: new Date(),
          open,
          high,
          low,
          close,
          volume
        });
      }
    } catch (err) {
      console.error("[Simulator] Tick Generation error:", err.message);
    }
  }, 1000); 

  // Aggregation Persistence Loop: Every 5 seconds, write the accumulated candle to DB
  setInterval(async () => {
    try {
      const updatePromises = stocks.map(async (stock) => {
        const symbol = stock.symbol;
        let currentData = null;

        if (redisClient.status === 'ready') {
          currentData = await redisClient.hgetall(`live_tick_memory:${symbol}`);
        }

        // Fallback to local memory
        if (!currentData || !currentData.close) {
          currentData = memoryOHLC[symbol];
        }

        if (!currentData || !currentData.close) return null;

        const { _id, open, high, low, close, volume } = currentData;

        const newOHLC = {
          date: new Date(),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume),
        };

        // Reset memory constraints for the next 5-second cycle
        const resetData = {
          open: close,
          high: close,
          low: close,
          volume: 0,
        };

        memoryOHLC[symbol] = { ...currentData, ...resetData };

        if (redisClient.status === 'ready') {
          await redisClient.hset(`live_tick_memory:${symbol}`, resetData);
        }

        return mongoose.model("Stock").findOneAndUpdate(
          { _id },
          {
            $push: { ohlc: { $each: [newOHLC], $slice: -100 } },
            $set: { currentPrice: newOHLC.close },
          }
        );
      });

      await Promise.all(updatePromises);
      console.log(`[Simulator] Persisted live candles for ${stocks.length} symbols.`);
    } catch (err) {
      console.error("DB Aggregation error:", err.message);
    }
  }, 5000);
};

// ... (CORS and middleware)

// app.use(express.json());

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://zerodha-3-2n76.onrender.com",
      "https://zerodha-4-giue.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use("/api/holding", holdingRoutes);
app.use("/api/position", positionsRoutes);
app.use("/api/order", ordersRoutes);
app.use("/api/user", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/intraday", intradayRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/correlation", correlationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analytics", analyticsRoutes);


// Connect to DB, load Kafka, then start server
connectDB().then(async () => {
  await seedStocks(); 
  await initKafkaProducer();
  await initStreamingServer(httpServer);
  await loadActiveAlerts(); // Load alerts into memory

  await startLiveTicks(); 
  
  httpServer.listen(process.env.PORT || 3005, () => {
    console.log("HTTP & WebSocket Server started on port", process.env.PORT || 3005);
  });
});
