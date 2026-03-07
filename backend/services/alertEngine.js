import AlertModel from "../models/AlertModel.js";
import { sendEmail, sendTelegram } from "./notificationService.js";

let activeAlerts = [];

/**
 * Load all active alerts from DB into memory for fast comparison
 */
export const loadActiveAlerts = async () => {
  activeAlerts = await AlertModel.find({ status: "active" });
  console.log(`[AlertEngine] Loaded ${activeAlerts.length} active alerts.`);
};

/**
 * Check a new tick against active alerts
 * @param {Object} tick { symbol, close, ... }
 * @param {Function} onTrigger Callback for when an alert fires
 */
export const checkAlerts = async (tick, onTrigger) => {
  const relevantAlerts = activeAlerts.filter(a => a.symbol === tick.symbol);
  
  for (const alert of relevantAlerts) {
    let triggered = false;
    
    if (alert.condition === "above" && tick.close >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === "below" && tick.close <= alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      // Mark as triggered in memory and DB
      alert.status = "triggered";
      alert.triggeredAt = new Date();
      
      // Remove from memory immediately so it doesn't fire twice
      activeAlerts = activeAlerts.filter(a => a._id.toString() !== alert._id.toString());
      
      // Update DB
      await AlertModel.findByIdAndUpdate(alert._id, { 
        status: "triggered", 
        triggeredAt: new Date() 
      });
      
      const message = `🔔 <b>ALERT TRIGGERED</b>\n\nStock: <b>${alert.symbol}</b>\nCondition: <b>${alert.condition}</b>\nTarget: <b>₹${alert.targetPrice}</b>\nActual Price: <b>₹${tick.close}</b>\nTime: ${new Date().toLocaleString()}`;
      
      console.log(`🔔 ALERT TRIGGERED: ${alert.symbol} ${alert.condition} ${alert.targetPrice} (Price: ${tick.close})`);
      
      // Trigger multi-channel notifications
      if (alert.notifyEmail && alert.email) {
        sendEmail(alert.email, `Price Alert: ${alert.symbol}`, message.replace(/<[^>]*>/g, ""));
      }
      
      if (alert.notifyTelegram && alert.telegramChatId) {
        sendTelegram(alert.telegramChatId, message);
      }

      onTrigger(alert, tick.close);
    }
  }
};
