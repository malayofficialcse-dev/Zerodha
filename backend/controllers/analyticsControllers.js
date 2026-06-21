import {
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateBeta,
  getSectorExposure
} from "../services/riskService.js";
import { ensureUserHoldings } from "../utils/holdingHelper.js";
import StockModel from "../models/stockModel.js";
import redisClient from "../services/redisClient.js";

export const getRiskAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `user:${userId}:analytics:risk`;

    // Try to get from Redis cache
    let cachedAnalytics = null;
    if (redisClient.status === 'ready') {
      cachedAnalytics = await redisClient.get(cacheKey);
    }
    if (cachedAnalytics) {
      return res.json(JSON.parse(cachedAnalytics));
    }

    // 1. Ensure user has holdings seeded, and fetch them
    const userHoldings = await ensureUserHoldings(userId);

    // 2. Fetch all stocks from the database
    const stocks = await StockModel.find({});

    if (userHoldings.length === 0 || stocks.length === 0) {
      return res.json({
        metrics: { sharpe: 0, beta: 1, maxDrawdown: 0 },
        sectors: []
      });
    }

    // 3. Compute portfolio values over the last 30 days based on stock history
    const daysCount = 30;
    const portfolioPrices = Array(daysCount).fill(0);

    for (let t = 0; t < daysCount; t++) {
      let dayValue = 0;
      for (const h of userHoldings) {
        // Match stock by name or symbol
        const stock = stocks.find(s => s.name === h.name || s.symbol === h.symbol);
        if (stock && stock.ohlc && stock.ohlc[t]) {
          dayValue += h.qty * stock.ohlc[t].close;
        } else if (stock) {
          dayValue += h.qty * stock.currentPrice;
        }
      }
      portfolioPrices[t] = dayValue;
    }

    // 4. Calculate periodic returns for the portfolio
    const assetReturns = [];
    for (let i = 1; i < portfolioPrices.length; i++) {
      const prev = portfolioPrices[i - 1];
      if (prev > 0) {
        assetReturns.push((portfolioPrices[i] - prev) / prev);
      } else {
        assetReturns.push(0);
      }
    }

    // 5. Calculate periodic returns for the index (NIFTY)
    const niftyStock = stocks.find(s => s.symbol === "NIFTY");
    const indexReturns = [];
    if (niftyStock && niftyStock.ohlc) {
      for (let i = 1; i < niftyStock.ohlc.length; i++) {
        const prev = niftyStock.ohlc[i - 1].close;
        if (prev > 0) {
          indexReturns.push((niftyStock.ohlc[i].close - prev) / prev);
        } else {
          indexReturns.push(0);
        }
      }
    } else {
      // Fallback index returns
      for (let i = 1; i < daysCount; i++) {
        indexReturns.push((Math.random() - 0.5) * 0.01);
      }
    }

    // 6. Compute Sharpe Ratio, Beta, Max Drawdown, and Sector exposure
    const sharpe = calculateSharpeRatio(assetReturns);
    const maxDrawdown = calculateMaxDrawdown(portfolioPrices);
    const beta = calculateBeta(assetReturns, indexReturns);
    const sectors = getSectorExposure(userHoldings, stocks);

    const responseData = {
      metrics: {
        sharpe,
        beta,
        maxDrawdown
      },
      sectors
    };

    // Cache the analytics response in Redis for 60 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 60, JSON.stringify(responseData));
    }

    res.json(responseData);
  } catch (err) {
    console.error("Error in getRiskAnalytics controller:", err);
    res.status(500).json({ error: err.message });
  }
};
