import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import "./DashboardChart.css";

const socketURL = API_BASE_URL.replace("/api", "").replace(/\/$/, "");

const DashboardChart = () => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [ticks, setTicks] = useState({});
  const [stocks, setStocks] = useState([]);

  // Fetch all stocks for symbols
  useEffect(() => {
    axios.get(`${API_BASE_URL}/stocks/all`).then((r) => setStocks(r.data || []));
  }, []);

  // Fetch deep analytics (risk, beta, etc.)
  const fetchAnalytics = () => {
    axios
      .get(`${API_BASE_URL}/analytics/risk`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null));
  };

  useEffect(() => {
    fetchAnalytics();
    const sub = io(socketURL);
    sub.on("tick", (data) => {
      setTicks((prev) => ({ ...prev, [data.symbol]: data.close }));
    });
    return () => {
      sub.disconnect();
    };
  }, []);

  // Performance vs Benchmark Chart (NIFTY vs Portfolio)
  const performanceSeries = useMemo(() => {
    if (!analytics?.drawdownSeries) return [];
    // Simulate a portfolio performance series based on its drawdown
    return [
      {
        name: "Portfolio performance",
        data: analytics.drawdownSeries.map((d) => ({
          x: new Date(d.date).getTime(),
          y: parseFloat((100 - d.drawdown).toFixed(2)),
        })),
      },
    ];
  }, [analytics]);

  const chartOpts = {
    chart: { type: "line", background: "transparent", toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: "smooth", width: 4, colors: ["#387ed1"] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
    xaxis: { type: "datetime", labels: { style: { colors: theme === "dark" ? "#94a3b8" : "#64748b" } } },
    yaxis: { labels: { style: { colors: theme === "dark" ? "#94a3b8" : "#64748b" } }, title: { text: "Efficiency (%)", style: { color: "#387ed1" } } },
    grid: { borderColor: theme === "dark" ? "#1e293b" : "#f1f5f9", strokeDashArray: 4 },
    tooltip: { theme },
  };

  const metrics = analytics?.metrics || { sharpe: 0, beta: 0, maxDrawdown: 0 };

  return (
    <div className="dbchart-root">
      <div className="dbchart-header">
        <h2 className="dbchart-title">Real-time Market Analytics</h2>
        <span className="dbchart-badge">LIVESTREAM ACTIVE</span>
      </div>

      <div className="dbchart-grid">
        {/* Main Performance Chart */}
        <div className="dbchart-card" style={{ gridColumn: "span 2" }}>
          <div className="dbchart-header">
            <h4 style={{ margin: 0 }}>Portfolio Efficiency Index</h4>
            <span style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: "bold" }}>+12.4% (MTD)</span>
          </div>
          {performanceSeries.length > 0 ? (
            <Chart options={chartOpts} series={performanceSeries} type="line" height={300} />
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Calculating indices...</div>
          )}
        </div>

        {/* Risk & Volatility Metrics */}
        <div className="dbchart-card">
          <h4 style={{ margin: 0 }}>Risk & Volatility</h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "8px 0 24px" }}>Computed against NIFTY 50 Benchmark</p>
          
          <div className="dbchart-metric-row">
            <div className="dbchart-metric-item">
              <div className="dbchart-metric-label">Sharpe</div>
              <div className={`dbchart-metric-val ${metrics.sharpe > 1.5 ? "up" : ""}`}>{metrics.sharpe.toFixed(2)}</div>
            </div>
            <div className="dbchart-metric-item">
              <div className="dbchart-metric-label">Beta</div>
              <div className="dbchart-metric-val">{metrics.beta.toFixed(2)}</div>
            </div>
            <div className="dbchart-metric-item">
              <div className="dbchart-metric-label">VIX Index</div>
              <div className="dbchart-metric-val down">14.8</div>
            </div>
          </div>

          <div className="dbchart-progress-wrap">
            <div className="dbchart-progress-top">
              <span>Risk Tolerance Utilization</span>
              <span>72%</span>
            </div>
            <div className="dbchart-progress-track">
              <div className="dbchart-progress-fill" style={{ width: "72%", background: "#f59e0b" }} />
            </div>
          </div>

          <div className="dbchart-progress-wrap">
            <div className="dbchart-progress-top">
              <span>Systematic Exposure</span>
              <span>45%</span>
            </div>
            <div className="dbchart-progress-track">
              <div className="dbchart-progress-fill" style={{ width: "45%", background: "#387ed1" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="dbchart-grid">
        {/* Dynamic Sector Breakdown */}
        <div className="dbchart-card">
           <h4 style={{ marginBottom: "16px" }}>Dynamic Sector Weights</h4>
           <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
             {analytics?.sectors?.map(s => (
               <div key={s.name} style={{ background: "var(--bg-surface)", padding: "10px 20px", borderRadius: "12px", flex: "1", minWidth: "120px" }}>
                 <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.name}</div>
                 <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{s.percentage}%</div>
               </div>
             ))}
           </div>
        </div>

        {/* Alpha Generation Signal */}
        <div className="dbchart-card" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white" }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
             <div>
               <h4 style={{ margin: 0, color: "#387ed1" }}>Alpha Signal</h4>
               <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Proprietary Momentum Score</p>
             </div>
             <div style={{ background: "#22c55e", padding: "4px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "bold" }}>BULLISH</div>
           </div>
           
           <div style={{ marginTop: "32px" }}>
             <h1 style={{ margin: 0, fontSize: "3rem", fontWeight: "900", color: "#22c55e" }}>0.94</h1>
             <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>Strong positive drift detected in core holdings. Rebalancer suggests "Neutral/Hold" stance.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChart;
