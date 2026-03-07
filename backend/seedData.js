import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./DB/connect.js";

import UserModel from "./models/usersModel.js";
import StockModel from "./models/stockModel.js";
import HoldingsModel from "./models/holdingsModel.js";
import PositionsModel from "./models/positionsModel.js";
import OrdersModel from "./models/ordersModel.js";
import IntradayModel from "./models/intradayTradeModel.js";
import DashboardModel from "./models/dashboardModel.js";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await UserModel.deleteMany({});
    await StockModel.deleteMany({});
    await HoldingsModel.deleteMany({});
    await PositionsModel.deleteMany({});
    await OrdersModel.deleteMany({});
    await IntradayModel.deleteMany({});
    await DashboardModel.deleteMany({});
    console.log("Cleared existing data.");

    // 1. Seed Users
    console.log("Seeding Users...");
    const users = [];
    const hashedPassword = await bcrypt.hash("password123", 10);
    for (let i = 1; i <= 50; i++) {
      users.push({
        username: `user_${i}`,
        email: `user${i}@zerodha.com`,
        password: hashedPassword,
      });
    }
    const createdUsers = await UserModel.insertMany(users);
    console.log("Seeded 50 users.");

    // 2. Seed Stocks
    console.log("Seeding Stocks...");
    const stocks = [];
    const sectors = ["IT", "Banking", "Energy", "FMCG", "Auto", "Crypto", "Index"];
    const baseCompanies = [
      "Reliance", "TCS", "HDFC Bank", "Infosys", "ICICI Bank", 
      "HUL", "SBI", "Bharti Airtel", "LIC", "ITC"
    ];
    for (let i = 1; i <= 50; i++) {
      const currentPrice = Math.random() * 5000 + 100;
      const baseName = baseCompanies[i % baseCompanies.length];
      stocks.push({
        symbol: `${baseName.split(' ')[0].toUpperCase()}_${i}`,
        name: `${baseName} Vol ${i}`,
        sector: sectors[Math.floor(Math.random() * sectors.length)],
        currentPrice: Number(currentPrice.toFixed(2)),
        ohlc: Array.from({ length: 15 }).map((_, j) => ({
          date: new Date(Date.now() - (15 - j) * 24 * 60 * 60 * 1000),
          open: Number((currentPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)),
          high: Number((currentPrice * (1 + Math.random() * 0.08)).toFixed(2)),
          low: Number((currentPrice * (1 - Math.random() * 0.08)).toFixed(2)),
          close: Number((currentPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)),
          volume: Math.floor(Math.random() * 1000000),
        })),
      });
    }
    const createdStocks = await StockModel.insertMany(stocks);
    console.log("Seeded 50 stocks.");

    // 3. Seed Holdings
    console.log("Seeding Holdings...");
    const holdings = [];
    for (let i = 1; i <= 50; i++) {
      const stock = createdStocks[i % 50];
      const avg = stock.currentPrice * (1 + (Math.random() - 0.5) * 0.2);
      holdings.push({
        name: stock.name,
        qty: Math.floor(Math.random() * 100) + 1,
        avg: Number(avg.toFixed(2)),
        price: stock.currentPrice,
        net: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5).toFixed(2) + "%",
        day: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 2).toFixed(2) + "%",
        isLoss: Math.random() > 0.7,
      });
    }
    await HoldingsModel.insertMany(holdings);
    console.log("Seeded 50 holdings.");

    // 4. Seed Positions
    console.log("Seeding Positions...");
    const positions = [];
    for (let i = 1; i <= 50; i++) {
      const stock = createdStocks[(i + 10) % 50];
      const avg = stock.currentPrice * (1 + (Math.random() - 0.5) * 0.1);
      positions.push({
        product: Math.random() > 0.5 ? "MIS" : "CNC",
        name: stock.name,
        qty: Math.floor(Math.random() * 50) + 1,
        avg: Number(avg.toFixed(2)),
        price: stock.currentPrice,
        net: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 10).toFixed(2) + "%",
        day: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5).toFixed(2) + "%",
        isLoss: Math.random() > 0.6,
      });
    }
    await PositionsModel.insertMany(positions);
    console.log("Seeded 50 positions.");

    // 5. Seed Orders
    console.log("Seeding Orders...");
    const orders = [];
    for (let i = 1; i <= 50; i++) {
      const user = createdUsers[Math.floor(Math.random() * 50)];
      const stock = createdStocks[Math.floor(Math.random() * 50)];
      orders.push({
        name: stock.symbol,
        qty: Math.floor(Math.random() * 20) + 1,
        price: Number((stock.currentPrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
        mode: Math.random() > 0.5 ? "BUY" : "SELL",
        user: user._id,
      });
    }
    await OrdersModel.insertMany(orders);
    console.log("Seeded 50 orders.");

    // 6. Seed IntradayTrades
    console.log("Seeding Intraday Trades...");
    const intradayTrades = [];
    for (let i = 1; i <= 50; i++) {
      const user = createdUsers[Math.floor(Math.random() * 50)];
      const stock = createdStocks[Math.floor(Math.random() * 50)];
      const buyPrice = stock.currentPrice;
      const status = Math.random() > 0.5 ? "CLOSED" : "OPEN";
      intradayTrades.push({
        user: user._id,
        stock: stock._id,
        symbol: stock.symbol,
        qty: Math.floor(Math.random() * 10) + 1,
        buyPrice: Number(buyPrice.toFixed(2)),
        sellPrice: status === "CLOSED" ? Number((buyPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)) : null,
        status: status,
        limitType: ["NONE", "STOPLOSS", "TARGET"][Math.floor(Math.random() * 3)],
        profitOrLoss: status === "CLOSED" ? Number(((Math.random() - 0.4) * 500).toFixed(2)) : 0,
      });
    }
    await IntradayModel.insertMany(intradayTrades);
    console.log("Seeded 50 intraday trades.");

    // 7. Seed Dashboard
    console.log("Seeding Dashboard...");
    const dashboard = [];
    for (let i = 1; i <= 50; i++) {
      dashboard.push({
        name: i % 2 === 0 ? "Equity" : "Commodity",
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Number((Math.random() * 50000).toFixed(2)),
      });
    }
    await DashboardModel.insertMany(dashboard);
    console.log("Seeded 50 dashboard entries.");

    console.log("\nSUCCESS: All schemas seeded with 50 entries each.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
