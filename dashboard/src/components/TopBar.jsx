import React, { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";

// ─── Ticker-tape symbols ──────────────────────────────────────
const TAPE_SYMBOLS = [
  "NIFTY","SENSEX","NIFTY_BANK",
  "RELIANCE","TCS","INFY","WIPRO","HDFCBANK","ICICIBANK","AXISBANK",
  "KOTAKBANK","SBIN","ITC","HUL","M&M","LT","BAJFINANCE","ADANIGREEN",
  "KPITTECH","QUICKHEAL","ONGC","BTC","ETH",
];

const INDEX_SYMBOLS = ["NIFTY", "SENSEX", "NIFTY_BANK"];
const INDEX_LABELS  = { NIFTY: "NIFTY 50", SENSEX: "SENSEX", NIFTY_BANK: "NIFTY BANK" };

// ─── TopBar ───────────────────────────────────────────────────
import GeneralContext from "./GeneralContext";

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen } = React.useContext(GeneralContext);
  const [seedPrices, setSeedPrices] = useState({});
  const [marketOpen, setMarketOpen] = useState(true);
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadNotifications = () => {
    try {
      const list = JSON.parse(localStorage.getItem("notifications") || "[]");
      setNotifications(list);
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener("new-notification", loadNotifications);
    return () => window.removeEventListener("new-notification", loadNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
  };

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("notifications");
  };

  const fetchBalance = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/user/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setBalance(res.data.cashBalance || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check market hours (IST 9:15 – 15:30)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const h = ist.getHours(), m = ist.getMinutes();
      const mins = h * 60 + m;
      setMarketOpen(mins >= 555 && mins <= 930); // 9:15 – 15:30
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch initial prices from DB for seeding
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .catch(() => ({ data: [] }))
      .then((res) => {
        const seed = {};
        (res.data || []).forEach((s) => {
          const last = s.ohlc?.[s.ohlc.length - 1];
          const prev = s.ohlc?.[s.ohlc.length - 2] || last;
          const isUp = last && prev ? last.close >= prev.close : true;
          const change = last && prev ? last.close - prev.close : 0;
          const pct = prev?.close ? ((change / prev.close) * 100).toFixed(2) : "0.00";

          seed[s.symbol] = { 
            price: s.currentPrice, 
            prevClose: prev?.close || s.currentPrice,
            isUp: isUp,
            changePct: pct
          };
        });
        setSeedPrices(seed);
      });
  }, []);

  const ticks = useRealTimeTicks(TAPE_SYMBOLS, seedPrices);

  // ── Index bar ──
  const renderIndex = (sym) => {
    const t = ticks[sym];
    if (!t) return null;
    const pct = t.changePct ?? "0.00";
    const isUp = t.isUp ?? true;
    return (
      <div className="index-item" key={sym}>
        <p className="index">{INDEX_LABELS[sym]}</p>
        <p className="index-points" style={{ color: "var(--text-color)" }}>
          {Number(t.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
        <p className={`percent ${isUp ? "up" : "down"}`}>
          {isUp ? "+" : ""}{pct}%
        </p>
      </div>
    );
  };

  // ── Ticker-tape entries ──
  const tapeItems = TAPE_SYMBOLS.filter((s) => ticks[s]);

  return (
    <div style={{ transition: "background-color 0.3s ease" }}>
      {/* ── Main top bar ── */}
      <div className="topbar-container">
        <div className="topbar-left">
          <div
            className="market-status"
            style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)" }}
          >
            <span className={`dot ${marketOpen ? "dot-green" : "dot-red"}`}></span>
            <span className="status-text">
              MARKETS {marketOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="indices-container">
            {INDEX_SYMBOLS.map((sym) => renderIndex(sym))}
            <div className="balance-badge" style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "600",
              background: theme === "light" ? "#f1f5f9" : "#1e293b",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              marginRight: "10px"
            }}>
              <span>💰</span>
              <span>₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Alert / Notification dropdown */}
            <div className="notification-dropdown-wrapper" style={{ position: "relative" }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn-notification-toggle"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  marginRight: "10px",
                  padding: "5px",
                  position: "relative",
                  color: "var(--text-color)"
                }}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    lineHeight: "1",
                    transform: "translate(25%, -25%)"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="notification-dropdown" style={{
                  position: "absolute",
                  top: "35px",
                  right: "0",
                  width: "320px",
                  background: theme === "light" ? "#ffffff" : "#1e293b",
                  border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "400px"
                }}>
                  {/* Dropdown Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
                  }}>
                    <span style={{ fontWeight: "600", fontSize: "14px", color: theme === "light" ? "#0f172a" : "#f8fafc" }}>Notifications</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {notifications.length > 0 && (
                        <>
                          <button onClick={markAllRead} style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: "2px"
                          }}>Mark read</button>
                          <button onClick={clearAll} style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: "2px"
                          }}>Clear</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Body */}
                  <div style={{
                    overflowY: "auto",
                    padding: "6px 0",
                    flex: 1
                  }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "13px"
                      }}>No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{
                          padding: "10px 14px",
                          borderBottom: theme === "light" ? "1px solid #f1f5f9" : "1px solid #1e293b",
                          background: n.read ? "transparent" : (theme === "light" ? "#eff6ff" : "#172554"),
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          cursor: "pointer"
                        }} onClick={() => markRead(n.id)}>
                          <span style={{ fontSize: "12.5px", color: theme === "light" ? "#334155" : "#cbd5e1", lineHeight: "1.4", textAlign: "left" }}>{n.text}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "left" }}>{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="btn-theme-toggle"
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                marginLeft: "5px",
                padding: "5px",
              }}
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrolling ticker tape ── */}
      {tapeItems.length > 0 && (
        <div className="ticker-tape-wrapper">
          <div className="ticker-tape-track">
            {/* Duplicate for seamless scroll */}
            {[...tapeItems, ...tapeItems].map((sym, i) => {
              const t = ticks[sym];
              const isUp = t.isUp ?? true;
              const pct = t.changePct ?? "0.00";
              return (
                <span className="ticker-tape-item" key={`${sym}-${i}`}>
                  <span className="ticker-sym">{sym}</span>
                  <span
                    className="ticker-price"
                    style={{ color: isUp ? "#26a69a" : "#ef5350" }}
                  >
                    ₹{Number(t.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className="ticker-pct"
                    style={{ color: isUp ? "#26a69a" : "#ef5350" }}
                  >
                    {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{pct}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
