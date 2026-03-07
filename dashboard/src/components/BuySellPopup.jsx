import React, { useState } from "react";
import axios from "axios";
import "./CandleChartIntraday.css";
import { API_BASE_URL } from "../config/config.js"; // adjust path as needed

const BuySellPopup = ({ type, onClose, trade, symbol }) => {
  const [qty, setQty] = useState(trade?.qty || 1);
  const [price, setPrice] = useState("");
  const [limitType, setLimitType] = useState("NONE");
  const [limitValue, setLimitValue] = useState("");
  const [message, setMessage] = useState("");

  function isMarketOpen() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const marketOpen = new Date(`${yyyy}-${mm}-${dd}T09:00:00`).getTime();
    const marketClose = new Date(`${yyyy}-${mm}-${dd}T22:00:00`).getTime();
    const nowTime = now.getTime();
    return nowTime >= marketOpen && nowTime <= marketClose;
  }

  const handleTrade = async () => {
    if (!isMarketOpen()) {
      setMessage(
        "Market is closed. You can trade only between 9:00 and 22:00."
      );
      return;
    }
    try {
      if (type === "BUY") {
        await axios.post(
          `${API_BASE_URL}/intraday/buy`,
          {
            symbol,
            qty,
            buyPrice: price,
            limitType,
            limitValue: limitType !== "NONE" ? limitValue : null,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessage("Buy order placed!");
      } else {
        await axios.post(
          `${API_BASE_URL}/intraday/sell`,
          {
            tradeId: trade?._id,
            sellPrice: price,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessage("Sell order placed!");
      }
    } catch (err) {
      setMessage("Error placing order.");
    }
  };

  return (
    <div className="intraday-popup">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h3>
        {type} {symbol}
      </h3>
      <div>
        <label>Quantity:</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </div>
      <div>
        <label>Price:</label>
        <input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      {type === "BUY" && (
        <div>
          <label>Limit Type:</label>
          <select
            value={limitType}
            onChange={(e) => setLimitType(e.target.value)}
          >
            <option value="NONE">None</option>
            <option value="STOPLOSS">Stop Loss</option>
            <option value="TARGET">Target</option>
          </select>
          {limitType !== "NONE" && (
            <input
              type="number"
              min="0"
              placeholder="Limit Value"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
            />
          )}
        </div>
      )}
      <button className="trade-btn" onClick={handleTrade}>
        {type}
      </button>
      {message && <div className="trade-message">{message}</div>}
      {/* Show profit/loss and company name after sell */}
      {type === "SELL" && trade && typeof trade.profitOrLoss === "number" && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <span
            style={{
              color: trade.profitOrLoss >= 0 ? "#38a169" : "#e53e3e",
              fontWeight: "bold",
            }}
          >
            {trade.profitOrLoss >= 0 ? "+" : "-"}₹
            {Math.abs(trade.profitOrLoss).toFixed(2)}
          </span>
          <div style={{ fontSize: "14px", marginTop: "4px", color: "#555" }}>
            {trade.symbol || symbol}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuySellPopup;
