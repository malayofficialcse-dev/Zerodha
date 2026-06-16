import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  submitKYC,
  getBalance,
} from "../controllers/userControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/profile", auth, getUserProfile);
router.post("/kyc", auth, submitKYC);
router.get("/balance", auth, getBalance);

export default router;
