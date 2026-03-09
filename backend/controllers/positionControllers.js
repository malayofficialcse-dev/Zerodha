import PositionsModel from "../models/positionsModel.js";
import redisClient from "../services/redisClient.js";

const getAllPositions = async (req, res) => {
  const cacheKey = "positions:all";

  try {
    let cachedPositions = null;
    if (redisClient.status === 'ready') {
      cachedPositions = await redisClient.get(cacheKey);
    }
    
    if (cachedPositions) {
      return res.json(JSON.parse(cachedPositions));
    }

    const allPositions = await PositionsModel.find({});
    
    // Cache for 10 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 10, JSON.stringify(allPositions));
    }
    
    res.json(allPositions);
  } catch (err) {
    console.error("Redis Cache Error in getAllPositions:", err);
    try {
      const allPositions = await PositionsModel.find({});
      res.json(allPositions);
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  }
};

export { getAllPositions };
