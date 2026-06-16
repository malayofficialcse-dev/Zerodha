import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import {
  TrendingUp, TrendingDown, AccountCircle, Email,
  Timeline, ReceiptLong, Logout, ShowChart, Inventory2,
  Assessment
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import "./UserProfile.css";

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n) =>
  Math.abs(n) >= 1e6
    ? `${(n / 1e6).toFixed(2)}M`
    : Math.abs(n) >= 1e3
    ? `${(n / 1e3).toFixed(1)}K`
    : fmt(n);

/* ─── Stat card ────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon, color, theme }) => {
  const isDark = theme === "dark";
  return (
    <div style={{
      background: isDark ? "#1e293b" : "#ffffff",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      borderRadius: 4, padding: "20px 22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      display: "flex", flexDirection: "column", gap: 6,
      transition: "transform 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <span style={{ color: color || (isDark ? "#94a3b8" : "#94a3b8"), opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 900, color: color || (isDark ? "#f8fafc" : "#0f172a"), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.78rem", color: isDark ? "#64748b" : "#94a3b8" }}>{sub}</div>}
    </div>
  );
};

/* ─── Main ─────────────────────────────────────────────── */
const UserProfile = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg     = isDark ? "#0f172a" : "#f1f5f9";
  const card   = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e2e8f0";
  const text   = isDark ? "#f8fafc" : "#0f172a";
  const muted  = isDark ? "#94a3b8" : "#64748b";
  const thead  = isDark ? "#0f172a" : "#f8fafc";

  const [user,    setUser]    = useState({ username: "", email: "" });
  const [trades,  setTrades]  = useState([]);   // intraday
  const [orders,  setOrders]  = useState([]);   // normal orders
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all"); // all | intraday | orders

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [userRes, tradesRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/user/profile`,      { headers }),
          axios.get(`${API_BASE_URL}/intraday/my`,        { headers }),
          axios.get(`${API_BASE_URL}/order/myOrders`,     { headers }),
        ]);
        setUser(userRes.data);
        setTrades(tradesRes.data || []);
        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── Calculate P&L for each normal order sell ── */
  const enrichedOrders = useMemo(() => {
    // For each SELL order, find average buy price of that stock from prior BUY orders
    return orders.map((order, idx) => {
      if (order.mode !== "SELL") return { ...order, pnl: null };
      let totalQty = 0, totalSpent = 0;
      for (let i = 0; i < idx; i++) {
        const o = orders[i];
        if (o.name !== order.name) continue;
        if (o.mode === "BUY")  { totalQty += o.qty; totalSpent += o.qty * o.price; }
        if (o.mode === "SELL") { totalQty -= o.qty; totalSpent -= o.qty * o.price; }
      }
      const avgBuy = totalQty > 0 ? totalSpent / totalQty : order.price;
      const pnl = (order.price - avgBuy) * order.qty;
      return { ...order, avgBuy, pnl };
    });
  }, [orders]);

  /* ── Merged unified transaction list ── */
  const allTransactions = useMemo(() => {
    const intraday = trades.map(t => ({
      id: t._id, symbol: t.symbol, qty: t.qty,
      buyPrice: t.buyPrice, sellPrice: t.sellPrice,
      pnl: t.profitOrLoss || 0,
      status: t.status, type: "INTRADAY",
      date: t.createdAt,
    }));
    const orderTx = enrichedOrders.map(o => ({
      id: o._id, symbol: o.name, qty: o.qty,
      buyPrice:  o.mode === "BUY"  ? o.price : o.avgBuy || null,
      sellPrice: o.mode === "SELL" ? o.price : null,
      pnl: o.pnl ?? null,
      status: o.mode === "BUY" ? "BOUGHT" : "SOLD",
      type: "ORDER",
      date: o.createdAt,
    }));
    return [...intraday, ...orderTx].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trades, enrichedOrders]);

  const visible = useMemo(() => {
    if (tab === "intraday") return allTransactions.filter(t => t.type === "INTRADAY");
    if (tab === "orders")   return allTransactions.filter(t => t.type === "ORDER");
    return allTransactions;
  }, [allTransactions, tab]);

  /* ── Analytics ── */
  const stats = useMemo(() => {
    const intradayTrades = trades;
    const sellOrders = enrichedOrders.filter(o => o.mode === "SELL" && o.pnl !== null);

    let intradayPnL = 0, ordersPnL = 0;
    let wins = 0, losses = 0;
    let bestPnl = 0, bestSym = "-", worstPnl = 0, worstSym = "-";
    let totalInvested = 0, totalReturned = 0;

    intradayTrades.forEach(t => {
      const pnl = t.profitOrLoss || 0;
      intradayPnL += pnl;
      if (pnl > 0) wins++;
      else if (pnl < 0) losses++;
      if (pnl > bestPnl)  { bestPnl  = pnl;  bestSym  = t.symbol; }
      if (pnl < worstPnl) { worstPnl = pnl;  worstSym = t.symbol; }
      if (t.buyPrice)  totalInvested  += t.buyPrice  * t.qty;
      if (t.sellPrice) totalReturned  += t.sellPrice * t.qty;
    });

    sellOrders.forEach(o => {
      const pnl = o.pnl || 0;
      ordersPnL += pnl;
      if (pnl > 0) wins++;
      else if (pnl < 0) losses++;
      if (pnl > bestPnl)  { bestPnl  = pnl;  bestSym  = o.name; }
      if (pnl < worstPnl) { worstPnl = pnl;  worstSym = o.name; }
    });

    orders.forEach(o => {
      if (o.mode === "BUY")  totalInvested  += o.price * o.qty;
      if (o.mode === "SELL") totalReturned  += o.price * o.qty;
    });

    const totalPnL    = intradayPnL + ordersPnL;
    const closedCount = intradayTrades.length + sellOrders.length;
    const winRate     = closedCount > 0 ? ((wins / closedCount) * 100).toFixed(1) : 0;

    /* Per-stock summary */
    const stockMap = {};
    [...intradayTrades.map(t => ({
      symbol: t.symbol, pnl: t.profitOrLoss || 0, type: "INTRADAY"
    })), ...sellOrders.map(o => ({
      symbol: o.name, pnl: o.pnl || 0, type: "ORDER"
    }))].forEach(({ symbol, pnl }) => {
      if (!stockMap[symbol]) stockMap[symbol] = { pnl: 0, count: 0 };
      stockMap[symbol].pnl += pnl;
      stockMap[symbol].count++;
    });

    const stockSummary = Object.entries(stockMap)
      .map(([symbol, v]) => ({ symbol, ...v }))
      .sort((a, b) => b.pnl - a.pnl);

    return {
      totalPnL, intradayPnL, ordersPnL,
      totalTrades: allTransactions.length,
      closedCount, winRate, wins, losses,
      totalInvested, totalReturned,
      bestTrade: { symbol: bestSym, pnl: bestPnl },
      worstTrade: { symbol: worstSym, pnl: worstPnl },
      stockSummary,
    };
  }, [trades, enrichedOrders, orders, allTransactions]);

  /* ── Donut: win/loss ── */
  const donutOpts = {
    chart: { type: "donut", background: "transparent" },
    labels: ["Winning", "Losing", "Neutral"],
    colors: ["#22c55e", "#ef4444", "#64748b"],
    stroke: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: { donut: { size: "72%", labels: {
        show: true,
        total: { show: true, label: "Win Rate", formatter: () => `${stats?.winRate || 0}%`,
          color: isDark ? "#f8fafc" : "#0f172a", fontSize: "18px", fontWeight: 700 },
        value:  { color: isDark ? "#f8fafc" : "#0f172a", fontSize: "20px", fontWeight: 700 },
      }}}
    },
    legend: { show: false },
    tooltip: { theme },
  };
  const neutral = (stats?.closedCount || 0) - (stats?.wins || 0) - (stats?.losses || 0);
  const donutSeries = [stats?.wins || 0, stats?.losses || 0, Math.max(0, neutral)];

  /* ── Bar: stock P&L ── */
  const stockBarOpts = {
    chart: { type: "bar", background: "transparent", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 2, distributed: true } },
    colors: (stats?.stockSummary || []).map(s => s.pnl >= 0 ? "#22c55e" : "#ef4444"),
    xaxis: { categories: (stats?.stockSummary || []).map(s => s.symbol), labels: { style: { colors: muted, fontSize: "11px" } } },
    yaxis: { labels: { style: { colors: muted, fontSize: "11px" } } },
    dataLabels: { enabled: false },
    grid: { borderColor: isDark ? "#334155" : "#f1f5f9", strokeDashArray: 3 },
    legend: { show: false },
    tooltip: { theme, y: { formatter: v => `₹${fmt(v)}` } },
  };
  const stockBarSeries = [{ name: "P&L", data: (stats?.stockSummary || []).map(s => Number(s.pnl.toFixed(2))) }];

  const handleLogout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", background: bg }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  const tabStyle = (t) => ({
    padding: "6px 16px", borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
    background: tab === t ? "#387ed1" : (isDark ? "#334155" : "#e2e8f0"),
    color: tab === t ? "#fff" : muted,
    transition: "all 0.15s",
  });

  return (
    <div style={{ padding: 24, background: bg, minHeight: "80vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: text, fontWeight: 800, fontSize: "1.8rem", margin: 0 }}>Profile &amp; Analytics</h2>
          <p style={{ color: muted, margin: 0, fontSize: "0.88rem" }}>Full transaction history &amp; performance analysis</p>
        </div>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 22px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.35)",
          background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 600, cursor: "pointer"
        }}>
          <Logout fontSize="small" /> Logout
        </button>
      </div>

      {/* ── KPI cards row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard theme={theme} label="Net P&L" icon={stats?.totalPnL >= 0 ? <TrendingUp fontSize="small"/> : <TrendingDown fontSize="small"/>}
          value={`${stats?.totalPnL >= 0 ? "+" : "-"}₹${fmtK(Math.abs(stats?.totalPnL || 0))}`}
          sub="Intraday + Orders realized"
          color={stats?.totalPnL >= 0 ? "#22c55e" : "#ef4444"} />
        <StatCard theme={theme} label="Total Transactions" icon={<ReceiptLong fontSize="small"/>}
          value={stats?.totalTrades || 0} sub="All orders & intraday trades" />
        <StatCard theme={theme} label="Win Rate" icon={<Timeline fontSize="small"/>}
          value={`${stats?.winRate || 0}%`} sub={`${stats?.wins} wins / ${stats?.losses} losses`}
          color={parseFloat(stats?.winRate) >= 50 ? "#22c55e" : "#ef4444"} />
        <StatCard theme={theme} label="Best Trade" icon={<span style={{fontSize:"1.1rem"}}>🏆</span>}
          value={`+₹${fmtK(stats?.bestTrade?.pnl || 0)}`} sub={`Symbol: ${stats?.bestTrade?.symbol || "-"}`}
          color="#22c55e" />
        <StatCard theme={theme} label="Worst Trade" icon={<span style={{fontSize:"1.1rem"}}>📉</span>}
          value={`-₹${fmtK(Math.abs(stats?.worstTrade?.pnl || 0))}`} sub={`Symbol: ${stats?.worstTrade?.symbol || "-"}`}
          color="#ef4444" />
        <StatCard theme={theme} label="Total Invested" icon={<Inventory2 fontSize="small"/>}
          value={`₹${fmtK(stats?.totalInvested || 0)}`} sub="Cumulative capital deployed" />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

        {/* LEFT: Transaction history */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ margin: 0, color: text, fontWeight: 700, fontSize: "1rem" }}>Transaction History</h4>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={tabStyle("all")}     onClick={() => setTab("all")}>All</button>
              <button style={tabStyle("intraday")} onClick={() => setTab("intraday")}>Intraday</button>
              <button style={tabStyle("orders")}   onClick={() => setTab("orders")}>Orders</button>
            </div>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: thead }}>
                  {["Stock","Qty","Buy Price","Sell Price","P/L","Type","Status","Date"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: muted, fontWeight: 600, textAlign: "left", borderBottom: `1px solid ${border}`, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px 20px", color: muted }}>No transactions yet. Start trading!</td></tr>
                ) : visible.map((t, i) => {
                  const hasPnl = t.pnl !== null && t.pnl !== undefined;
                  const profit = hasPnl && t.pnl > 0;
                  const loss   = hasPnl && t.pnl < 0;
                  return (
                    <tr key={`${t.id}-${i}`} style={{ background: i % 2 === 0 ? card : (isDark ? "#162032" : "#f8fafc"), borderLeft: `3px solid ${t.status === "BOUGHT" || t.status === "OPEN" ? "#22c55e" : t.status === "SOLD" || t.status === "CLOSED" ? (profit ? "#22c55e" : loss ? "#ef4444" : "#64748b") : "#64748b"}` }}>
                      <td style={{ padding: "11px 14px", color: text, fontWeight: 700, whiteSpace: "nowrap" }}>{t.symbol}</td>
                      <td style={{ padding: "11px 14px", color: muted }}>{t.qty}</td>
                      <td style={{ padding: "11px 14px", color: text }}>{t.buyPrice ? `₹${fmt(t.buyPrice)}` : "—"}</td>
                      <td style={{ padding: "11px 14px", color: text }}>{t.sellPrice ? `₹${fmt(t.sellPrice)}` : "—"}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: profit ? "#22c55e" : loss ? "#ef4444" : muted }}>
                        {hasPnl ? (profit ? `+₹${fmt(t.pnl)}` : loss ? `-₹${fmt(Math.abs(t.pnl))}` : "₹0") : "—"}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, background: t.type === "INTRADAY" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)", color: t.type === "INTRADAY" ? "#8b5cf6" : "#3b82f6" }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, background: ["OPEN","BOUGHT"].includes(t.status) ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)", color: ["OPEN","BOUGHT"].includes(t.status) ? "#22c55e" : muted }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: muted, whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                        {t.date ? new Date(t.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Profile + charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* User card */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#387ed1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.4rem", flexShrink: 0 }}>
              {(user.username || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ color: text, fontWeight: 700, fontSize: "1.05rem" }}>{user.username || "Trader"}</div>
              <div style={{ color: muted, fontSize: "0.82rem" }}><Email fontSize="small" style={{ verticalAlign: "middle", marginRight: 4, fontSize: "0.95rem" }} />{user.email || "No email"}</div>
            </div>
          </div>

          {/* P&L breakdown */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, padding: "18px 20px" }}>
            <h4 style={{ color: text, fontWeight: 700, margin: "0 0 14px", fontSize: "0.95rem" }}>P&amp;L Breakdown</h4>
            {[
              { label: "Intraday P&L", val: stats?.intradayPnL || 0 },
              { label: "Orders P&L",   val: stats?.ordersPnL || 0 },
              { label: "Net Total",    val: stats?.totalPnL || 0, bold: true },
            ].map(({ label, val, bold }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${border}`, fontSize: bold ? "0.95rem" : "0.85rem" }}>
                <span style={{ color: bold ? text : muted, fontWeight: bold ? 700 : 500 }}>{label}</span>
                <span style={{ color: val >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                  {val >= 0 ? "+" : "-"}₹{fmt(Math.abs(val))}
                </span>
              </div>
            ))}
          </div>

          {/* Win/Loss donut */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, padding: "18px 20px" }}>
            <h4 style={{ color: text, fontWeight: 700, margin: "0 0 4px", fontSize: "0.95rem" }}>Trade Distribution</h4>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {stats?.closedCount > 0 ? (
                <Chart options={donutOpts} series={donutSeries} type="donut" width="100%" height={220} />
              ) : (
                <div style={{ color: muted, fontSize: "0.85rem", padding: "30px 0" }}>No closed trades yet</div>
              )}
            </div>
          </div>

          {/* Per-stock P&L bar */}
          {stats?.stockSummary?.length > 0 && (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, padding: "18px 20px" }}>
              <h4 style={{ color: text, fontWeight: 700, margin: "0 0 8px", fontSize: "0.95rem" }}>Stock-wise P&amp;L</h4>
              <Chart options={stockBarOpts} series={stockBarSeries} type="bar" height={Math.max(120, stats.stockSummary.length * 36)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
