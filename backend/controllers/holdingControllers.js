import HoldingModel from "../models/holdingsModel.js";
import mongoose from "mongoose";

const getAllHoldings = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Only return holdings belonging to the logged-in user
    const allData = await HoldingModel.find({ user: userId });
    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getAllHoldings };
