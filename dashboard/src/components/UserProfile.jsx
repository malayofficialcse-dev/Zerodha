import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AccountCircle, 
  Email, 
  Timeline, 
  ReceiptLong,
  Logout
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import "./UserProfile.css";

const UserProfile = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState({ username: "", email: "" });
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const [userRes, tradesRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/user/profile`, { headers }),
          axios.get(`${API_BASE_URL}/intraday/my`, { headers }),
          axios.get(`${API_BASE_URL}/order/myOrders`, { headers })
        ]);
        
        // Map Intraday Trades
        const intradayTrades = tradesRes.data.map(t => ({
          _id: t._id,
          symbol: t.symbol,
          qty: t.qty,
          buyPrice: t.buyPrice,
          sellPrice: t.sellPrice,
          profitOrLoss: t.profitOrLoss || 0,
          status: t.status,
          type: "INTRADAY",
          date: t.createdAt
        }));

        // Map Orders
        const orderTrades = ordersRes.data.map(o => ({
          _id: o._id,
          symbol: o.name,
          qty: o.qty,
          buyPrice: o.mode === "BUY" ? o.price : null,
          sellPrice: o.mode === "SELL" ? o.price : null,
          profitOrLoss: 0, 
          status: o.mode === "BUY" ? "BOUGHT" : "SOLD",
          type: "ORDER",
          date: o.createdAt || new Date()
        }));

        const mergedTrades = [...intradayTrades, ...orderTrades].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setUser(userRes.data);
        setTrades(mergedTrades);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ─── Analytics Calculations ──────────────────────────────
  const stats = useMemo(() => {
    const closedTrades = trades; // Or filter by status if needed
    if (closedTrades.length === 0) return null;

    let totalPnL = 0;
    let winningTrades = 0;
    let maxProfit = 0;
    let maxProfitSymbol = "-";

    closedTrades.forEach(t => {
      if (t.type === "ORDER") {
        totalPnL += 0; // Standard orders might not have immediate PnL
      } else {
        const pnl = t.profitOrLoss || 0;
        totalPnL += pnl;
        if (pnl > 0) winningTrades++;
        if (pnl > maxProfit) {
          maxProfit = pnl;
          maxProfitSymbol = t.symbol;
        }
      }
    });

    const activeTrades = closedTrades.filter(t => t.type === "INTRADAY").length;
    const winRate = activeTrades > 0 ? ((winningTrades / activeTrades) * 100).toFixed(1) : 0;

    return {
      totalPnL,
      totalTrades: closedTrades.length,
      winRate,
      winningTrades,
      losingTrades: closedTrades.length - winningTrades,
      bestTrade: { symbol: maxProfitSymbol, pnl: maxProfit }
    };
  }, [trades]);

  // ─── Chart Data ──────────────────────────────────────────
  const doughnutOptions = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Winning Trades', 'Losing Trades'],
    colors: ['#22c55e', '#ef4444'],
    stroke: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, color: theme === 'light' ? '#64748b' : '#94a3b8' },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: theme === 'light' ? '#1e293b' : '#f8fafc' },
            total: {
              show: true,
              label: 'Win Rate',
              formatter: () => stats ? `${stats.winRate}%` : '0%'
            }
          }
        }
      }
    },
    legend: { show: false },
    tooltip: { theme: theme }
  };

  const doughnutSeries = stats ? [stats.winningTrades, stats.losingTrades] : [0, 0];

  if (loading) {
    return (
      <div className="profile-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div>
          <h2 className="profile-title">Profile & Analytics</h2>
          <p className="text-muted m-0">Manage your account and view trading performance</p>
        </div>
        <button className="btn btn-logout d-flex align-items-center gap-2" onClick={handleLogout}>
          <Logout fontSize="small" /> Logout
        </button>
      </div>

      {/* ── Top Analytics Grid ── */}
      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-title d-flex align-items-center justify-content-between">
            Net P&L {stats?.totalPnL >= 0 ? <TrendingUp className="text-success-alt" /> : <TrendingDown className="text-danger-alt" />}
          </div>
          <div className={`stat-value ${stats?.totalPnL >= 0 ? 'text-success-alt' : 'text-danger-alt'}`}>
            {stats?.totalPnL >= 0 ? '+' : '-'}₹{Math.abs(stats?.totalPnL || 0).toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">Lifetime realized returns</div>
        </div>

        <div className="stat-card">
          <div className="stat-title d-flex align-items-center justify-content-between">
            Total Trades <ReceiptLong fontSize="small" />
          </div>
          <div className="stat-value">{stats?.totalTrades || 0}</div>
          <div className="stat-sub">Executed orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-title d-flex align-items-center justify-content-between">
            Win Rate <Timeline fontSize="small" />
          </div>
          <div className="stat-value">{stats?.winRate || 0}%</div>
          <div className="stat-sub">Profitable trades ratio</div>
        </div>

        <div className="stat-card">
          <div className="stat-title d-flex align-items-center justify-content-between">
            Best Trade <span style={{fontSize:'1.2rem'}}>🏆</span>
          </div>
          <div className="stat-value text-success-alt">+₹{stats?.bestTrade.pnl.toLocaleString('en-IN') || 0}</div>
          <div className="stat-sub">Symbol: {stats?.bestTrade.symbol || '-'}</div>
        </div>
      </div>

      <div className="profile-content-grid">
        {/* ── Left: Trade History ── */}
        <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
          <h4 style={{ padding: '20px', margin: 0, borderBottom: '1px solid var(--border-color)' }}>
            Trade History
          </h4>
          <div className="table-responsive">
            <table className="table custom-table m-0">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Buy</th>
                  <th>Sell</th>
                  <th>P/L</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.length > 0 ? (
                  trades.map((t) => (
                    <tr key={t._id}>
                      <td className="fw-bold">{t.symbol}</td>
                      <td>{t.qty}</td>
                      <td>₹{t.buyPrice}</td>
                      <td>{t.sellPrice ? `₹${t.sellPrice}` : "-"}</td>
                      <td className={t.profitOrLoss > 0 ? "text-success-alt fw-bold" : t.profitOrLoss < 0 ? "text-danger-alt fw-bold" : "text-muted"}>
                        {t.type === "INTRADAY" ? (t.profitOrLoss > 0 ? `+₹${t.profitOrLoss.toLocaleString()}` : t.profitOrLoss < 0 ? `-₹${Math.abs(t.profitOrLoss).toLocaleString()}` : "₹0") : "-"}
                      </td>
                      <td>
                        <span className="badge bg-secondary opacity-75">{t.type}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${["OPEN", "BOUGHT"].includes(t.status) ? "status-open" : "status-closed"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      <ReceiptLong className="empty-state-icon" />
                      <div>No trades recorded yet. Start trading to see your history.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: User Info & Charts ── */}
        <div className="d-flex flex-column gap-4">
          <div className="user-info-card m-0">
            <div className="user-avatar">{user.username.charAt(0)}</div>
            <div className="user-details">
              <h4>{user.username || "Trader"}</h4>
              <p><Email fontSize="small" style={{verticalAlign: 'middle', marginRight: '4px'}}/> {user.email || "No email"}</p>
            </div>
          </div>

          <div className="content-card">
            <h4>Trade Distribution</h4>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '250px' }}>
              {trades.length > 0 ? (
                <Chart options={doughnutOptions} series={doughnutSeries} type="donut" width="100%" height={260} />
              ) : (
                <div className="text-muted small">Insufficient data for chart</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
