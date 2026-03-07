import express from "express";
import { getRiskAnalytics, getRebalancePlan } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/risk", getRiskAnalytics);
router.post("/rebalance", getRebalancePlan);

export default router;
