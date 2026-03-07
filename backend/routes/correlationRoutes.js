import express from "express";
import { getCorrelationMatrix } from "../controllers/correlationController.js";

const router = express.Router();

// GET /api/correlation  — returns the full N×N matrix
router.get("/", getCorrelationMatrix);

export default router;
