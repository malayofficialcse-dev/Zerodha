import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "../config/config.js"; // adjust path as needed

const UserProfile = () => {
  const [user, setUser] = useState({ username: "", email: "" });
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("User fetch error:", err);
      }
    };

    const fetchTrades = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/intraday/my`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTrades(res.data);
      } catch (err) {
        console.error("Trade fetch error:", err);
      }
    };

    fetchUser();
    fetchTrades();
  }, []);

  return (
    <div className="container col-8">
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">User Profile</h3>
          <p className="card-text">
            <strong>Name:</strong> {user.username}
          </p>
          <p className="card-text">
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h4 className="card-title">Trade History</h4>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Buy</th>
                  <th>Sell</th>
                  <th>P/L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t._id}>
                    <td>{t.symbol}</td>
                    <td>{t.qty}</td>
                    <td>₹{t.buyPrice}</td>
                    <td>{t.sellPrice ? `₹${t.sellPrice}` : "-"}</td>
                    <td
                      className={
                        t.profitOrLoss > 0
                          ? "text-success fw-bold"
                          : t.profitOrLoss < 0
                          ? "text-danger fw-bold"
                          : "text-muted"
                      }
                    >
                      {t.profitOrLoss > 0
                        ? `+₹${t.profitOrLoss}`
                        : t.profitOrLoss < 0
                        ? `-₹${Math.abs(t.profitOrLoss)}`
                        : "₹0"}
                    </td>
                    <td
                      className={
                        t.status === "OPEN"
                          ? "text-success fw-semibold"
                          : "text-danger fw-semibold"
                      }
                    >
                      {t.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add this logout button */}
      <div className="text-center mt-4">
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
