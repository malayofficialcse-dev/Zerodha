import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../config/config.js";

import Summary from "./Summary";
import Orders from "./Orders";
import Holdings from "./Holdings";
import Positions from "./Positions";
import WatchList from "./WatchList";
import Charts from "./Charts";
import Intraday from "./Intraday";
import Alerts from "./Alerts";
import UserProfile from "./UserProfile";

import DashboardChart from "./DashboardChart";
import QuickTradeOverlay from "./QuickTradeOverlay";
import GeneralContext from "./GeneralContext";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";



const Dashboard = () => {
  const { isSidebarOpen, toggleSidebar } = React.useContext(GeneralContext);

  useEffect(() => {
    // Listen for global price alerts
    const socketURL = API_BASE_URL.replace("/api", "");
    const socket = io(socketURL);

    const saveNotification = (newNotif) => {
      try {
        const existing = JSON.parse(localStorage.getItem("notifications") || "[]");
        existing.unshift(newNotif);
        localStorage.setItem("notifications", JSON.stringify(existing.slice(0, 50)));
        window.dispatchEvent(new Event("new-notification"));
      } catch (err) {
        console.error("Error saving notification:", err);
      }
    };

    socket.on("price-alert", (alert) => {
      const msg = `🔔 Alert: ${alert.symbol} hit ₹${alert.currentPrice.toFixed(2)} (${alert.condition} ₹${alert.targetPrice})`;
      toast.info(msg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      saveNotification({
        id: Math.random().toString(),
        type: "price-alert",
        text: msg,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    socket.on("position-alert", (alert) => {
      const msg = `🚨 STOP-LOSS / TARGET HIT: Intraday ${alert.symbol} position closed at ₹${alert.triggerPrice.toFixed(2)} (${alert.limitType} of ₹${alert.limitValue.toFixed(2)} reached). P&L: ₹${alert.pnl.toFixed(2)}`;
      toast.error(msg, {
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      saveNotification({
        id: Math.random().toString(),
        type: "position-alert",
        text: msg,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="dashboard-container">
      <SidebarToggle isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <WatchList />
      <div className="content">
        <Routes>
          <Route index element={<Summary />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/intraday" element={<Intraday />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<Summary />} />

        </Routes>
      </div>
      <QuickTradeOverlay />
      <ToastContainer />
    </div>
  );
};

const SidebarToggle = ({ isOpen, toggle }) => (
  <button
    className="sidebar-toggle-btn"
    onClick={toggle}
    title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
  >
    {isOpen ? <ChevronLeft /> : <ChevronRight />}
  </button>
);

export default Dashboard;
