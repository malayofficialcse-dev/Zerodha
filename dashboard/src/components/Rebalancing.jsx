import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "./Rebalancing.css";

const COLORS = ["#387ed1", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"];

const Rebalancing = () => {
  const [targets, setTargets] = useState({
    Bluechip: 50,
    Midcap: 30,
    Smallcap: 10,
    Cash: 10,
    Other: 0
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSliderChange = (cat, val) => {
    setTargets(prev => ({ ...prev, [cat]: Number(val) }));
  };

  const calculateRebalance = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/analytics/rebalance`, { targets });
      setPlan(response.data);
    } catch (error) {
      console.error("Error calculating rebalance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRebalance();
  }, []);

  const totalTarget = Object.values(targets).reduce((a, b) => a + b, 0);

  return (
    <div className="rebalancing-container">
      <div className="rebalance-header">
        <h1>Portfolio Rebalancing Engine</h1>
        <p>Maintain your ideal asset allocation strategy</p>
      </div>

      <div className="rebalance-grid">
        {/* Configuration Card */}
        <div className="rebalance-card config-card">
          <h2>Set Target Allocation</h2>
          <div className="target-sliders">
            {Object.keys(targets).map((cat) => (
              <div key={cat} className="slider-group">
                <div className="slider-label">
                  <span>{cat}</span>
                  <span>{targets[cat]}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={targets[cat]} 
                  onChange={(e) => handleSliderChange(cat, e.target.value)}
                />
              </div>
            ))}
          </div>
          
          <div className={`allocation-check ${totalTarget === 100 ? "valid" : "invalid"}`}>
            Total: {totalTarget}% {totalTarget !== 100 && "(Must be 100%)"}
          </div>

          <button 
            className="rebalance-btn" 
            disabled={totalTarget !== 100 || loading}
            onClick={calculateRebalance}
          >
            {loading ? "Calculating..." : "Update Rebalance Plan"}
          </button>
        </div>

        {/* Charts Card */}
        <div className="rebalance-card chart-card">
          <h2>Allocation Comparison</h2>
          {plan && (
            <div className="charts-wrapper">
              <div className="chart-item">
                <h3>Current</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={plan.plan.map(p => ({ name: p.category, value: parseFloat(p.currentPct) }))} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                      {plan.plan.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-item">
                <h3>Target</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={plan.plan.map(p => ({ name: p.category, value: p.targetPct }))} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                      {plan.plan.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Table */}
      {plan && (
        <div className="rebalance-card recommendations-card">
          <h2>Recommended Actions</h2>
          <div className="table-responsive">
            <table className="rebalance-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Current %</th>
                  <th>Target %</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {plan.plan.map((p, idx) => (
                  <tr key={idx}>
                    <td><strong>{p.category}</strong></td>
                    <td>{p.currentPct}%</td>
                    <td>{p.targetPct}%</td>
                    <td>
                      {p.recommendations.length > 0 ? (
                        <span className={`action-badge ${p.recommendations[0].action.toLowerCase()}`}>
                          {p.recommendations[0].action}
                        </span>
                      ) : (
                        <span className="action-badge hold">Hold</span>
                      )}
                    </td>
                    <td>
                      {p.recommendations.length > 0 ? (
                        p.category === "Cash" ? 
                        `₹${p.recommendations[0].amount}` : 
                        `${p.recommendations[0].shares} shares of ${p.recommendations[0].symbol}`
                      ) : "No changes needed"}
                    </td>
                    <td>{p.recommendations.length > 0 ? `₹${p.recommendations[0].estimatedValue || p.recommendations[0].amount}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rebalancing;
