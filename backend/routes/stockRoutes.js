import express from "express";
import {
  getAllStocks,
  getStockOHLC,
  updateStockPrice,
} from "../controllers/stockControllers.js";

const router = express.Router();

router.get("/all", getAllStocks);
router.get("/:symbol/ohlc", getStockOHLC);
router.post("/:symbol/update", updateStockPrice); // For simulating price update

export default router;
