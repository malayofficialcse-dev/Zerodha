import StockModel from "../models/stockModel.js";
import redisClient from "../services/redisClient.js";

/**
 * Computes the Pearson correlation coefficient between two arrays of numbers.
 * Returns a value between -1 and +1.
 */
function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const ax = x.slice(0, n);
  const ay = y.slice(0, n);

  const meanX = ax.reduce((s, v) => s + v, 0) / n;
  const meanY = ay.reduce((s, v) => s + v, 0) / n;

  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = ax[i] - meanX;
    const dy = ay[i] - meanY;
    num   += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : Number((num / denom).toFixed(4));
}

/**
 * GET /api/stocks/correlation
 * Returns a full N×N correlation matrix (close-price returns)
 * for all stocks in the DB, computed from OHLC history.
 *
 * Response shape:
 * {
 *   symbols: ["RELIANCE", "TCS", ...],
 *   matrix:  [[1, 0.87, ...], [0.87, 1, ...], ...]
 * }
 */
export const getCorrelationMatrix = async (req, res) => {
  const cacheKey = "analytics:correlation";

  try {
    let cachedData = null;
    if (redisClient.status === 'ready') {
      cachedData = await redisClient.get(cacheKey);
    }
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Fetch only required fields — no need for the whole document
    const stocks = await StockModel.find({}, "symbol name sector ohlc");

    if (!stocks || stocks.length === 0) {
      return res.status(404).json({ error: "No stock data found." });
    }

    // Build per-symbol arrays of daily log-returns from close prices
    // Using returns (not raw prices) gives a much more meaningful correlation
    const symbolReturns = {};
    const symbolMeta    = {};

    stocks.forEach((stock) => {
      const closes = stock.ohlc.map((d) => d.close).filter(Number.isFinite);

      // Convert to percentage returns: (p[i] - p[i-1]) / p[i-1]
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        if (closes[i - 1] !== 0) {
          returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
      }

      // Only include stocks that have enough data points
      if (returns.length >= 2) {
        symbolReturns[stock.symbol] = returns;
        symbolMeta[stock.symbol]    = { name: stock.name, sector: stock.sector };
      }
    });

    const symbols = Object.keys(symbolReturns).sort();
    const n       = symbols.length;

    // Build the N×N matrix
    const matrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 1; // perfect self-correlation
        const corr = pearsonCorrelation(
          symbolReturns[symbols[i]],
          symbolReturns[symbols[j]]
        );
        return corr;
      })
    );

    const payload = {
      symbols,
      meta:   symbolMeta,   // { SYMBOL: { name, sector } }
      matrix,
      computedAt: new Date().toISOString(),
    };

    // Cache the heavy calculation result for 1 hour
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(payload));
    }

    return res.json(payload);
  } catch (err) {
    console.error("Correlation matrix error:", err.message);
    return res.status(500).json({ error: "Failed to compute correlation matrix." });
  }
};
