import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BuySellPopup.css";
import { API_BASE_URL } from "../config/config.js";

const BuySellPopup = ({ type, onClose, trade, symbol }) => {
  const [qty, setQty] = useState(trade?.qty || 1);
  const [price, setPrice] = useState("");
  const [limitType, setLimitType] = useState("NONE");
  const [limitValue, setLimitValue] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success"); // "success" | "error"
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);

  // ── Auto-fetch live price on open ──
  useEffect(() => {
    if (!symbol) return;
    setIsFetchingPrice(true);
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .then((res) => {
        const stock = res.data.find((s) => s.symbol === symbol);
        if (stock && stock.currentPrice) {
          setPrice(Number(stock.currentPrice).toFixed(2));
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingPrice(false));
  }, [symbol]);

  function isMarketOpen() {
    const now      = new Date();
    const yyyy     = now.getFullYear();
    const mm       = String(now.getMonth() + 1).padStart(2, "0");
    const dd       = String(now.getDate()).padStart(2, "0");
    const open     = new Date(`${yyyy}-${mm}-${dd}T09:00:00`).getTime();
    const close    = new Date(`${yyyy}-${mm}-${dd}T22:00:00`).getTime();
    return now.getTime() >= open && now.getTime() <= close;
  }

  const handleTrade = async () => {
    if (!isMarketOpen()) {
      setMessage("Market is closed. Trading hours: 9:00 – 22:00.");
      setMessageType("error");
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
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setMessage("✓ Buy order placed successfully!");
        setMessageType("success");
      } else {
        await axios.post(
          `${API_BASE_URL}/intraday/sell`,
          { tradeId: trade?._id, sellPrice: price },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setMessage("✓ Sell order placed successfully!");
        setMessageType("success");
      }
    } catch {
      setMessage("✗ Error placing order. Please try again.");
      setMessageType("error");
    }
  };

  const estimatedValue = (!isFetchingPrice && price && qty)
    ? (Number(price) * Number(qty)).toLocaleString("en-IN", { minimumFractionDigits: 2 })
    : "—";

  return (
    <div className="buysell-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="buysell-modal">
        {/* ── Header ── */}
        <div className="buysell-header">
          <div className="buysell-title-wrap">
            <span className={`buysell-type-badge ${type === "BUY" ? "buy" : "sell"}`}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {type === "BUY" ? "Market Buy" : "Market Sell"}
            </span>
            <span className="buysell-symbol">{symbol}</span>
            <span className="buysell-exchange">NSE · Intraday</span>
          </div>
          <button className="buysell-close" onClick={onClose}>×</button>
        </div>

        {/* ── Live price strip ── */}
        <div className="buysell-live-price">
          <span>Current Market Price</span>
          {isFetchingPrice
            ? <span className="price-loading-dot" />
            : <strong>₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          }
        </div>

        {/* ── Form fields ── */}
        <div className="buysell-body">
          <div className="buysell-row">
            <div className="buysell-field">
              <label className="buysell-label">Quantity</label>
              <input
                className="buysell-input"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="buysell-field">
              <label className="buysell-label">Price (₹)</label>
              <input
                className="buysell-input"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={isFetchingPrice ? "Fetching…" : ""}
                disabled={isFetchingPrice}
              />
            </div>
          </div>

          {type === "BUY" && (
            <div className="buysell-field">
              <label className="buysell-label">Order Type</label>
              <select
                className="buysell-select"
                value={limitType}
                onChange={(e) => setLimitType(e.target.value)}
              >
                <option value="NONE">Market Order</option>
                <option value="STOPLOSS">Stop Loss</option>
                <option value="TARGET">Target</option>
              </select>
              {limitType !== "NONE" && (
                <input
                  className="buysell-input"
                  type="number"
                  min="0"
                  placeholder={`${limitType === "STOPLOSS" ? "Stop Loss" : "Target"} Price`}
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>
          )}

          {/* Estimated value */}
          <div className="buysell-estimate">
            <span className="buysell-estimate-label">Estimated Value</span>
            <span className="buysell-estimate-value">₹{estimatedValue}</span>
          </div>
        </div>

        {/* ── Feedback message ── */}
        {message && (
          <div className={`buysell-message ${messageType}`}>{message}</div>
        )}

        {/* ── P/L after sell ── */}
        {type === "SELL" && trade && typeof trade.profitOrLoss === "number" && (
          <div className="buysell-pl">
            <div
              className="buysell-pl-amount"
              style={{ color: trade.profitOrLoss >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {trade.profitOrLoss >= 0 ? "+" : ""}₹{Math.abs(trade.profitOrLoss).toFixed(2)}
            </div>
            <div className="buysell-pl-label">Estimated P&amp;L</div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="buysell-footer">
          <button
            className={`buysell-btn ${type === "BUY" ? "confirm-buy" : "confirm-sell"}`}
            onClick={handleTrade}
            disabled={isFetchingPrice}
          >
            {type === "BUY" ? "Confirm Buy" : "Confirm Sell"}
          </button>
          <button className="buysell-btn cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default BuySellPopup;
