// import OrdersModel from "../models/ordersModel.js";
// import mongoose from "mongoose";

// export const getUserOrders = async (req, res) => {
//   try {
//     const userId = req.user.userId; // comes from auth middleware
//     const orders = await OrdersModel.find({ user: userId });
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // export const createNewOrder = async (req, res) => {
// //   try {
// //     const { name, qty, price, mode } = req.body;
// //     const userId = req.user.userId;

// //     if (mode === "SELL") {
// //       // Calculate total bought and sold for this stock by this user
// //       const buyAgg = await OrdersModel.aggregate([
// //         {
// //           $match: { user: mongoose.Types.ObjectId(userId), name, mode: "BUY" },
// //         },
// //         { $group: { _id: null, total: { $sum: "$qty" } } },
// //       ]);
// //       const sellAgg = await OrdersModel.aggregate([
// //         {
// //           $match: { user: mongoose.Types.ObjectId(userId), name, mode: "SELL" },
// //         },
// //         { $group: { _id: null, total: { $sum: "$qty" } } },
// //       ]);
// //       const totalBought = buyAgg[0]?.total || 0;
// //       const totalSold = sellAgg[0]?.total || 0;
// //       const available = totalBought - totalSold;

// //       if (qty > available) {
// //         return res.status(400).json({ error: "Not enough stock to sell" });
// //       }
// //     }

// //     const newOrder = new OrdersModel({
// //       name,
// //       qty,
// //       price,
// //       mode,
// //       user: userId,
// //     });
// //     await newOrder.save();
// //     res.send("Order saved");
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // };

// export const createNewOrder = async (req, res) => {
//   try {
//     const { name, qty, price, mode } = req.body;
//     const userId = req.user.userId;

//     // Debug: log inputs
//     console.log("Sell order input:", { name, qty, price, mode, userId });

//     // Validate input
//     if (!name || !qty || !price || !mode) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }
//     if (typeof qty !== "number" || qty <= 0) {
//       return res.status(400).json({ error: "Invalid quantity" });
//     }
//     if (typeof price !== "number" || price <= 0) {
//       return res.status(400).json({ error: "Invalid price" });
//     }

//     if (mode === "SELL") {
//       // Calculate total bought and sold for this stock by this user
//       // const buyAgg = await OrdersModel.aggregate([
//       //   {
//       //     $match: { user: mongoose.Types.ObjectId(userId), name, mode: "BUY" },
//       //   },
//       //   { $group: { _id: null, total: { $sum: "$qty" } } },
//       // ]);
//       // const sellAgg = await OrdersModel.aggregate([
//       //   {
//       //     $match: { user: mongoose.Types.ObjectId(userId), name, mode: "SELL" },
//       //   },
//       //   { $group: { _id: null, total: { $sum: "$qty" } } },
//       // ]);

//       const buyAgg = await OrdersModel.aggregate([
//         {
//           $match: {
//             user: new mongoose.Types.ObjectId(userId),
//             name,
//             mode: "BUY",
//           },
//         },
//         { $group: { _id: null, total: { $sum: "$qty" } } },
//       ]);
//       const sellAgg = await OrdersModel.aggregate([
//         {
//           $match: {
//             user: new mongoose.Types.ObjectId(userId),
//             name,
//             mode: "SELL",
//           },
//         },
//         { $group: { _id: null, total: { $sum: "$qty" } } },
//       ]);
//       const totalBought = buyAgg[0]?.total || 0;
//       const totalSold = sellAgg[0]?.total || 0;
//       const available = totalBought - totalSold;

//       console.log("Available to sell:", available);

//       if (qty > available) {
//         return res.status(400).json({ error: "Not enough stock to sell" });
//       }
//     }

//     const newOrder = new OrdersModel({
//       name,
//       qty,
//       price,
//       mode,
//       user: userId,
//     });
//     await newOrder.save();
//     res.send("Order saved");
//   } catch (err) {
//     console.error("Order error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

import OrdersModel from "../models/ordersModel.js";
import HoldingModel from "../models/holdingsModel.js";
import mongoose from "mongoose";

// Get all orders for the logged-in user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await OrdersModel.find({ user: userId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new order (BUY or SELL)
export const createNewOrder = async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    const userId = req.user.userId;

    // Debug: log inputs
    console.log("Order input:", { name, qty, price, mode, userId });

    // Validate input
    if (!name || !qty || !price || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    if (mode === "SELL") {
      // Calculate total bought and sold for this stock by this user
      const buyAgg = await OrdersModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            name,
            mode: "BUY",
          },
        },
        { $group: { _id: null, total: { $sum: "$qty" } } },
      ]);
      const sellAgg = await OrdersModel.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            name,
            mode: "SELL",
          },
        },
        { $group: { _id: null, total: { $sum: "$qty" } } },
      ]);
      const totalBought = buyAgg[0]?.total || 0;
      const totalSold = sellAgg[0]?.total || 0;
      const available = totalBought - totalSold;

      console.log("Available to sell:", available);

      if (qty > available) {
        return res.status(400).json({ error: "Not enough stock to sell" });
      }
    }

    const newOrder = new OrdersModel({
      name,
      qty,
      price,
      mode,
      user: userId,
    });
    await newOrder.save();

    // --- Synchronize with user Holdings ---
    let holding = await HoldingModel.findOne({ user: userId, name });

    if (mode === "BUY") {
      if (holding) {
        // Recalculate average cost based on previously owned qty + new qty
        const totalCostBefore = holding.qty * holding.avg;
        const newCost = qty * price;
        const totalQty = holding.qty + qty;
        holding.avg = (totalCostBefore + newCost) / totalQty;
        holding.qty = totalQty;
        await holding.save();
      } else {
        // Create new holding
        await HoldingModel.create({
          user: userId,
          name,
          qty,
          avg: price,
          price, // LTP fallback
          net: "0.00%",
          day: "0.00%",
          isLoss: false,
        });
      }
    } else if (mode === "SELL") {
      if (holding) {
        holding.qty -= qty;
        if (holding.qty <= 0) {
          // If all shares sold, remove holding entirely
          await HoldingModel.deleteOne({ _id: holding._id });
        } else {
          await holding.save();
        }
      }
    }

    res.send("Order saved and holdings updated");
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: err.message });
  }
};
