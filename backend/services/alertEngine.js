import AlertModel from "../models/AlertModel.js";
import IntradayTrade from "../models/intradayTradeModel.js";
import HoldingModel from "../models/holdingsModel.js";
import UserModel from "../models/usersModel.js";
import redisClient from "./redisClient.js";
import { publishNotification } from "./rabbitMQClient.js";

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
      
      // Offload notifications to RabbitMQ
      if (alert.notifyEmail && alert.email) {
        publishNotification({
          type: "email",
          to: alert.email,
          subject: `Price Alert: ${alert.symbol}`,
          message: message.replace(/<[^>]*>/g, "")
        });
      }
      
      if (alert.notifyTelegram && alert.telegramChatId) {
        publishNotification({
          type: "telegram",
          chatId: alert.telegramChatId,
          message: message
        });
      }

      onTrigger(alert, tick.close);
    }
  }
};

/**
 * Check intraday positions against a new tick to trigger SL / Target
 */
export const checkIntradayAlerts = async (tick) => {
  try {
    const openTrades = await IntradayTrade.find({ symbol: tick.symbol, status: "OPEN" });
    for (const trade of openTrades) {
      let shouldSell = false;
      if (trade.limitType === "STOPLOSS" && tick.close <= trade.limitValue) {
        shouldSell = true;
      }
      if (trade.limitType === "TARGET" && tick.close >= trade.limitValue) {
        shouldSell = true;
      }

      if (shouldSell) {
        trade.sellPrice = tick.close;
        trade.sellTime = new Date();
        trade.status = "AUTO";
        trade.profitOrLoss = (tick.close - trade.buyPrice) * trade.qty;
        await trade.save();

        const user = await UserModel.findById(trade.user);
        if (user) {
          user.cashBalance += trade.qty * tick.close;
          await user.save();
          if (redisClient.status === "ready") {
            await redisClient.del(`user:${trade.user}:profile`);
          }
        }

        let holding = await HoldingModel.findOne({ user: trade.user, name: trade.symbol });
        if (holding) {
          holding.qty -= trade.qty;
          if (holding.qty <= 0) {
            await HoldingModel.deleteOne({ _id: holding._id });
          } else {
            await holding.save();
          }
        }

        if (redisClient.status === "ready") {
          await redisClient.del(`user:${trade.user}:intraday`);
          await redisClient.del(`user:${trade.user}:holdings`);
        }

        // Publish alert to RabbitMQ
        const alertMsg = {
          type: "position-alert",
          userId: trade.user.toString(),
          symbol: trade.symbol,
          qty: trade.qty,
          limitType: trade.limitType,
          limitValue: trade.limitValue,
          triggerPrice: tick.close,
          pnl: trade.profitOrLoss,
          timestamp: new Date().toISOString()
        };
        const published = await publishNotification(alertMsg);
        if (published) {
          console.log(`[AlertEngine] Intraday SL/Target hit: ${trade.symbol} at ₹${tick.close}. Published to RabbitMQ.`);
        } else {
          // Fallback: emit directly to socket clients
          const { getIO } = await import("../websockets/streamingServer.js");
          const io = getIO();
          if (io) {
            console.log(`[AlertEngine] RabbitMQ down. Emitting position-alert directly for user ${trade.user}: ${trade.symbol}`);
            io.emit("position-alert", alertMsg);
          }
        }
      }
    }
  } catch (err) {
    console.error("[AlertEngine] Error checking intraday alerts:", err.message);
  }
};
