import StockModel from "../models/stockModel.js";
import { calculateRSI, calculateMACD } from "../services/techIndicators.js";

// Get all stocks (list)
export const getAllStocks = async (req, res) => {
  const stocks = await StockModel.find({}, "symbol name sector currentPrice");
  res.json(stocks);
};

// Get OHLC data for a stock + Technical Indicators
export const getStockOHLC = async (req, res) => {
  const stock = await StockModel.findOne({ symbol: req.params.symbol });
  if (!stock) return res.status(404).json({ error: "Stock not found" });

  const closes = stock.ohlc.map(d => d.close);
  const rsi = calculateRSI(closes);
  const macdData = calculateMACD(closes);

  // Merge indicators into the OHLC array for easy frontend consumption
  const enrichedData = stock.ohlc.map((d, i) => ({
    ...d._doc, // spread the mongoose document
    rsi: rsi[i],
    macd: macdData.macd[i],
    signal: macdData.signal[i],
    histogram: macdData.histogram[i]
  }));

  res.json(enrichedData);
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
