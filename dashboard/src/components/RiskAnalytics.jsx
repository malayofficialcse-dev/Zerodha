import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { API_BASE_URL } from "../config/config.js";
import "./RiskAnalytics.css"; // Import custom CSS

const COLORS = ["#387ed1", "#22c55e", "#f59e0b", "#f56834", "#8b5cf6", "#64748b"];

const RiskAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/analytics/risk`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="chart-loading"><div className="chart-spinner"></div><p>Calculating Risk Profile...</p></div>;
  if (!data) return <div className="error">Failed to load analytics data.</div>;

  const { metrics, sectors, drawdownSeries, portfolioValue } = data;

  return (
    <div className="risk-analytics-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Advanced Risk Analytics</h1>
        {data.isSampleData && (
          <div className="live-status-chip" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)" }}>
            <span className="pulse-green" style={{ background: "#f59e0b" }}></span>
            SAMPLE DATA (NO HOLDINGS FOUND)
          </div>
        )}
      </div>

      {/* Metrics Row - Using project's .stats-row and .stat-card */}
      <div className="stats-row">
        <MetricCard label="Portfolio Value" value={`₹${portfolioValue.toLocaleString()}`} type="value" />
        <MetricCard label="Sharpe Ratio" value={metrics.sharpe} subtext="Daily Risk Adj." />
        <MetricCard label="Portfolio Beta" value={metrics.beta} subtext="Relative to Nifty" />
        <MetricCard label="Max Drawdown" value={`${metrics.maxDrawdown}%`} subtext="Worst Trough" isLoss={metrics.maxDrawdown > 15} />
      </div>

      <div className="risk-analytics-grid">
        {/* Sector Allocation */}
        <div className="analysis-card">
          <h2>Sector Exposure</h2>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={sectors}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {sectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--surface-bg)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString()}`} 
                  contentStyle={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drawdown Series */}
        <div className="analysis-card">
          <h2>Portfolio Drawdown (%)</h2>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={drawdownSeries.map(d => ({ ...d, drawdown: -Math.abs(d.drawdown) }))}>
                <defs>
                  <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.05} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  domain={['dataMin - 1', 0]} 
                  tickFormatter={(val) => `${val}%`}
                  tick={{fontSize: 11, fill: 'var(--text-muted)'}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  labelStyle={{ color: 'var(--text-color)' }}
                  contentStyle={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--border-color)' }}
                  formatter={(value) => [`${Math.abs(value)}%`, "Drawdown"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDd)" 
                  name="Drawdown (%)"
                  baseValue={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="drawdown-info">
            Visualizes the "underwater" periods of your portfolio relative to its previous peak. Smaller drawdowns indicate better capital preservation.
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, subtext, type, isLoss }) => (
  <div className="stat-card">
    <p className="label">{label}</p>
    <h5 className={isLoss ? "loss" : (type === "value" ? "" : "profit")}>{value}</h5>
    {subtext && <p className="metric-subtext">{subtext}</p>}
  </div>
);

export default RiskAnalytics;
