import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: String,
  qty: Number,
  avg: Number,
  price: Number,
  net: String,
  day: String,
  isLoss: Boolean,
});

const HoldingsModel = mongoose.model("Holding", holdingSchema);

export default HoldingsModel;
