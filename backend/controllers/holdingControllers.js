import HoldingModel from "../models/holdingsModel.js";
import mongoose from "mongoose";

const getAllHoldings = async (req, res) => {
  try {
    const allData = await HoldingModel.find({});
    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getAllHoldings };
