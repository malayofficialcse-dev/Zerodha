import express from "express";
import { getAllPositions } from "../controllers/positionControllers.js";

const router = express.Router();

router.get("/allPositions", getAllPositions);

export default router;
