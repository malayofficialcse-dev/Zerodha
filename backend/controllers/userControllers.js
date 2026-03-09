import UserModel from "../models/usersModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// export const registerUser = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const hash = await bcrypt.hash(password, 10);
//     const user = new UserModel({ username, email, password: hash });
//     await user.save();
//     res.status(201).json({ message: "User registered" });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new UserModel({ username, email, password: hash });
    await user.save();

    // Generate JWT token after signup
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return token in response
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Allow login with either username or email
    const user = await UserModel.findOne({
      $or: [{ username: username }, { email: username }],
    });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // After successful login:
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token, username: user.username }); // <-- Send token in response body
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/user/profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}:profile`;

    // Try cache first
    let cachedProfile = null;
    if (redisClient.status === 'ready') {
      cachedProfile = await redisClient.get(cacheKey);
    }
    
    if (cachedProfile) {
      return res.json(JSON.parse(cachedProfile));
    }

    const user = await UserModel.findById(userId).select("-password");
    
    // Cache for 1 hour
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(user));
    }

    res.json(user);
  } catch (err) {
    console.error("Redis Cache Error in getUserProfile:", err);
    try {
      const user = await UserModel.findById(req.user.userId).select("-password");
      res.json(user);
    } catch (dbErr) {
      res.status(400).json({ error: dbErr.message });
    }
  }
};
