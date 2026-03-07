import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    name: String,
    qty: Number,
    price: Number,
    mode: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true } // <-- This adds createdAt and updatedAt fields
);

const OrdersModel = mongoose.model("Order", orderSchema);
export default OrdersModel;
