import mongoose from "mongoose";
import StockModel from "../models/stockModel.js";
import connectDB from "../DB/connect.js";
const MONGO_URI =
  "mongodb+srv://maitymalay334:6Da4yZNwAHU1lGVD@cluster0.ryfdubj.mongodb.net/Zerodha?retryWrites=true&w=majority&appName=Cluster0 "; // Change if needed
const SYMBOL = "RELIANCE";

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

async function generateLiveCandle() {
  await mongoose.connect(MONGO_URI);
  //   await connectDB();

  // Get today's date string
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const candleTime = new Date(`${yyyy}-${mm}-${dd}T${hour}:${minute}:00`);

  // Get the stock
  const stock = await StockModel.findOne({ symbol: SYMBOL });
  if (!stock) {
    console.log("Stock not found");
    process.exit();
  }

  // Get last close or set a base
  let lastClose = 2000;
  if (stock.ohlcIntraday && stock.ohlcIntraday.length > 0) {
    lastClose = stock.ohlcIntraday[stock.ohlcIntraday.length - 1].close;
  }

  // Generate new candle
  const open = lastClose;
  const high = open + randomBetween(0, 10);
  const low = open - randomBetween(0, 10);
  const close = randomBetween(low, high);

  //   // Remove any existing candle for this minute (avoid duplicates)
  //   stock.ohlcIntraday = stock.ohlcIntraday.filter(
  //     (c) => new Date(c.date).getTime() !== candleTime.getTime()
  //   );

  // Ensure ohlcIntraday is an array
  if (!Array.isArray(stock.ohlcIntraday)) {
    stock.ohlcIntraday = [];
  }

  // Remove any existing candle for this minute (avoid duplicates)
  stock.ohlcIntraday = stock.ohlcIntraday.filter(
    (c) => new Date(c.date).getTime() !== candleTime.getTime()
  );

  // Add new candle
  stock.ohlcIntraday.push({
    date: candleTime,
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
  });

  await stock.save();
  console.log("Added candle for", candleTime);
  mongoose.disconnect();
}

export default generateLiveCandle;
