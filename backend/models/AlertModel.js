import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: "USERID", // For demo consistency
  },
  symbol: {
    type: String,
    required: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  condition: {
    type: String,
    enum: ["above", "below"],
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "triggered", "cancelled"],
    default: "active",
  },
  notifyEmail: {
    type: Boolean,
    default: false,
  },
  notifyTelegram: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
  },
  telegramChatId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  triggeredAt: {
    type: Date,
  },
});

const AlertModel = mongoose.model("Alert", alertSchema);
export default AlertModel;
