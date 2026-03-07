import mongoose from "mongoose";

// Each stock has a symbol, name, and an array of historical OHLCV data
const ohlcSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
});

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true }, // e.g. BTC, SENSEX
  name: { type: String, required: true }, // e.g. Bitcoin
  sector: String,
  assetCategory: { 
    type: String, 
    enum: ["Bluechip", "Midcap", "Smallcap", "Other"],
    default: "Other"
  },
  currentPrice: Number,
  ohlc: [ohlcSchema], // Array of historical OHLC data
  marketCap: { type: String, default: "0" },
  peRatio: { type: Number, default: 0 },
  dividendYield: { type: Number, default: 0 },
  high52w: { type: Number, default: 0 },
  low52w: { type: Number, default: 0 },
  description: { type: String, default: "" },
  analystRating: { type: String, default: "HOLD" }, // BUY, SELL, HOLD
});

const StockModel = mongoose.model("Stock", stockSchema);
export default StockModel;
