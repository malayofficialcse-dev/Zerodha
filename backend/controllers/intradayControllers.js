import IntradayTrade from "../models/intradayTradeModel.js";
import StockModel from "../models/stockModel.js";
import HoldingModel from "../models/holdingsModel.js";
import redisClient from "../services/redisClient.js";

// Helper function to invalidate intraday and holdings cache
const invalidateUserTradingCache = async (userId) => {
  try {
    if (redisClient.status === 'ready') {
      await redisClient.del(`user:${userId}:intraday`);
      await redisClient.del(`user:${userId}:holdings`);
    }
  } catch (err) {
    console.error("Cache invalidation failed for intraday trade:", err);
  }
};

// Buy
export const buyIntraday = async (req, res) => {
  const { symbol, qty, buyPrice, limitType, limitValue } = req.body;
  // const userId = req.user._id; // from auth middleware
  const userId = req.user.userId; // from auth middleware
  const stock = await StockModel.findOne({ symbol });
  if (!stock) return res.status(404).json({ error: "Stock not found" });
  console.log("req.user in buyIntraday:", req.user);
  const trade = await IntradayTrade.create({
    user: userId,
    stock: stock._id,
    symbol,
    qty,
    buyPrice,
    limitType,
    limitValue,
  });

  // --- Synchronize with user Holdings ---
  let holding = await HoldingModel.findOne({ user: userId, name: symbol });
  if (holding) {
    const totalCostBefore = holding.qty * holding.avg;
    const newCost = Number(qty) * Number(buyPrice);
    const totalQty = holding.qty + Number(qty);
    holding.avg = (totalCostBefore + newCost) / totalQty;
    holding.qty = totalQty;
    await holding.save();
  } else {
    await HoldingModel.create({
      user: userId,
      name: symbol,
      qty: Number(qty),
      avg: Number(buyPrice),
      price: Number(buyPrice),
      net: "0.00%",
      day: "0.00%",
      isLoss: false,
    });
  }

  // -> INVALIDATE CACHE
  await invalidateUserTradingCache(userId);

  res.json(trade);
};

// Sell (manual or auto)
export const sellIntraday = async (req, res) => {
  const { tradeId, sellPrice } = req.body;
  const trade = await IntradayTrade.findById(tradeId);
  if (!trade || trade.status !== "OPEN")
    return res.status(400).json({ error: "Trade not open" });

  trade.sellPrice = sellPrice;
  trade.sellTime = new Date();
  trade.status = "CLOSED";
  trade.profitOrLoss = (sellPrice - trade.buyPrice) * trade.qty;
  await trade.save();

  // --- Synchronize with user Holdings ---
  let holding = await HoldingModel.findOne({ user: trade.user, name: trade.symbol });
  if (holding) {
    holding.qty -= trade.qty;
    if (holding.qty <= 0) {
      await HoldingModel.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }
  }

  // -> INVALIDATE CACHE
  await invalidateUserTradingCache(trade.user);

  res.json(trade);
};

// Get user's intraday trades
export const getUserIntraday = async (req, res) => {
  const userId = req.user.userId;
  const cacheKey = `user:${userId}:intraday`;

  try {
    let cachedIntraday = null;
    if (redisClient.status === 'ready') {
      cachedIntraday = await redisClient.get(cacheKey);
    }
    
    if (cachedIntraday) {
      return res.json(JSON.parse(cachedIntraday));
    }
    
    const trades = await IntradayTrade.find({ user: userId }).populate("stock");
    
    // Cache for 60 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 60, JSON.stringify(trades));
    }
    
    res.json(trades);
  } catch (err) {
    console.error("Redis Cache Error in getUserIntraday:", err);
    try {
      const trades = await IntradayTrade.find({ user: req.user.userId }).populate("stock");
      res.json(trades);
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  }
};

// Auto-sell (run every minute)
export const autoSellIntraday = async (req, res) => {
  const openTrades = await IntradayTrade.find({ status: "OPEN" });
  for (const trade of openTrades) {
    const stock = await StockModel.findOne({ symbol: trade.symbol });
    if (!stock) continue;
    const currentPrice = stock.currentPrice;
    let shouldSell = false;
    if (trade.limitType === "STOPLOSS" && currentPrice <= trade.limitValue)
      shouldSell = true;
    if (trade.limitType === "TARGET" && currentPrice >= trade.limitValue)
      shouldSell = true;
    if (shouldSell) {
      trade.sellPrice = currentPrice;
      trade.sellTime = new Date();
      trade.status = "AUTO";
      trade.profitOrLoss = (currentPrice - trade.buyPrice) * trade.qty;
      await trade.save();
      
      // --- Synchronize with user Holdings ---
      let holding = await HoldingModel.findOne({ user: trade.user, name: trade.symbol });
      if (holding) {
        holding.qty -= trade.qty;
        if (holding.qty <= 0) {
          await HoldingModel.deleteOne({ _id: holding._id });
        } else {
          await holding.save();
        }
      }
      
      // -> INVALIDATE CACHE
      await invalidateUserTradingCache(trade.user);
      
      // TODO: send notification to user (email/push)
    }
  }
  res.json({ message: "Auto-sell checked" });
};
