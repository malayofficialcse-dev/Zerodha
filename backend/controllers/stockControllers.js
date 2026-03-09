import StockModel from "../models/stockModel.js";
import { calculateRSI, calculateMACD } from "../services/techIndicators.js";
import redisClient from "../services/redisClient.js";

// Get all stocks (list)
export const getAllStocks = async (req, res) => {
  const cacheKey = "stocks:all";
  
  try {
    let cachedStocks = null;
    if (redisClient.status === 'ready') {
      cachedStocks = await redisClient.get(cacheKey);
    }
    
    if (cachedStocks) {
      return res.json(JSON.parse(cachedStocks));
    }

    const stocks = await StockModel.find({}, "symbol name sector currentPrice");
    
    // Cache for 5 seconds (matching the live tick update interval)
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 5, JSON.stringify(stocks));
    }
    
    res.json(stocks);
  } catch (err) {
    console.error("Redis Cache Error in getAllStocks:", err);
    const stocks = await StockModel.find({}, "symbol name sector currentPrice");
    res.json(stocks);
  }
};

// Get OHLC data for a stock + Technical Indicators
export const getStockOHLC = async (req, res) => {
  const symbol = req.params.symbol;
  const cacheKey = `stock:ohlc:${symbol}`;

  try {
    let cachedData = null;
    if (redisClient.status === 'ready') {
      cachedData = await redisClient.get(cacheKey);
    }
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const stock = await StockModel.findOne({ symbol });
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const closes = stock.ohlc.map(d => d.close);
    const rsi = calculateRSI(closes);
    const macdData = calculateMACD(closes);

    // Merge indicators into the OHLC array for easy frontend consumption
    const enrichedData = stock.ohlc.map((d, i) => ({
      ...d.toObject(), // Convert mongoose subdocument to plain object safely
      rsi: rsi[i],
      macd: macdData.macd[i],
      signal: macdData.signal[i],
      histogram: macdData.histogram[i]
    }));

    // Cache OHLC data for 5 seconds
    if (redisClient.status === 'ready') {
      await redisClient.setex(cacheKey, 5, JSON.stringify(enrichedData));
    }

    res.json(enrichedData);
  } catch (err) {
    console.error(`Redis Cache Error in getStockOHLC for ${symbol}:`, err);
    // Fallback if Redis fails
    const stock = await StockModel.findOne({ symbol });
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    const closes = stock.ohlc.map(d => d.close);
    const rsi = calculateRSI(closes);
    const macdData = calculateMACD(closes);
    const enrichedData = stock.ohlc.map((d, i) => ({
      ...d.toObject(), rsi: rsi[i], macd: macdData.macd[i], signal: macdData.signal[i], histogram: macdData.histogram[i]
    }));
    res.json(enrichedData);
  }
};


// // Update price and push new OHLC (simulate live)
// export const updateStockPrice = async (req, res) => {
//   const { symbol } = req.params;
//   const stock = await StockModel.findOne({ symbol });
//   if (!stock) return res.status(404).json({ error: "Stock not found" });

//   // Simulate price change
//   const last = stock.ohlc[stock.ohlc.length - 1];
//   const open = last.close;
//   const close = open + (Math.random() - 0.5) * 100;
//   const high = Math.max(open, close) + Math.random() * 50;
//   const low = Math.min(open, close) - Math.random() * 50;
//   const volume = Math.floor(Math.random() * 10000 + 1000);

//   const newOHLC = {
//     date: new Date(),
//     open: Number(open.toFixed(2)),
//     high: Number(high.toFixed(2)),
//     low: Number(low.toFixed(2)),
//     close: Number(close.toFixed(2)),
//     volume,
//   };

//   stock.ohlc.push(newOHLC);
//   stock.currentPrice = newOHLC.close;
//   if (stock.ohlc.length > 100) stock.ohlc.shift(); // keep last 100
//   await stock.save();

//   res.json(newOHLC);
// };

// export const updateStockPrice = async (req, res) => {
//   const { symbol } = req.params;
//   const stock = await StockModel.findOne({ symbol });
//   if (!stock) return res.status(404).json({ error: "Stock not found" });

//   // Simulate price change
//   const last = stock.ohlc[stock.ohlc.length - 1];
//   const open = last.close;
//   const close = open + (Math.random() - 0.5) * 100;
//   const high = Math.max(open, close) + Math.random() * 50;
//   const low = Math.min(open, close) - Math.random() * 50;
//   const volume = Math.floor(Math.random() * 10000 + 1000);

//   const newOHLC = {
//     date: new Date(),
//     open: Number(open.toFixed(2)),
//     high: Number(high.toFixed(2)),
//     low: Number(low.toFixed(2)),
//     close: Number(close.toFixed(2)),
//     volume,
//   };

//   // Use atomic update to avoid version errors
//   const updated = await StockModel.findOneAndUpdate(
//     { symbol },
//     {
//       $push: { ohlc: newOHLC },
//       $set: { currentPrice: newOHLC.close },
//       $inc: { __v: 1 }
//     },
//     { new: true }
//   );

//   // Keep only last 100 OHLC entries
//   if (updated.ohlc.length > 100) {
//     updated.ohlc = updated.ohlc.slice(-100);
//     await updated.save();
//   }

//   res.json(newOHLC);
// };

export const updateStockPrice = async (req, res) => {
  const { symbol } = req.params;
  const stock = await StockModel.findOne({ symbol });
  if (!stock) return res.status(404).json({ error: "Stock not found" });

  // Simulate price change
  const last = stock.ohlc[stock.ohlc.length - 1];
  const open = last.close;
  const close = open + (Math.random() - 0.5) * 100;
  const high = Math.max(open, close) + Math.random() * 50;
  const low = Math.min(open, close) - Math.random() * 50;
  const volume = Math.floor(Math.random() * 10000 + 1000);

  const newOHLC = {
    date: new Date(),
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
    volume,
  };

  // Atomic update: push new OHLC and keep only last 100
  // await StockModel.findOneAndUpdate(
  //   { symbol },
  //   {
  //     $push: { ohlc: { $each: [newOHLC], $slice: -150 } },
  //     $set: { currentPrice: newOHLC.close },
  //     $inc: { __v: 1 },
  //   },
  //   { new: true }
  // );

  await StockModel.findOneAndUpdate(
    { symbol },
    {
      $push: { ohlc: { $each: [newOHLC], $slice: -50 } }, // Only keep last 50 in DB
      $set: { currentPrice: newOHLC.close },
      $inc: { __v: 1 },
    },
    { new: true }
  );

  res.json(newOHLC);
};
