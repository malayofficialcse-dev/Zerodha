import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { API_BASE_URL } from "../config/config.js";
import { toast } from "react-toastify";
import "./QuickTradeOverlay.css";

const QuickTradeOverlay = () => {
  const { selectedSymbol, setSelectedSymbol } = useContext(GeneralContext);
  const [qty, setQty] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [flash, setFlash] = useState(null); // "buy" | "sell" | null
  const [isVisible, setIsVisible] = useState(true);

  // Re-show when a new symbol is selected
  useEffect(() => {
    if (selectedSymbol) setIsVisible(true);
  }, [selectedSymbol]);

  // Fetch current price for the selected symbol to use as order price
  useEffect(() => {
    if (selectedSymbol) {
      axios.get(`${API_BASE_URL}/stocks/all`).then((res) => {
        const stock = res.data.find((s) => s.symbol === selectedSymbol);
        if (stock) {
          setCurrentPrice(stock.currentPrice);
        }
      });
    }
  }, [selectedSymbol]);

  const handleTrade = async (mode) => {
    if (!selectedSymbol) {
      toast.warning("Please select a symbol first from the Watchlist.");
      return;
    }

    setIsExecuting(true);
    setFlash(mode.toLowerCase());

    try {
      await axios.post(
        `${API_BASE_URL}/order/newOrder`,
        {
          name: selectedSymbol,
          qty: Number(qty),
          price: Number(currentPrice), // Market price execution
          mode: mode,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(
        `${mode} Order Executed: ${qty} shares of ${selectedSymbol} @ ₹${currentPrice.toFixed(2)}`,
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );

      // Trigger "haptic" feedback
      setTimeout(() => setFlash(null), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Trade execution failed.");
      setFlash(null);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`quick-trade-overlay ${flash ? `flash-${flash}` : ""}`}>
      <div className="overlay-header">
        <div className="status-indicator">
          <span className="dot pulse"></span>
          QUICK TRADE
        </div>
        <div className="header-actions">
          <div className="symbol-badge">{selectedSymbol || "---"}</div>
          <button className="close-btn" onClick={() => setIsVisible(false)} title="Close Overlay">&times;</button>
        </div>
      </div>

      <div className="overlay-body">
        <div className="qty-input-group">
          <label>Qty</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            disabled={isExecuting}
          />
        </div>

        <div className="action-buttons">
          <button
            className="btn-quick-buy"
            onClick={() => handleTrade("BUY")}
            disabled={isExecuting || !selectedSymbol}
          >
            {isExecuting && flash === "buy" ? "..." : "BUY"}
          </button>
          <button
            className="btn-quick-sell"
            onClick={() => handleTrade("SELL")}
            disabled={isExecuting || !selectedSymbol}
          >
            {isExecuting && flash === "sell" ? "..." : "SELL"}
          </button>
        </div>
      </div>
      
      <div className="overlay-footer">
        ₹{(qty * currentPrice).toFixed(2)} est.
      </div>
    </div>
  );
};

export default QuickTradeOverlay;
