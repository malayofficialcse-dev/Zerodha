import mongoose from "mongoose";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import client from "prom-client";

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
import alertRoutes from "./routes/alertRoutes.js";
import { loadActiveAlerts } from "./services/alertEngine.js";
import { initRabbitMQ } from "./services/rabbitMQClient.js";
import { startNotificationWorker } from "./workers/notificationWorker.js";



import { seedStocks } from "./Data/seedStocks.js";
import StockModel from "./models/stockModel.js";
import redisClient from "./services/redisClient.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// In-memory OHLC tracker for the 5-second window
const memoryOHLC = {};

// ── In-memory intraday candle store ──────────────────────────────────────────
// Accumulates real 5-second OHLC candles since server start.
// Cleared on server restart (acts as today's intraday session).
// Key: stock symbol → Value: array of OHLC candles [{date,open,high,low,close,volume}]
const intradayCandles = {};

// Background Simulator: Generates instant ticks multiple times a second
const startLiveTicks = async () => {
  const stocks = await mongoose.model("Stock").find({});

  // Initialize memory map in Redis or local fallback
  for (const stock of stocks) {
    const basePrice = Number(stock.currentPrice) || 1000;
    const _id = stock._id.toString();

    // ── Pre-generate 50 synthetic 5-second candles going back 250 seconds ──
    // This gives the chart immediate history instead of starting with 1 candle.
    // Drift = ±0.3% per candle so OHLC bodies are clearly visible at any price.
    const nowMs = Date.now();
    const CANDLE_COUNT = 50;
    const CANDLE_MS = 5000;
    const syntheticCandles = [];
    let price = basePrice;

    for (let i = CANDLE_COUNT; i >= 1; i--) {
      const candleTime = new Date(nowMs - i * CANDLE_MS);
      const drift = (Math.random() - 0.5) * price * 0.006; // ±0.3% per candle
      const open  = Number(price.toFixed(2));
      const close = Number(Math.max(1, price + drift).toFixed(2));
      const wick  = Math.random() * price * 0.002; // small wicks
      const high  = Number((Math.max(open, close) + wick).toFixed(2));
      const low   = Number((Math.min(open, close) - wick).toFixed(2));
      const volume = Math.floor(Math.random() * 5000 + 500);
      syntheticCandles.push({ date: candleTime, open, high, low, close, volume });
      price = close; // next candle opens where this one closed
    }

    intradayCandles[stock.symbol] = syntheticCandles;

    // ── Align memoryOHLC to the final synthetic price so live ticks continue seamlessly ──
    const initialData = {
      _id,
      open:   Number(price.toFixed(2)),
      high:   Number(price.toFixed(2)),
      low:    Number(price.toFixed(2)),
      close:  Number(price.toFixed(2)),
      volume: 0,
    };

    memoryOHLC[stock.symbol] = { ...initialData };

    if (redisClient.status === 'ready') {
      try {
        await redisClient.hset(`live_tick_memory:${stock.symbol}`, initialData);
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

        // Proportional drift: ±0.1% of current price per tick
        // Ensures candle bodies are visible at any price level
        const drift = (Math.random() - 0.5) * close * 0.002;
        const newClose = Math.max(1, close + drift);

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
  // AND push to the in-memory intraday candle store (served to frontend)
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

        // ── Push to in-memory intraday store (keeps last 200 candles per symbol) ──
        if (!intradayCandles[symbol]) intradayCandles[symbol] = [];
        intradayCandles[symbol].push(newOHLC);
        if (intradayCandles[symbol].length > 200) {
          intradayCandles[symbol] = intradayCandles[symbol].slice(-200);
        }

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

// ── Live intraday OHLC: served from in-memory store (real 5-second candles) ──
// Must be registered BEFORE the generic intradayRoutes to take precedence.
app.get("/api/intraday/:symbol/intraday-ohlc", (req, res) => {
  const { symbol } = req.params;
  const candles = intradayCandles[symbol.toUpperCase()];
  if (!candles || candles.length === 0) {
    return res.json([]); // Return empty; frontend will wait for first tick
  }
  res.json(candles);
});

app.use("/api/intraday", intradayRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alert", alertRoutes);

// Prometheus Metrics Definitions
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom Business Metrics
const orderCounter = new client.Counter({
  name: 'zerodha_orders_total',
  help: 'Total number of orders placed via the API',
  labelNames: ['type', 'symbol']
});

const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to track request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    requestDuration.labels(req.method, route, res.statusCode).observe(duration);
  });
  next();
});

// Wrap order routes to increment metrics
app.use("/api/order", (req, res, next) => {
  if (req.method === 'POST') {
    orderCounter.labels('market', req.body.symbol || 'unknown').inc();
  }
  next();
}, ordersRoutes);

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});


// Connect to DB, load Kafka, then start server
connectDB().then(async () => {
  await seedStocks();
  await initKafkaProducer();
  await initStreamingServer(httpServer);
  await loadActiveAlerts(); // Load alerts into memory

  await initRabbitMQ();
  startNotificationWorker();

  await startLiveTicks();

  httpServer.listen(process.env.PORT || 3005, () => {
    console.log("HTTP & WebSocket Server started on port", process.env.PORT || 3005);
  });
});
