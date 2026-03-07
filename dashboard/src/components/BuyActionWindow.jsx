import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { API_BASE_URL } from "../config/config.js"; // adjust path as needed
import "./BuyActionWindow.css"; // keep this for any custom styling you still need

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);

  const { closeBuyWindow } = useContext(GeneralContext);

  const handleBuyClick = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/order/newOrder`,
        {
          name: uid,
          qty: Number(stockQuantity),
          price: Number(stockPrice),
          mode: "BUY",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      closeBuyWindow();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Order failed. Please login again if the problem persists."
      );
    }
  };

  const handleCancelClick = () => {
    closeBuyWindow();
  };

  return (
    <div className="order-window-overlay">
      <div className="order-window buy">
        <div className="order-header">
          <div>
            <h3>Buy {uid}</h3>
            <p>NSE • ₹{stockPrice}</p>
          </div>
          <button className="close-btn" onClick={handleCancelClick}>&times;</button>
        </div>
        
        <div className="order-body">
          <div className="row g-3">
            <div className="col-6">
              <label>Qty</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="col-6">
              <label>Price</label>
              <input
                type="number"
                value={stockPrice}
                onChange={(e) => setStockPrice(e.target.value)}
                step="0.05"
              />
            </div>
          </div>
        </div>

        <div className="order-footer">
          <div className="margin-info">
            <span>Margin needed</span>
            <strong>₹{(stockQuantity * stockPrice).toFixed(2)}</strong>
          </div>
          <div className="footer-actions">
            <button className="btn-buy" onClick={handleBuyClick}>Buy</button>
            <button className="btn-cancel" onClick={handleCancelClick}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
