import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPendingKYC();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      localStorage.setItem("adminToken", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
    setPendingList([]);
    setSelectedUser(null);
  };

  const fetchPendingKYC = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/kyc/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingList(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      setError("Failed to fetch pending applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm("Are you sure you want to approve this KYC? User will be credited ₹1,000.")) return;
    try {
      await axios.put(`${API_BASE_URL}/admin/kyc/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(null);
      fetchPendingKYC();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve KYC.");
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this KYC?")) return;
    try {
      await axios.put(`${API_BASE_URL}/admin/kyc/${userId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(null);
      fetchPendingKYC();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject KYC.");
    }
  };

  if (!token) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <h2>Kite Admin Console</h2>
          <p>Login to review and approve customer onboarding requests</p>
          {error && <div className="admin-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="admin-btn primary" disabled={loading}>
              {loading ? "Authenticating..." : "Login to Console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="logo-area">
          <span className="admin-logo">Kite</span>
          <span className="admin-badge">Admin</span>
        </div>
        <div className="user-area">
          <span>Logged in as Admin</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="admin-main">
        <div className="admin-content-layout">
          {/* Applications list */}
          <div className="admin-card applications-list-card">
            <div className="card-header">
              <h3>Pending KYC Requests ({pendingList.length})</h3>
              <button className="refresh-btn" onClick={fetchPendingKYC}>Refresh</button>
            </div>

            {loading && <div className="admin-loader">Loading applications...</div>}

            {!loading && pendingList.length === 0 ? (
              <div className="empty-state">No pending KYC applications found.</div>
            ) : (
              <div className="applications-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Submitted Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((user) => (
                      <tr
                        key={user._id}
                        className={selectedUser?._id === user._id ? "selected-row" : ""}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td>{user.kyc?.fullName || user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.kyc?.submittedAt ? new Date(user.kyc.submittedAt).toLocaleString() : "N/A"}</td>
                        <td>
                          <button className="view-details-btn">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details & Actions Panel */}
          <div className="admin-card details-panel-card">
            {selectedUser ? (
              <div className="kyc-details">
                <h3>Application Details</h3>
                <div className="details-section">
                  <h4>Personal Information</h4>
                  <p><strong>Full Name:</strong> {selectedUser.kyc?.fullName}</p>
                  <p><strong>DOB:</strong> {selectedUser.kyc?.dob}</p>
                  <p><strong>Phone:</strong> {selectedUser.kyc?.phone}</p>
                </div>
                <div className="details-section">
                  <h4>Identity Details</h4>
                  <p><strong>PAN Number:</strong> {selectedUser.kyc?.pan?.toUpperCase()}</p>
                  <p><strong>Aadhaar Number:</strong> {selectedUser.kyc?.aadhaar}</p>
                </div>
                <div className="details-section">
                  <h4>Bank Details</h4>
                  <p><strong>Bank Name:</strong> {selectedUser.kyc?.bankName}</p>
                  <p><strong>Account Number:</strong> {selectedUser.kyc?.accountNumber}</p>
                  <p><strong>IFSC Code:</strong> {selectedUser.kyc?.ifsc?.toUpperCase()}</p>
                  <p><strong>Address:</strong> {selectedUser.kyc?.address}</p>
                </div>

                <div className="action-buttons-wrap">
                  <button className="action-btn approve" onClick={() => handleApprove(selectedUser._id)}>
                    Approve & Credit ₹1000
                  </button>
                  <button className="action-btn reject" onClick={() => handleReject(selectedUser._id)}>
                    Reject Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-details">
                <p>Select a KYC request from the left list to review document details and approve/reject.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
