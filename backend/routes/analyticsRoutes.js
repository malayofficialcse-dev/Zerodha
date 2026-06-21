import express from "express";
import { getRiskAnalytics } from "../controllers/analyticsControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

router.get("/risk", auth, getRiskAnalytics);

export default router;
