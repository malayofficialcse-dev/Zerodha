import HoldingModel from "../models/holdingsModel.js";
import StockModel from "../models/stockModel.js";

/**
 * Ensures the user has at least 4-5 stock holdings so the dashboard displays actual data instead of 0s.
 * If the user already has holdings, returns them.
 */
export const ensureUserHoldings = async (userId) => {
  let existing = await HoldingModel.find({ user: userId });

  // Self-healing: if any existing holding has a name with spaces (meaning it was seeded with company name, not symbol), delete it.
  const hasBadSeeding = existing.some(h => h.name && h.name.includes(" "));
  if (hasBadSeeding) {
    console.log(`[HoldingHelper] Found bad seeded holdings for user ${userId}. Re-clearing and re-seeding...`);
    await HoldingModel.deleteMany({ user: userId });
    existing = [];
  }

  if (existing.length > 0) {
    return existing;
  }

  // Find all available stocks from the database
  const stocks = await StockModel.find({});
  if (stocks.length === 0) return [];

  // Sort/filter to pick a diverse set of prominent bluechips first
  const preferredSymbols = ["INFY", "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "ITC", "WIPRO", "HUL"];
  const selectedStocks = stocks.filter(s => preferredSymbols.includes(s.symbol));
  
  // Fallback to any stocks if preferred list is empty or small
  const finalStocksList = selectedStocks.length >= 4 ? selectedStocks : stocks.slice(0, 5);

  const seeded = [];
  // Seed 4-5 holdings for the user
  for (const stock of finalStocksList.slice(0, 5)) {
    const qty = Math.floor(Math.random() * 80) + 15; // 15 to 95 shares
    // Buy price is close to the current price (with a small random drift of ±10%)
    const avg = stock.currentPrice * (1 + (Math.random() - 0.5) * 0.15);

    const holding = await HoldingModel.create({
      user: userId,
      name: stock.symbol, // <-- CRITICAL FIX: set name as stock.symbol, not stock.name
      qty: qty,
      avg: Number(avg.toFixed(2)),
      price: stock.currentPrice,
      net: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5).toFixed(2) + "%",
      day: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 2).toFixed(2) + "%",
      isLoss: Math.random() > 0.6,
    });
    seeded.push(holding);
  }

  return seeded;
};
