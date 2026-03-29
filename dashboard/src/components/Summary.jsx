import React, { useEffect, useState, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import "./Summary.css";

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n, dec = 2) =>
  typeof n === "number" ? n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

const socketURL = API_BASE_URL.replace("/api", "").replace(/\/$/, "");

// ── KPI Card ─────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, subColor, icon, pulse }) => (
  <div className="sdash-kpi-card">
    <div className="sdash-kpi-top">
      <span className="sdash-kpi-icon">{icon}</span>
      {pulse && <span className="sdash-live-dot" />}
    </div>
    <div className="sdash-kpi-value">{value}</div>
    <div className="sdash-kpi-label">{label}</div>
    {sub && <div className="sdash-kpi-sub" style={{ color: subColor }}>{sub}</div>}
  </div>
);

// ── Sparkline bar (tiny inline chart) ────────────────────────────
const MiniSpark = ({ data, color }) => {
  const opts = {
    chart: { type: "area", sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: "smooth", width: 1.5 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.0 } },
    colors: [color],
    tooltip: { enabled: false },
  };
  return (
    <Chart options={opts} series={[{ data }]} type="area" height={36} width={80} />
  );
};

// ── Sector Donut ─────────────────────────────────────────────────
const SectorDonut = ({ sectors, theme }) => {
  const labels = sectors.map((s) => s.name);
  const values = sectors.map((s) => s.percentage);
  const opts = {
    chart: { type: "donut", background: "transparent", animations: { enabled: false } },
    labels,
    colors: ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"],
    legend: { position: "bottom", fontSize: "11px", labels: { colors: theme === "dark" ? "#94a3b8" : "#64748b" } },
    dataLabels: { enabled: true, formatter: (v) => `${v.toFixed(0)}%`, style: { fontSize: "11px" } },
    plotOptions: { pie: { donut: { size: "60%", labels: { show: true, total: { show: true, label: "Sectors", color: theme === "dark" ? "#94a3b8" : "#64748b" } } } } },
    tooltip: { y: { formatter: (v) => `${v}%` } },
    stroke: { width: 0 },
  };
  return (
    <Chart options={opts} series={values} type="donut" height={220} />
  );
};

// ── Main Component ────────────────────────────────────────────────
const Summary = () => {
  const { theme } = useTheme();

  // Data states
  const [holdings, setHoldings] = useState([]);
  const [stocks, setStocks] = useState([]);            // all stocks w/ currentPrice
  const [analytics, setAnalytics] = useState(null);   // risk metrics + sectors
  const [ticks, setTicks] = useState({});              // { SYMBOL: { close, high, low, volume } }
  const [sparkHistory, setSparkHistory] = useState({}); // { SYMBOL: [prices…] }

  // Load holdings
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/holdings/allHoldings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((r) => setHoldings(r.data || []))
      .catch(() => {});
  }, []);

  // Load all stocks
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .then((r) => setStocks(r.data || []))
      .catch(() => {});
  }, []);

  // Load analytics (risk metrics + sector allocation)
  const loadAnalytics = () => {
    axios
      .get(`${API_BASE_URL}/analytics/risk`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((r) => setAnalytics(r.data))
      .catch(() => {});
  };
  useEffect(() => {
    loadAnalytics();
    const id = setInterval(loadAnalytics, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, []);

  // Socket: real-time ticks
  useEffect(() => {
    const socket = io(socketURL);
    socket.on("tick", (data) => {
      const { symbol, close, high, low, volume } = data;
      setTicks((prev) => ({ ...prev, [symbol]: { close, high, low, volume } }));
      setSparkHistory((prev) => {
        const existing = prev[symbol] || [];
        const next = [...existing, close].slice(-40); // keep last 40 points
        return { ...prev, [symbol]: next };
      });
    });
    return () => socket.disconnect();
  }, []);

  // ── Computed ───────────────────────────────────────────────────
  const { totalValue, totalInvested, todayPnl, totalPnlPct, holdingRows } =
    useMemo(() => {
      if (!holdings.length || !stocks.length)
        return { totalValue: 0, totalInvested: 0, todayPnl: 0, totalPnlPct: 0, holdingRows: [] };

      let totalValue = 0, totalInvested = 0, todayPnl = 0;

      const holdingRows = holdings.map((h) => {
        const stock = stocks.find((s) => s.name === h.name || s.symbol === h.symbol);
        const livePrice = ticks[stock?.symbol]?.close ?? stock?.currentPrice ?? h.price;
        const invested = h.price * h.qty;
        const current = livePrice * h.qty;
        const pnl = current - invested;
        const pct = invested > 0 ? (pnl / invested) * 100 : 0;

        totalInvested += invested;
        totalValue += current;
        todayPnl += pnl;

        return {
          name: stock?.name || h.name,
          symbol: stock?.symbol || "—",
          qty: h.qty,
          buyPrice: h.price,
          livePrice,
          pnl,
          pct,
          spark: sparkHistory[stock?.symbol] || [],
        };
      });

      const totalPnlPct = totalInvested > 0 ? (todayPnl / totalInvested) * 100 : 0;
      return { totalValue, totalInvested, todayPnl, totalPnlPct, holdingRows };
    }, [holdings, stocks, ticks, sparkHistory]);

  // Gainers / Losers from live ticks
  const { gainers, losers } = useMemo(() => {
    const enriched = stocks.map((s) => {
      const liveClose = ticks[s.symbol]?.close ?? s.currentPrice;
      const prevClose = s.ohlc?.length > 1 ? s.ohlc[s.ohlc.length - 2]?.close : liveClose;
      const chg = prevClose > 0 ? ((liveClose - prevClose) / prevClose) * 100 : 0;
      return { symbol: s.symbol, price: liveClose, chg };
    });
    const sorted = [...enriched].sort((a, b) => b.chg - a.chg);
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [stocks, ticks]);

  // Rolling P&L area chart – portfolio value per OHLC day
  const pnlChartData = useMemo(() => {
    if (!holdings.length || !stocks.length) return [];
    const dayMap = {};
    holdings.forEach((h) => {
      const stock = stocks.find((s) => s.name === h.name);
      if (!stock?.ohlc?.length) return;
      stock.ohlc.forEach((bar) => {
        const d = bar.date?.slice(0, 10) || "";
        if (!d) return;
        dayMap[d] = (dayMap[d] || 0) + bar.close * h.qty;
      });
    });
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({ x: new Date(date).getTime(), y: parseFloat(val.toFixed(2)) }));
  }, [holdings, stocks]);

  // ── Chart Options ──────────────────────────────────────────────
  const pnlOpts = {
    chart: { type: "area", background: "transparent", toolbar: { show: false }, animations: { enabled: false }, zoom: { enabled: false } },
    colors: [todayPnl >= 0 ? "#22c55e" : "#ef4444"],
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.0 } },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { type: "datetime", labels: { style: { colors: theme === "dark" ? "#64748b" : "#94a3b8", fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v) => `₹${(v / 1000).toFixed(0)}k`, style: { colors: theme === "dark" ? "#64748b" : "#94a3b8", fontSize: "10px" } } },
    grid: { borderColor: theme === "dark" ? "#1e293b" : "#f1f5f9", strokeDashArray: 4 },
    tooltip: { theme, x: { format: "dd MMM yy" }, y: { formatter: (v) => `₹${fmt(v)}` } },
    dataLabels: { enabled: false },
  };

  const pnlSign = todayPnl >= 0 ? "+" : "";
  const metrics = analytics?.metrics;
  const sectors = analytics?.sectors || [];

  return (
    <div className="sdash-root">
      {/* ── Header ── */}
      <div className="sdash-header">
        <div>
          <h2 className="sdash-title">Portfolio Dashboard</h2>
          <p className="sdash-subtitle">Real-time analytics · auto-updating</p>
        </div>
        <span className="sdash-live-badge">
          <span className="sdash-live-dot" />
          LIVE
        </span>
      </div>

      {/* ── KPI Strip ── */}
      <div className="sdash-kpi-row">
        <KpiCard
          icon="💼"
          label="Portfolio Value"
          value={`₹${fmt(totalValue)}`}
          sub={`${pnlSign}${fmt(totalPnlPct)}% all-time`}
          subColor={totalPnlPct >= 0 ? "#22c55e" : "#ef4444"}
          pulse
        />
        <KpiCard
          icon="📈"
          label="Total P&L"
          value={`${pnlSign}₹${fmt(Math.abs(todayPnl))}`}
          subColor={todayPnl >= 0 ? "#22c55e" : "#ef4444"}
          sub={todayPnl >= 0 ? "In Profit" : "In Loss"}
          pulse
        />
        <KpiCard
          icon="💰"
          label="Invested"
          value={`₹${fmt(totalInvested)}`}
        />
        <KpiCard
          icon="📊"
          label="Sharpe Ratio"
          value={metrics ? metrics.sharpe.toFixed(2) : "—"}
          sub="Risk-adjusted return"
        />
        <KpiCard
          icon="⚡"
          label="Beta"
          value={metrics ? metrics.beta.toFixed(2) : "—"}
          sub="vs Market"
        />
        <KpiCard
          icon="🔻"
          label="Max Drawdown"
          value={metrics ? `${metrics.maxDrawdown.toFixed(1)}%` : "—"}
          subColor="#ef4444"
          sub="Historical"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="sdash-main-grid">
        {/* ── Left: P&L Chart + Holdings Table ── */}
        <div className="sdash-left-col">
          {/* Rolling P&L */}
          <div className="sdash-card">
            <div className="sdash-card-header">
              <span className="sdash-card-title">Rolling Portfolio Value</span>
              <span className="sdash-card-badge" style={{ color: todayPnl >= 0 ? "#22c55e" : "#ef4444" }}>
                {pnlSign}₹{fmt(Math.abs(todayPnl))}
              </span>
            </div>
            {pnlChartData.length > 0 ? (
              <Chart
                options={pnlOpts}
                series={[{ name: "Portfolio", data: pnlChartData }]}
                type="area"
                height={200}
              />
            ) : (
              <div className="sdash-empty">Loading chart…</div>
            )}
          </div>

          {/* Holdings Table */}
          <div className="sdash-card">
            <div className="sdash-card-header">
              <span className="sdash-card-title">Holdings Tracker</span>
              <span className="sdash-live-dot" />
            </div>
            <div className="sdash-table-wrap">
              <table className="sdash-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Avg Buy</th>
                    <th>LTP</th>
                    <th>P&L</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingRows.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No holdings found</td></tr>
                  ) : holdingRows.map((row) => (
                    <tr key={row.symbol}>
                      <td>
                        <div className="sdash-stock-name">{row.symbol}</div>
                        <div className="sdash-stock-sub">{row.name}</div>
                      </td>
                      <td>{row.qty}</td>
                      <td>₹{fmt(row.buyPrice)}</td>
                      <td className="sdash-ltp">₹{fmt(row.livePrice)}</td>
                      <td>
                        <span className={`sdash-pnl-chip ${row.pnl >= 0 ? "up" : "down"}`}>
                          {row.pnl >= 0 ? "+" : ""}₹{fmt(Math.abs(row.pnl))}<br />
                          <small>{row.pnl >= 0 ? "+" : ""}{row.pct.toFixed(2)}%</small>
                        </span>
                      </td>
                      <td>
                        <MiniSpark
                          data={row.spark.length > 2 ? row.spark : [row.buyPrice, row.livePrice]}
                          color={row.pnl >= 0 ? "#22c55e" : "#ef4444"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: Sector + Gainers/Losers ── */}
        <div className="sdash-right-col">
          {/* Sector Allocation */}
          <div className="sdash-card">
            <div className="sdash-card-header">
              <span className="sdash-card-title">Sector Allocation</span>
            </div>
            {sectors.length > 0 ? (
              <SectorDonut sectors={sectors} theme={theme} />
            ) : (
              <div className="sdash-empty">Loading sectors…</div>
            )}
          </div>

          {/* Gainers & Losers */}
          <div className="sdash-card">
            <div className="sdash-card-header">
              <span className="sdash-card-title">Top Movers</span>
              <span className="sdash-live-dot" />
            </div>
            <div className="sdash-movers-grid">
              <div className="sdash-mover-col">
                <div className="sdash-mover-label gainers-label">▲ Gainers</div>
                {gainers.map((g) => (
                  <div key={g.symbol} className="sdash-mover-row">
                    <span className="sdash-mover-sym">{g.symbol}</span>
                    <span className="sdash-mover-price">₹{fmt(g.price)}</span>
                    <span className="sdash-mover-chg gain">+{g.chg.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="sdash-mover-col">
                <div className="sdash-mover-label losers-label">▼ Losers</div>
                {losers.map((l) => (
                  <div key={l.symbol} className="sdash-mover-row">
                    <span className="sdash-mover-sym">{l.symbol}</span>
                    <span className="sdash-mover-price">₹{fmt(l.price)}</span>
                    <span className="sdash-mover-chg loss">{l.chg.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="sdash-card">
            <div className="sdash-card-header">
              <span className="sdash-card-title">Risk Analysis</span>
            </div>
            <div className="sdash-risk-grid">
              {[
                { label: "Sharpe Ratio", value: metrics?.sharpe.toFixed(2), desc: metrics?.sharpe > 1 ? "Good" : "Below Average", color: metrics?.sharpe > 1 ? "#22c55e" : "#f59e0b", bar: Math.min((metrics?.sharpe / 3) * 100, 100) },
                { label: "Beta", value: metrics?.beta.toFixed(2), desc: metrics?.beta < 1 ? "Low Volatility" : "High Volatility", color: metrics?.beta < 1 ? "#22c55e" : "#ef4444", bar: Math.min((metrics?.beta / 2) * 100, 100) },
                { label: "Max Drawdown", value: `${metrics?.maxDrawdown.toFixed(1)}%`, desc: metrics?.maxDrawdown < 15 ? "Controlled" : "High Risk", color: metrics?.maxDrawdown < 15 ? "#f59e0b" : "#ef4444", bar: Math.min(metrics?.maxDrawdown, 100) },
              ].map((m) => (
                <div key={m.label} className="sdash-risk-item">
                  <div className="sdash-risk-top">
                    <span className="sdash-risk-label">{m.label}</span>
                    <span className="sdash-risk-val" style={{ color: m.color }}>{m.value ?? "—"}</span>
                  </div>
                  <div className="sdash-risk-bar-track">
                    <div className="sdash-risk-bar-fill" style={{ width: `${m.bar ?? 0}%`, background: m.color }} />
                  </div>
                  <div className="sdash-risk-desc" style={{ color: m.color }}>{m.desc ?? ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
