import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AreaChart from "./AreaChart";
import { API_BASE_URL } from "../config/config.js";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    // Fetch user positions
    axios.get(`${API_BASE_URL}/position/allPositions`).then((res) => {
      setAllPositions(res.data || []);
    }).catch(err => {
      console.error("Error fetching positions:", err);
    });

    // Fetch stocks for mapping names to symbols
    axios.get(`${API_BASE_URL}/stocks/all`).then((res) => {
      setStocks(res.data || []);
    }).catch(err => {
      console.error("Error fetching stocks:", err);
    });
  }, []);

  // Map position names/symbols to correct ticker symbol
  const getSymbol = (name) => {
    const s = stocks.find(st => st.name === name || st.symbol === name);
    return s ? s.symbol : name;
  };

  // ── Real-Time Integration ────────────────────────────────────
  const symbols = useMemo(() => {
    return Array.from(new Set(allPositions.map(p => getSymbol(p.name))));
  }, [allPositions, stocks]);

  const initialPrices = useMemo(() => {
    const p = {};
    allPositions.forEach(pos => {
      const sym = getSymbol(pos.name);
      p[sym] = { price: pos.price || pos.avg || 0, prevClose: pos.price || pos.avg || 0 };
    });
    return p;
  }, [allPositions, stocks]);

  const liveTicks = useRealTimeTicks(symbols, initialPrices);

  // Map live prices back into positions for the chart
  const enrichedPositions = useMemo(() => {
    return allPositions.map(pos => {
      const sym = getSymbol(pos.name);
      const tick = liveTicks[sym] || { price: pos.price || pos.avg || 0 };
      return {
        ...pos,
        price: tick.price
      };
    });
  }, [allPositions, liveTicks, stocks]);

  return (
    <div className="positions-page">
      <div className="holdings-header">
        <h3 className="title">Positions ({allPositions.length})</h3>
        <div className="live-status-chip">
          <span className="dot pulse-green"></span> Live Prices
        </div>
      </div>

      {enrichedPositions.length > 0 && <AreaChart data={enrichedPositions} />}

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
              const sym = getSymbol(stock.name);
              const tick = liveTicks[sym] || { 
                price: stock.price || stock.avg || 0, 
                prevClose: stock.price || stock.avg || 0, 
                changePct: "0.00" 
              };
              
              const currentLTP = typeof tick.price === "number" ? tick.price : (stock.price || stock.avg || 0);
              const curValue = currentLTP * (stock.qty || 0);
              const pnl = curValue - ((stock.avg || 0) * (stock.qty || 0));
              const isProfit = pnl >= 0;

              return (
                <tr key={index} className="holding-row">
                  <td>
                    <span className={(stock.qty || 0) > 0 ? "badge-buy" : "badge-sell"}>
                      {stock.product || "MIS"}
                    </span>
                  </td>
                  <td className="instrument-col">{stock.name}</td>
                  <td>{stock.qty || 0}</td>
                  <td>{typeof stock.avg === "number" ? stock.avg.toFixed(2) : "0.00"}</td>
                  <td className={`price-col ${tick.isUp ? "up-flash" : "down-flash"}`}>
                    {currentLTP.toFixed(2)}
                  </td>
                  <td className={isProfit ? "profit" : "loss"}>
                    {pnl.toFixed(2)}
                  </td>
                  <td className={tick.isUp ? "profit" : "loss"}>{tick.changePct || "0.00"}%</td>
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
