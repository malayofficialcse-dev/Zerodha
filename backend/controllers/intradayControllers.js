import IntradayTrade from "../models/intradayTradeModel.js";
import StockModel from "../models/stockModel.js";

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
  res.json(trade);
};

// Get user's intraday trades
export const getUserIntraday = async (req, res) => {
  const userId = req.user.userId;
  const trades = await IntradayTrade.find({ user: userId }).populate("stock");
  res.json(trades);
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
      // TODO: send notification to user (email/push)
    }
  }
  res.json({ message: "Auto-sell checked" });
};
