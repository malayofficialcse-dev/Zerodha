import express from "express";
import { adminLogin, listPendingKYC, approveKYC, rejectKYC } from "../controllers/adminControllers.js";
import auth from "../auth/auth.js";

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

const router = express.Router();

router.post("/login", adminLogin);
router.get("/kyc/pending", auth, adminOnly, listPendingKYC);
router.put("/kyc/:id/approve", auth, adminOnly, approveKYC);
router.put("/kyc/:id/reject", auth, adminOnly, rejectKYC);

export default router;
