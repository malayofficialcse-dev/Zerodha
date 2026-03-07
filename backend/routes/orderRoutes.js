import express from "express";
import {
  createNewOrder,
  getUserOrders,
} from "../controllers/orderControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

router.post("/newOrder", auth, createNewOrder);
router.get("/myOrders", auth, getUserOrders); // <-- Add this line

export default router;
