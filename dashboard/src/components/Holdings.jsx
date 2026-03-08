import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import VerticalGraph from "./VerticalGraph";
import AreaChart from "./AreaChart";
import { API_BASE_URL } from "../config/config.js";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/holding/allHoldings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAllHoldings(res.data);
      } catch (err) {
        console.error("Failed to fetch personal holdings:", err);
      }
    };
    fetchHoldings();
  }, []);

  // ── Real-Time P&L Integration ────────────────────────────────
  const symbols = useMemo(() => {
    return Array.from(new Set(allHoldings.map(h => h.name)));
  }, [allHoldings]);

  // Seed with initial prices from the DB load
  const initialPrices = useMemo(() => {
    const p = {};
    allHoldings.forEach(h => {
      p[h.name] = { price: h.price, prevClose: h.price };
    });
    return p;
  }, [allHoldings]);

  const liveTicks = useRealTimeTicks(symbols, initialPrices);

  // Computed summary stats
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalDayChange = 0;

    allHoldings.forEach(stock => {
      const tick = liveTicks[stock.name] || { price: stock.price, prevClose: stock.price };
      totalInvested += stock.avg * stock.qty;
      totalCurrent  += tick.price * stock.qty;
      totalDayChange += (tick.price - tick.prevClose) * stock.qty;
    });

    const totalPnL = totalCurrent - totalInvested;
    const pnlPct   = totalInvested ? (totalPnL / totalInvested) * 100 : 0;

    return { totalInvested, totalCurrent, totalPnL, pnlPct, totalDayChange };
  }, [allHoldings, liveTicks]);

  return (
    <div className="holdings-page">
      <div className="holdings-header">
        <h3 className="title">Holdings ({allHoldings.length})</h3>
        <div className="live-status-chip">
          <span className="dot pulse-green"></span> Live Prices
        </div>
      </div>

      {allHoldings.length > 0 && <AreaChart data={allHoldings} />}

      <div className="table-responsive order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
            </tr>
          </thead>
          <tbody>
            {allHoldings.map((stock, index) => {
              const tick = liveTicks[stock.name] || { price: stock.price, prevClose: stock.price, changePct: "0.00" };
              const curValue = tick.price * stock.qty;
              const pnl = curValue - (stock.avg * stock.qty);
              const isProfit = pnl >= 0;
              
              const dayChange = (tick.price - tick.prevClose) * stock.qty;
              const isDayProfit = dayChange >= 0;

              return (
                <tr key={index} className="holding-row">
                  <td className="instrument-col">{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td className={`price-col ${tick.isUp ? "up-flash" : "down-flash"}`}>
                    {tick.price.toFixed(2)}
                  </td>
                  <td>{curValue.toFixed(2)}</td>
                  <td className={isProfit ? "profit" : "loss"}>
                    {pnl.toFixed(2)}
                  </td>
                  <td>
                    <span className={stock.net.includes("-") ? "badge-sell" : "badge-buy"}>
                      {stock.net}
                    </span>
                  </td>
                  <td className={isDayProfit ? "profit" : "loss"}>
                    {tick.changePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="stats-row holdings-summary">
        <div className="stat-card">
          <p className="label">Total investment</p>
          <h5>{summary.totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h5>
        </div>
        <div className="stat-card">
          <p className="label">Current value</p>
          <h5 className={summary.totalCurrent >= summary.totalInvested ? "profit" : "loss"}>
            {summary.totalCurrent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h5>
        </div>
        <div className="stat-card">
          <p className="label">Total P&L</p>
          <h5 className={summary.totalPnL >= 0 ? "profit" : "loss"}>
            {summary.totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })} 
            <span className="pnl-pct">({summary.pnlPct.toFixed(2)}%)</span>
          </h5>
        </div>
      </div>

      <div className="graph-container">
        <VerticalGraph data={allHoldings} />
      </div>
    </div>
  );
};

export default Holdings;
