import express from "express";
import { getAllHoldings } from "../controllers/holdingControllers.js";

const router = express.Router();
router.get("/allHoldings", getAllHoldings);

export default router;
