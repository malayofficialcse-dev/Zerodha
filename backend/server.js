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

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// In-memory OHLC tracker for the 5-second window
const memoryOHLC = {};

// Background Simulator: Generates instant ticks multiple times a second
const startLiveTicks = async () => {
  const stocks = await mongoose.model("Stock").find({});
  
  // Initialize memory map from last known DB close price
  stocks.forEach(stock => {
    const last = stock.ohlc[stock.ohlc.length - 1] || { close: stock.currentPrice };
    memoryOHLC[stock.symbol] = {
      _id: stock._id,
      open: last.close,
      high: last.close,
      low: last.close,
      close: last.close,
      volume: 0,
    };
  });

  // Tick generator: Every 1 second, generate a tick for every stock
  setInterval(() => {
    Object.keys(memoryOHLC).forEach(symbol => {
      const current = memoryOHLC[symbol];
      const drift = (Math.random() - 0.5) * 5; 
      const newClose = current.close + drift;
      
      // Update in-memory candle constraints
      current.close = Number(newClose.toFixed(2));
      if (newClose > current.high) current.high = Number(newClose.toFixed(2));
      if (newClose < current.low) current.low = Number(newClose.toFixed(2));
      current.volume += Math.floor(Math.random() * 50);

      // Publish tick instantly to Kafka for webSockets
      publishTick({
        symbol,
        date: new Date(),
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.close,
        volume: current.volume
      });
    });
  }, 1000); 

  // Aggregation Persistence Loop: Every 5 seconds, write the accumulated candle to DB
  setInterval(async () => {
    try {
      const symbols = Object.keys(memoryOHLC);
      const updatePromises = symbols.map(symbol => {
        const current = memoryOHLC[symbol];
        const newOHLC = {
          date: new Date(),
          open: current.open,
          high: current.high,
          low: current.low,
          close: current.close,
          volume: current.volume,
        };

        // Reset memory constraints for the next 5-second cycle
        memoryOHLC[symbol] = {
          ...current,
          open: current.close,
          high: current.close,
          low: current.close,
          volume: 0,
        };

        return mongoose.model("Stock").findOneAndUpdate(
          { _id: current._id },
          {
            $push: { ohlc: { $each: [newOHLC], $slice: -100 } },
            $set: { currentPrice: newOHLC.close },
          }
        );
      });

      await Promise.all(updatePromises);
      console.log(`[Simulator] Persisted live candles for ${symbols.length} symbols.`);
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
