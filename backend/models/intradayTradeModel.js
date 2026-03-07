import mongoose from "mongoose";

const intradayTradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stock: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },
  symbol: { type: String, required: true },
  qty: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  sellPrice: { type: Number, default: null },
  buyTime: { type: Date, default: Date.now },
  sellTime: { type: Date, default: null },
  limitType: {
    type: String,
    enum: ["NONE", "STOPLOSS", "TARGET"],
    default: "NONE",
  },
  limitValue: { type: Number, default: null },
  status: { type: String, enum: ["OPEN", "CLOSED", "AUTO"], default: "OPEN" },
  profitOrLoss: { type: Number, default: 0 },
  notified: { type: Boolean, default: false },
});

export default mongoose.model("IntradayTrade", intradayTradeSchema);
