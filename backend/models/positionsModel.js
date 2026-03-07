import mongoose from "mongoose";

const positionsSchema = new mongoose.Schema({
  product: String,
  name: String,
  qty: Number,
  avg: Number,
  price: Number,
  net: String,
  day: String,
  isLoss: Boolean,
});

const PositionsModel = mongoose.model("Position", positionsSchema);

export default PositionsModel;
