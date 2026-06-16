import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Menu from "./Menu";
import KYCForm from "./KYCForm";
import KYCPending from "./KYCPending";
import AdminPanel from "./AdminPanel";
import GeneralContext, { GeneralContextProvider } from "./GeneralContext";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";

const Home = () => {
  return (
    <GeneralContextProvider>
      <HomeContent />
    </GeneralContextProvider>
  );
};

const HomeContent = () => {
  const { isSidebarOpen } = React.useContext(GeneralContext);
  const [kycStatus, setKycStatus] = useState("loading"); // loading, none, pending, approved, rejected
  const isAdminPath = window.location.pathname === "/admin";

  const checkKycStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setKycStatus("unauthenticated");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/user/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(res.data.kycStatus || "none");
    } catch (err) {
      console.error("Failed to check KYC status:", err);
      setKycStatus("unauthenticated");
    }
  };

  useEffect(() => {
    if (!isAdminPath) {
      checkKycStatus();
    }
  }, [isAdminPath]);

  // Admin view bypasses KYC gating entirely
  if (isAdminPath) {
    return <AdminPanel />;
  }

  if (kycStatus === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f172a", color: "#cbd5e1" }}>
        <div>Loading your profile...</div>
      </div>
    );
  }

  if (kycStatus === "unauthenticated") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f172a", color: "#cbd5e1", flexDirection: "column", gap: "12px" }}>
        <h2>Access Denied</h2>
        <p style={{ color: "#94a3b8" }}>Please login with a valid session token to trade.</p>
      </div>
    );
  }

  if (kycStatus === "none") {
    return <KYCForm onKycSubmitted={checkKycStatus} />;
  }

  if (kycStatus === "pending") {
    return <KYCPending status="pending" onRefresh={checkKycStatus} />;
  }

  if (kycStatus === "rejected") {
    return <KYCPending status="rejected" onRefresh={checkKycStatus} onResubmit={() => setKycStatus("none")} />;
  }

  // kycStatus === "approved"
  return (
    <div className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Menu />
      <TopBar />
      <Dashboard />
    </div>
  );
};

export default Home;
