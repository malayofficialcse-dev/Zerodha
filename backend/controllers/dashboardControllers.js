import DashboardModel from "../models/dashboardModel.js";

export const getAllDashboardPositions = async (req, res) => {
  try {
    const positions = await DashboardModel.find({});
    res.json(positions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard positions" });
  }
};
