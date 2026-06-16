import AdminModel from "../models/adminModel.js";
import UserModel from "../models/usersModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient from "../services/redisClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Helper to auto-create default admin on login if none exists
const ensureDefaultAdmin = async () => {
  const count = await AdminModel.countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await AdminModel.create({
      username: "admin",
      email: "admin@zerodha.com",
      password: hashedPassword,
      role: "admin"
    });
    console.log("[Admin] Created default admin account (username: admin, password: admin123)");
  }
};

export const adminLogin = async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { username, password } = req.body;
    const admin = await AdminModel.findOne({ username });
    if (!admin) {
      return res.status(400).json({ error: "Admin user not found" });
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: admin._id, role: "admin" }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token, username: admin.username, role: "admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listPendingKYC = async (req, res) => {
  try {
    const pendingUsers = await UserModel.find({ kycStatus: "pending" }).select("-password");
    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.kycStatus !== "pending") {
      return res.status(400).json({ error: "User KYC is not in pending state" });
    }

    user.kycStatus = "approved";
    user.cashBalance = 1000; // Credited ₹1000 upon KYC approval
    await user.save();

    // Invalidate user cache
    if (redisClient.status === "ready") {
      await redisClient.del(`user:${id}:profile`);
    }

    res.json({ message: "KYC Approved and ₹1,000 credited.", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.kycStatus !== "pending") {
      return res.status(400).json({ error: "User KYC is not in pending state" });
    }

    user.kycStatus = "rejected";
    await user.save();

    // Invalidate user cache
    if (redisClient.status === "ready") {
      await redisClient.del(`user:${id}:profile`);
    }

    res.json({ message: "KYC Rejected.", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
