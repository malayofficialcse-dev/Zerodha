import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import CreateAlertModal from "./CreateAlertModal";
import "./Alerts.css";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/alerts`);
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE_URL}/alerts/${id}`);
    fetchAlerts();
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <div>
          <h1>Price Alerts</h1>
          <p>Get notified when stocks hit your target price</p>
        </div>
        <button className="add-alert-btn" onClick={() => setShowModal(true)}>
          + Create New Alert
        </button>
      </div>

      <div className="alerts-table-container">
        {loading ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="no-alerts">
            <p>You haven't set any alerts yet.</p>
          </div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Condition</th>
                <th>Target Price</th>
                <th>Channels</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert._id} className={alert.status}>
                  <td><strong>{alert.symbol}</strong></td>
                  <td>{alert.condition === "above" ? "Price goes above" : "Price falls below"}</td>
                  <td>₹{alert.targetPrice.toLocaleString()}</td>
                  <td className="channels-cell">
                    {alert.notifyEmail && <span title={`Email: ${alert.email}`}>📧</span>}
                    {alert.notifyTelegram && <span title={`Telegram: ${alert.telegramChatId}`}>✈️</span>}
                    {!alert.notifyEmail && !alert.notifyTelegram && <span className="no-channels">None</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${alert.status}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(alert._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateAlertModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            fetchAlerts();
          }} 
        />
      )}
    </div>
  );
};

export default Alerts;
