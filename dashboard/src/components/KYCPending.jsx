import React, { useEffect } from "react";
import "./KYCForm.css";

const KYCPending = ({ status, onRefresh, onResubmit }) => {
  useEffect(() => {
    // Poll for status update every 15 seconds automatically
    if (status === "pending") {
      const interval = setInterval(onRefresh, 15000);
      return () => clearInterval(interval);
    }
  }, [status, onRefresh]);

  return (
    <div className="kyc-form-container">
      <div className="kyc-card" style={{ textAlign: "center", maxWidth: "550px" }}>
        {status === "pending" ? (
          <>
            <div className="kyc-pending-icon" style={{ fontSize: "64px", marginBottom: "20px", animation: "pulse 2s infinite" }}>
              ⏳
            </div>
            <h2 style={{ color: "#f8fafc", marginBottom: "12px", fontSize: "24px" }}>KYC Application Under Review</h2>
            <p style={{ color: "#94a3b8", lineHeight: "1.6", marginBottom: "24px" }}>
              Thank you for submitting your KYC documents! An administrator is currently verifying your details.
              Your ₹1,000 trading balance will be unlocked once approved.
            </p>
            <div style={{ color: "#38bdf8", fontSize: "13px", marginBottom: "30px" }}>
              🔄 Auto-refreshing status...
            </div>
            <button className="kyc-btn primary" onClick={onRefresh} style={{ width: "100%" }}>
              Check Status Now
            </button>
          </>
        ) : (
          <>
            <div className="kyc-pending-icon" style={{ fontSize: "64px", marginBottom: "20px" }}>
              ❌
            </div>
            <h2 style={{ color: "#ef4444", marginBottom: "12px", fontSize: "24px" }}>KYC Application Rejected</h2>
            <p style={{ color: "#94a3b8", lineHeight: "1.6", marginBottom: "30px" }}>
              Unfortunately, your document verification could not be completed. This is usually due to mismatched PAN, Aadhaar or bank account numbers. Please review your details and re-submit the form.
            </p>
            <button className="kyc-btn primary" onClick={onResubmit} style={{ width: "100%", background: "#ef4444", color: "#fff" }}>
              Re-submit KYC Form
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default KYCPending;
