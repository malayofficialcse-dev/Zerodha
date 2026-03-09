import HoldingsModel from "../models/holdingsModel.js";
import StockModel from "../models/stockModel.js";
import UserModel from "../models/usersModel.js";
import redisClient from "../services/redisClient.js";
import { 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateBeta, 
  getSectorExposure 
} from "../services/riskService.js";
import crypto from 'crypto';

export const getRiskAnalytics = async (req, res) => {
  const userId = req.user?.userId || "anonymous";
  const cacheKey = `user:${userId}:analytics:risk`;

  try {
    let cachedAnalytics = null;
    if (redisClient.status === 'ready') {
      cachedAnalytics = await redisClient.get(cacheKey);
    }
    
    if (cachedAnalytics) {
      return res.json(JSON.parse(cachedAnalytics));
    }

    const holdings = await HoldingsModel.find({});
    const allStocks = await StockModel.find({});

    const generateSampleData = () => ({
      metrics: { sharpe: 1.85, beta: 0.92, maxDrawdown: 12.4 },
      sectors: [
        { name: "IT", value: 45000, percentage: 45 },
        { name: "Banking", value: 30000, percentage: 30 },
        { name: "Energy", value: 15000, percentage: 15 },
        { name: "FMCG", value: 10000, percentage: 10 }
      ],
      drawdownSeries: Array.from({ length: 15 }).map((_, i) => ({
        date: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
        drawdown: Number((Math.random() * 5 + (i < 5 ? 5 : 0)).toFixed(2))
      })),
      portfolioValue: 100000,
      isSampleData: true
    });

    if (holdings.length === 0) {
      // Provide high-quality sample data if user has no holdings yet
      return res.json(generateSampleData());
    }

    // 1. Calculate Sector Exposure
    const sectors = getSectorExposure(holdings, allStocks);

    // 2. Identify Benchmark (Nifty proxy)
    const indexStock = allStocks.find(s => s.sector === "Index") || allStocks[0];
    const indexPrices = indexStock.ohlc.map(d => d.close);
    const indexReturns = indexPrices.map((p, i) => i === 0 ? 0 : (p - indexPrices[i-1]) / indexPrices[i-1]).slice(1);

    // 3. Calculate Portfolio Daily Values (last 15 days as per seed)
    const days = indexStock.ohlc.length;
    const portfolioValues = Array(days).fill(0);

    holdings.forEach(h => {
      const stock = allStocks.find(s => s.name === h.name);
      if (stock) {
        stock.ohlc.forEach((ohlc, i) => {
          portfolioValues[i] += ohlc.close * h.qty;
        });
      }
    });

    const portfolioReturns = portfolioValues.map((v, i) => i === 0 ? 0 : (v - portfolioValues[i-1]) / portfolioValues[i-1]).slice(1);
    const finalPortfolioValue = portfolioValues[portfolioValues.length - 1];

    if (finalPortfolioValue === 0) {
      return res.json(generateSampleData());
    }

    // 4. Calculate Risk Metrics
    const sharpe = calculateSharpeRatio(portfolioReturns);
    const maxDrawdown = calculateMaxDrawdown(portfolioValues);
    const beta = calculateBeta(portfolioReturns, indexReturns);

    // 5. Generate Drawdown Series for Charting
    let peak = -Infinity;
    const drawdownSeries = portfolioValues.map((price, i) => {
      if (price > peak) peak = price;
      return {
        date: indexStock.ohlc[i].date,
        drawdown: Number(((peak - price) / peak * 100).toFixed(2))
      };
    });

    const payload = {
      metrics: { sharpe, beta, maxDrawdown },
      sectors,
      drawdownSeries,
      portfolioValue: portfolioValues[portfolioValues.length - 1]
    };

    // Cache the analytics data for 5 minutes
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 300, JSON.stringify(payload));
    }

    res.json(payload);

  } catch (error) {
    console.error("Redis Cache Error in getRiskAnalytics:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getRebalancePlan = async (req, res) => {
  const userId = req.user?.userId || "anonymous";
  const { targets } = req.body; // e.g. { Bluechip: 50, Midcap: 30, Smallcap: 10, Cash: 10 }
  
  // Hash targets so cache is specific to inputs
  const targetHash = crypto.createHash('md5').update(JSON.stringify(targets)).digest('hex');
  const cacheKey = `user:${userId}:analytics:rebalance:${targetHash}`;

  try {
    let cachedPlan = null;
    if (redisClient.status === 'ready') {
      cachedPlan = await redisClient.get(cacheKey);
    }
    
    if (cachedPlan) {
      return res.json(JSON.parse(cachedPlan));
    }

    const holdings = await HoldingsModel.find({});
    const allStocks = await StockModel.find({});
    // For demo, we'll fetch the first user or a dummy user
    const user = await UserModel.findOne({}) || { cashBalance: 100000 };
    
    const cashBalance = user.cashBalance || 0;
    let totalEquityValue = 0;
    const categoryValues = { Bluechip: 0, Midcap: 0, Smallcap: 0, Other: 0, Cash: cashBalance };

    const currentHoldingsCategorized = holdings.map(h => {
      const stock = allStocks.find(s => s.name === h.name);
      const cat = stock ? stock.assetCategory : "Other";
      const value = (stock ? stock.currentPrice : h.price) * h.qty;
      categoryValues[cat] += value;
      totalEquityValue += value;
      return { ...h._doc, category: cat, currentPrice: stock ? stock.currentPrice : h.price, value };
    });

    const totalPortfolioValue = totalEquityValue + cashBalance;

    const rebalancePlan = Object.keys(targets).map(cat => {
      const targetPct = targets[cat];
      const targetValue = (targetPct / 100) * totalPortfolioValue;
      const currentValue = categoryValues[cat] || 0;
      const diff = targetValue - currentValue;

      let recommendations = [];
      if (Math.abs(diff) > 100) { // Only recommend if diff is > 100 units
        if (cat === "Cash") {
          recommendations.push({
            action: diff > 0 ? "Deposit" : "Withdraw",
            amount: Math.abs(diff).toFixed(2),
            type: "Cash"
          });
        } else {
          // Find stocks in this category to buy/sell
          const catStocks = allStocks.filter(s => s.assetCategory === cat);
          if (catStocks.length > 0) {
            const stock = catStocks[0]; // Simplified: just pick the first one for now
            const shares = Math.floor(Math.abs(diff) / stock.currentPrice);
            if (shares > 0) {
              recommendations.push({
                action: diff > 0 ? "Buy" : "Sell",
                symbol: stock.symbol,
                name: stock.name,
                shares,
                price: stock.currentPrice,
                estimatedValue: (shares * stock.currentPrice).toFixed(2)
              });
            }
          }
        }
      }

      return {
        category: cat,
        currentValue: currentValue.toFixed(2),
        currentPct: ((currentValue / totalPortfolioValue) * 100).toFixed(2),
        targetPct,
        targetValue: targetValue.toFixed(2),
        diff: diff.toFixed(2),
        recommendations
      };
    });

    const payload = {
      totalValue: totalPortfolioValue.toFixed(2),
      equityValue: totalEquityValue.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
      plan: rebalancePlan
    };

    // Cache the rebalance plan for 5 minutes
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 300, JSON.stringify(payload));
    }

    res.json(payload);
  } catch (error) {
    console.error("Redis Cache Error in getRebalancePlan:", error);
    res.status(500).json({ error: error.message });
  }
};
