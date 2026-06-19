import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/zerodha";
    await mongoose.connect(mongoUrl, {});
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
