import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AreaChart from "./AreaChart";
import { API_BASE_URL } from "../config/config.js";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/position/allPositions`).then((res) => {
      setAllPositions(res.data);
    });
  }, []);

  // ── Real-Time Integration ────────────────────────────────────
  const symbols = useMemo(() => Array.from(new Set(allPositions.map(p => p.name))), [allPositions]);
  const initialPrices = useMemo(() => {
    const p = {};
    allPositions.forEach(pos => { p[pos.name] = { price: pos.price, prevClose: pos.price }; });
    return p;
  }, [allPositions]);

  const liveTicks = useRealTimeTicks(symbols, initialPrices);

  return (
    <div className="positions-page">
      <div className="holdings-header">
        <h3 className="title">Positions ({allPositions.length})</h3>
        <div className="live-status-chip">
          <span className="dot pulse-green"></span> Live Prices
        </div>
      </div>

      {allPositions.length > 0 && <AreaChart data={allPositions} />}

      <div className="table-responsive order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>
          <tbody>
            {allPositions.map((stock, index) => {
              const tick = liveTicks[stock.name] || { price: stock.price, prevClose: stock.price, changePct: "0.00" };
              const curValue = tick.price * stock.qty;
              const pnl = curValue - (stock.avg * stock.qty);
              const isProfit = pnl >= 0;

              return (
                <tr key={index} className="holding-row">
                  <td>
                    <span className={stock.qty > 0 ? "badge-buy" : "badge-sell"}>
                      {stock.product}
                    </span>
                  </td>
                  <td className="instrument-col">{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td className={`price-col ${tick.isUp ? "up-flash" : "down-flash"}`}>
                    {tick.price.toFixed(2)}
                  </td>
                  <td className={isProfit ? "profit" : "loss"}>
                    {pnl.toFixed(2)}
                  </td>
                  <td className={tick.isUp ? "profit" : "loss"}>{tick.changePct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Positions;
