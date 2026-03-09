import AlertModel from "../models/AlertModel.js";
import { loadActiveAlerts } from "../services/alertEngine.js";
import redisClient from "../services/redisClient.js";

export const createAlert = async (req, res) => {
  try {
    const { symbol, targetPrice, condition, notifyEmail, notifyTelegram, email, telegramChatId } = req.body;
    const alert = await AlertModel.create({
      symbol,
      targetPrice,
      condition,
      notifyEmail,
      notifyTelegram,
      email,
      telegramChatId,
    });
    
    // Refresh the engine's in-memory cache
    await loadActiveAlerts();
    
    // Invalidate alerts cache
    if (redisClient.status === 'ready') {
      await redisClient.del("alerts:all");
    }

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlerts = async (req, res) => {
  const cacheKey = "alerts:all";

  try {
    let cachedAlerts = null;
    if (redisClient.status === 'ready') {
      cachedAlerts = await redisClient.get(cacheKey);
    }
    
    if (cachedAlerts) {
      return res.json(JSON.parse(cachedAlerts));
    }

    const alerts = await AlertModel.find({}).sort({ createdAt: -1 });
    
    // Cache alerts for 1 hour (invalidated on create/delete anyway)
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(alerts));
    }

    res.json(alerts);
  } catch (error) {
    console.error("Redis Cache Error in getAlerts:", error);
    try {
      const alerts = await AlertModel.find({}).sort({ createdAt: -1 });
      res.json(alerts);
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  }
};

export const deleteAlert = async (req, res) => {
  try {
    await AlertModel.findByIdAndDelete(req.params.id);
    await loadActiveAlerts();
    
    // Invalidate alerts cache
    if (redisClient.status === 'ready') {
      await redisClient.del("alerts:all");
    }

    res.json({ message: "Alert deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
