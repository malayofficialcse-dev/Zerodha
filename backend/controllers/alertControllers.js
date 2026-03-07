import AlertModel from "../models/AlertModel.js";
import { loadActiveAlerts } from "../services/alertEngine.js";

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
    
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const alerts = await AlertModel.find({}).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    await AlertModel.findByIdAndDelete(req.params.id);
    await loadActiveAlerts();
    res.json({ message: "Alert deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
