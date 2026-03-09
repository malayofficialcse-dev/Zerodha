import HoldingModel from "../models/holdingsModel.js";
import mongoose from "mongoose";
import redisClient from "../services/redisClient.js";

const getAllHoldings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}:holdings`;

    // Try to get from cache first
    let cachedHoldings = null;
    if (redisClient.status === 'ready') {
      cachedHoldings = await redisClient.get(cacheKey);
    }

    if (cachedHoldings) {
      return res.json(JSON.parse(cachedHoldings));
    }

    // Only return holdings belonging to the logged-in user
    const allData = await HoldingModel.find({ user: userId });
    
    // Cache for 60 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 60, JSON.stringify(allData));
    }
    
    res.json(allData);
  } catch (err) {
    console.error("Redis Cache Error in getAllHoldings:", err);
    try {
      const allData = await HoldingModel.find({ user: req.user.userId });
      res.json(allData);
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  }
};

export { getAllHoldings };
