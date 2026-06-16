import mongoose from "mongoose";
import PositionsModel from "./models/positionsModel.js";

const MONGO_URL = "mongodb://localhost:27017/zerodha";

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");

  await PositionsModel.deleteMany({});
  console.log("Cleared old positions");

  const dummyPositions = [
    {
      product: "MIS",
      name: "RELIANCE",
      qty: 15,
      avg: 5320.50,
      price: 5385.64,
      net: "+1.22%",
      day: "+0.85%",
      isLoss: false,
    },
    {
      product: "CNC",
      name: "ONGC",
      qty: 30,
      avg: 1980.00,
      price: 2003.47,
      net: "+1.18%",
      day: "+0.45%",
      isLoss: false,
    },
    {
      product: "MIS",
      name: "WIPRO",
      qty: 40,
      avg: 4950.00,
      price: 4907.17,
      net: "-0.86%",
      day: "-0.50%",
      isLoss: true,
    },
    {
      product: "MIS",
      name: "INFY",
      qty: 12,
      avg: 3510.00,
      price: 3526.44,
      net: "+0.46%",
      day: "+0.12%",
      isLoss: false,
    },
  ];

  await PositionsModel.insertMany(dummyPositions);
  console.log("Seeded positions successfully!");

  await mongoose.disconnect();
}

run().catch(console.error);
