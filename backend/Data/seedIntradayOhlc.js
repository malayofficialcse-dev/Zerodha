import mongoose from "mongoose";
import StockModel from "../models/stockModel.js";

const MONGO_URI = "mongodb://localhost:27017/zerodha"; // Change if needed

const SYMBOL = "RELIANCE";
const DAYS = 10;
const CANDLES_PER_DAY = 13; // 9:00 to 22:00, every 1 hour for demo

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

async function seed() {
  await mongoose.connect(MONGO_URI);

  let ohlcIntraday = [];
  let base = 2000 + Math.random() * 1000;

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    const dd = String(day.getDate()).padStart(2, "0");

    let prevClose = base + randomBetween(-20, 20);

    for (let i = 0; i < CANDLES_PER_DAY; i++) {
      const hour = 9 + i;
      const date = new Date(
        `${yyyy}-${mm}-${dd}T${String(hour).padStart(2, "0")}:00:00`
      );
      const open = prevClose;
      const high = open + randomBetween(0, 10);
      const low = open - randomBetween(0, 10);
      const close = randomBetween(low, high);
      ohlcIntraday.push({
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });
      prevClose = close;
    }
  }

  // Update the stock
  await StockModel.updateOne(
    { symbol: SYMBOL },
    { $set: { ohlcIntraday } },
    { upsert: true }
  );

  console.log("Seeded intraday OHLC for", SYMBOL);
  process.exit();
}

seed();
