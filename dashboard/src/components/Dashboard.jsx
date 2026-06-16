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

    socket.on("price-alert", (alert) => {
      toast.info(
        `🔔 Alert: ${alert.symbol} hit ₹${alert.currentPrice.toFixed(2)} (${alert.condition} ₹${alert.targetPrice})`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        }
      );
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
          <Route path="/dashboard" element={<DashboardChart />} />

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
