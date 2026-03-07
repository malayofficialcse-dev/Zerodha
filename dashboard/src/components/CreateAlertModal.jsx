import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";

const CreateAlertModal = ({ onClose, onSuccess, initialSymbol = "" }) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [email, setEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/stocks/all`).then(res => setStocks(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/alerts`, {
        symbol,
        targetPrice: Number(targetPrice),
        condition,
        notifyEmail,
        notifyTelegram,
        email,
        telegramChatId
      });
      onSuccess();
    } catch (err) {
      alert("Error creating alert");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="alert-modal">
        <h2>Create Price Alert</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Stock Symbol</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} required>
              <option value="">Select Stock</option>
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="above">Price goes above</option>
              <option value="below">Price falls below</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target Price (₹)</label>
            <input 
              type="number" 
              step="0.01"
              value={targetPrice} 
              onChange={(e) => setTargetPrice(e.target.value)} 
              placeholder="Enter price"
              required 
            />
          </div>

          <div className="notification-options">
            <div className="checkbox-group">
              <label>
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
                Email Notification
              </label>
            </div>
            {notifyEmail && (
              <div className="form-group">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter email address"
                  required 
                />
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input type="checkbox" checked={notifyTelegram} onChange={(e) => setNotifyTelegram(e.target.checked)} />
                Telegram Notification
              </label>
            </div>
            {notifyTelegram && (
              <div className="form-group">
                <input 
                  type="text" 
                  value={telegramChatId} 
                  onChange={(e) => setTelegramChatId(e.target.value)} 
                  placeholder="Enter Telegram Chat ID"
                  required 
                />
                <small className="help-text">Get your ID from @userinfobot</small>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={!symbol || !targetPrice}>Create Alert</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;
