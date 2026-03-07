import express from "express";
import { getAllDashboardPositions } from "../controllers/dashboardControllers.js";

const router = express.Router();

router.get("/positions", getAllDashboardPositions);

export default router;
