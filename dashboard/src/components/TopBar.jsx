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
const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const [seedPrices, setSeedPrices] = useState({});
  const [marketOpen, setMarketOpen] = useState(true);

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
            <button
              onClick={toggleTheme}
              className="btn-theme-toggle"
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                marginLeft: "15px",
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
