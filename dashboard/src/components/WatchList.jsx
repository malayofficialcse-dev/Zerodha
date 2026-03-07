import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
  NotificationsNone,
} from "@mui/icons-material";
import { watchlist as staticWatchlist } from "../data/data";
import { DoughnutChart } from "./DoughnoutChart";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";
import { API_BASE_URL } from "../config/config.js";
import CreateAlertModal from "./CreateAlertModal";

const WATCHLIST_SYMBOLS = staticWatchlist.map((s) => s.name);

const WatchList = () => {
  const [seedPrices, setSeedPrices] = useState(() => {
    // Seed from static data so UI doesn't show blank on load
    const seed = {};
    staticWatchlist.forEach((s) => {
      seed[s.name] = {
        price: s.price,
        prevClose: s.price,
        changePct: s.percent.replace("%", ""),
        isUp: !s.isDown,
      };
    });
    return seed;
  });

  // Fetch initial prices from DB for accuracy
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .catch(() => ({ data: [] }))
      .then((res) => {
        setSeedPrices((prev) => {
          const next = { ...prev };
          (res.data || []).forEach((s) => {
            if (WATCHLIST_SYMBOLS.includes(s.symbol)) {
              // Extract isUp and changePct from OHLC history if available
              const last = s.ohlc?.[s.ohlc.length - 1];
              const prev = s.ohlc?.[s.ohlc.length - 2] || last;
              const isUp = last && prev ? last.close >= prev.close : true;
              const change = last && prev ? last.close - prev.close : 0;
              const pct = prev?.close ? ((change / prev.close) * 100).toFixed(2) : "0.00";

              next[s.symbol] = {
                price: s.currentPrice,
                prevClose: prev?.close || s.currentPrice,
                changePct: pct,
                isUp: isUp,
              };
            }
          });
          return next;
        });
      });
  }, []);

  const ticks = useRealTimeTicks(WATCHLIST_SYMBOLS, seedPrices);

  // Build live watchlist from ticks (fall back to static data)
  const liveWatchlist = staticWatchlist.map((s) => {
    const t = ticks[s.name];
    if (!t) return s;
    return {
      ...s,
      price: Number(t.price).toFixed(2),
      percent: `${t.isUp ? "+" : ""}${t.changePct ?? "0.00"}%`,
      isDown: t.isUp === undefined ? s.isDown : !t.isUp, // Preserve static color if isUp is missing
    };
  });

  const doughnutData = {
    labels: liveWatchlist.map((s) => s.name),
    datasets: [
      {
        label: "Price",
        data: liveWatchlist.map((s) => parseFloat(s.price)),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(231, 76, 60, 0.8)",
          "rgba(26, 188, 156, 0.8)",
          "rgba(52, 152, 219, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg: infy, bse, nifty fut"
          className="search"
        />
        <span className="counts">{liveWatchlist.length} / 50</span>
      </div>

      <div className="watchlist-live-badge">
        <span className="live-dot"></span>
        <span>LIVE</span>
      </div>

      <ul className="list">
        {liveWatchlist.map((stock, index) => (
          <WatchListItem stock={stock} key={index} />
        ))}
      </ul>

      <div className="chart-wrapper" style={{ padding: "20px" }}>
        <DoughnutChart data={doughnutData} />
      </div>
    </div>
  );
};

const WatchListItem = ({ stock }) => {
  const [showActions, setShowActions] = useState(false);
  const [flash, setFlash] = useState(null); // "up" | "down" | null
  const prevPrice = React.useRef(stock.price);

  useEffect(() => {
    const current = parseFloat(stock.price);
    const prev = parseFloat(prevPrice.current);
    if (current !== prev) {
      setFlash(current > prev ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 600);
      prevPrice.current = stock.price;
      return () => clearTimeout(t);
    }
  }, [stock.price]);

  return (
    <li
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`watchlist-item ${flash ? `flash-${flash}` : ""}`}
    >
      <div className="item">
        <div className="item-name">
          <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        </div>
        <div className="item-info">
          <span className="percent">{stock.percent}</span>
          {stock.isDown ? (
            <KeyboardArrowDown className="down-icon" />
          ) : (
            <KeyboardArrowUp className="up-icon" />
          )}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showActions && <WatchListActions uid={stock.name} />}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const [showModal, setShowModal] = useState(false);
  const generalContext = useContext(GeneralContext);

  const handleOpenBuyWindow = () => generalContext.openBuyWindow(uid);
  const handleOpenSellWindow = () => generalContext.openSellWindow(uid);
  const handleAnalyticsClick = () => generalContext.setSelectedSymbol(uid);

  return (
    <>
      <div className="actions">
        <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
          <button className="buy-btn" onClick={handleOpenBuyWindow}>Buy</button>
        </Tooltip>
        <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
          <button className="sell-btn" onClick={handleOpenSellWindow}>Sell</button>
        </Tooltip>
        <Tooltip title="Alert (L)" placement="top" arrow TransitionComponent={Grow}>
          <button className="action-btn" onClick={() => setShowModal(true)}>
            <NotificationsNone className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="Analytics (A)" placement="top" arrow TransitionComponent={Grow}>
          <button className="action-btn" onClick={handleAnalyticsClick}>
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
          <button className="action-btn">
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </div>
      {showModal && (
        <CreateAlertModal 
          initialSymbol={uid} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
          }} 
        />
      )}
    </>
  );
};

export default WatchList;
