import express from "express";
import { getAllHoldings } from "../controllers/holdingControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

// Get the authenticated user's holdings
router.get("/allHoldings", auth, getAllHoldings);

export default router;
