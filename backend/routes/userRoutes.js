import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/userControllers.js";
import auth from "../auth/auth.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/profile", auth, getUserProfile);

export default router;
