import express from "express";
import StockModel from "../models/stockModel.js";
import {
  buyIntraday,
  sellIntraday,
  getUserIntraday,
  autoSellIntraday,
} from "../controllers/intradayControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

router.post("/buy", auth, buyIntraday);
router.post("/sell", auth, sellIntraday);
router.get("/my", auth, getUserIntraday);
// router.post("/auto-sell", autoSellIntraday); // can be called by cron
// router.get("/:symbol/intraday-ohlc", async (req, res) => {
//   const { symbol } = req.params;
//   // Fetch last 1 day's OHLC for this symbol (from your intraday collection or StockModel)
//   const stock = await StockModel.findOne({ symbol });
//   if (!stock) return res.status(404).json({ error: "Stock not found" });
//   // Assume stock.ohlcIntraday is an array of today's OHLC
//   res.json(stock.ohlcIntraday || []);
// });

// router.get("/:symbol/intraday-ohlc", async (req, res) => {
//   const { symbol } = req.params;
//   const stock = await StockModel.findOne({ symbol });
//   if (!stock) return res.status(404).json({ error: "Stock not found" });
//   res.json(stock.ohlcIntraday || []);
// });

router.get("/:symbol/intraday-ohlc", async (req, res) => {
  const { symbol } = req.params;
  const stock = await StockModel.findOne({ symbol });
  if (!stock) return res.status(404).json({ error: "Stock not found" });
  // Use ohlc for demo if ohlcIntraday is missing
  res.json(
    stock.ohlcIntraday && stock.ohlcIntraday.length > 0
      ? stock.ohlcIntraday
      : stock.ohlc || []
  );
});

export default router;
