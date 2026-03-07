import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Company name
  date: { type: String, required: true }, // e.g., '2003-01-01'
  value: { type: Number, required: true }, // e.g., P&L, price, or qty
});

const DashboardModel = mongoose.model("Dashboard", dashboardSchema);
export default DashboardModel;
