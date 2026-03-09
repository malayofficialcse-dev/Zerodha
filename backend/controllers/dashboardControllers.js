import DashboardModel from "../models/dashboardModel.js";
import redisClient from "../services/redisClient.js";

export const getAllDashboardPositions = async (req, res) => {
  const cacheKey = "dashboard:positions";

  try {
    let cachedPositions = null;
    if (redisClient.status === 'ready') {
      cachedPositions = await redisClient.get(cacheKey);
    }
    
    if (cachedPositions) {
      return res.json(JSON.parse(cachedPositions));
    }

    const positions = await DashboardModel.find({});
    
    // Cache for 10 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 10, JSON.stringify(positions));
    }
    
    res.json(positions);
  } catch (err) {
    console.error("Redis Cache Error in getAllDashboardPositions:", err);
    try {
      const positions = await DashboardModel.find({});
      res.json(positions);
    } catch (dbErr) {
      res.status(500).json({ error: "Failed to fetch dashboard positions" });
    }
  }
};
