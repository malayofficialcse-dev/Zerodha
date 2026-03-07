import PositionsModel from "../models/positionsModel.js";

const getAllPositions = async (req, res) => {
  try {
    const allPositions = await PositionsModel.find({});
    res.json(allPositions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getAllPositions };
