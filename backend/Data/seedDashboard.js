import mongoose from "mongoose";
import DashboardModel from "../models/dashboardModel.js"; // Use your dashboardModel.js

const data = [
  // RELIANCE
  { name: "RELIANCE", date: "2024-03-01", value: 1200 },
  { name: "RELIANCE", date: "2024-04-01", value: 1250 },
  { name: "RELIANCE", date: "2024-05-01", value: 1190 },
  { name: "RELIANCE", date: "2024-06-01", value: 1300 },
  { name: "RELIANCE", date: "2024-07-01", value: 1270 },
  { name: "RELIANCE", date: "2024-08-01", value: 1350 },

  // TCS
  { name: "TCS", date: "2024-03-01", value: 1100 },
  { name: "TCS", date: "2024-04-01", value: 1120 },
  { name: "TCS", date: "2024-05-01", value: 1080 },
  { name: "TCS", date: "2024-06-01", value: 1150 },
  { name: "TCS", date: "2024-07-01", value: 1130 },
  { name: "TCS", date: "2024-08-01", value: 1170 },

  // INFY
  { name: "INFY", date: "2024-03-01", value: 950 },
  { name: "INFY", date: "2024-04-01", value: 980 },
  { name: "INFY", date: "2024-05-01", value: 960 },
  { name: "INFY", date: "2024-06-01", value: 1000 },
  { name: "INFY", date: "2024-07-01", value: 970 },
  { name: "INFY", date: "2024-08-01", value: 1020 },

  // HDFCBANK
  { name: "HDFCBANK", date: "2024-03-01", value: 980 },
  { name: "HDFCBANK", date: "2024-04-01", value: 1000 },
  { name: "HDFCBANK", date: "2024-05-01", value: 970 },
  { name: "HDFCBANK", date: "2024-06-01", value: 1050 },
  { name: "HDFCBANK", date: "2024-07-01", value: 1020 },
  { name: "HDFCBANK", date: "2024-08-01", value: 1070 },

  // ICICIBANK
  { name: "ICICIBANK", date: "2024-03-01", value: 870 },
  { name: "ICICIBANK", date: "2024-04-01", value: 900 },
  { name: "ICICIBANK", date: "2024-05-01", value: 860 },
  { name: "ICICIBANK", date: "2024-06-01", value: 920 },
  { name: "ICICIBANK", date: "2024-07-01", value: 910 },
  { name: "ICICIBANK", date: "2024-08-01", value: 950 },
];

mongoose
  .connect(
    "mongodb+srv://maitymalay334:6Da4yZNwAHU1lGVD@cluster0.ryfdubj.mongodb.net/Zerodha?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    await DashboardModel.deleteMany({});
    await DashboardModel.insertMany(data);
    console.log("Seeded positions data!");
    process.exit();
  });

// import mongoose from "mongoose";
// import DashboardModel from "../models/dashboardModel.js"; // Use your dashboardModel.js

// mongoose
//   .connect(
//     "mongodb+srv://maitymalay334:6Da4yZNwAHU1lGVD@cluster0.ryfdubj.mongodb.net/Zerodha?retryWrites=true&w=majority&appName=Cluster0",
//     {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     }
//   )
//   .then(async () => {
//     await DashboardModel.deleteMany({}); // This deletes all documents in the collection
//     console.log("All DashboardModel data deleted!");
//     process.exit();
//   });
