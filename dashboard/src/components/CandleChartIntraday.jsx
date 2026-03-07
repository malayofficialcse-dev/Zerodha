import React, { useEffect, useState, useContext } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { io } from "socket.io-client";
import "./CandleChartIntraday.css";
import BuySellPopup from "./BuySellPopup";
import GeneralContext from "./GeneralContext";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";

const CandleChartIntraday = () => {
  const { selectedSymbol, setSelectedSymbol } = useContext(GeneralContext);
  const { theme } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [ohlc, setOhlc] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("BUY");
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Fetch all companies on mount
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .then((res) => {
        setCompanies(res.data);
        if (!selectedSymbol) setSelectedSymbol(res.data[0]?.symbol);
      })
      .catch(() => setCompanies([]));
  }, []);

  // Fetch OHLC for selected company with polling and streaming
  useEffect(() => {
    if (!selectedSymbol) return;
    let isMounted = true;

    // 1. Fetch historical/DB data
    const fetchData = () => {
      axios
        .get(`${API_BASE_URL}/intraday/${selectedSymbol}/intraday-ohlc`)
        .then((res) => {
          if (isMounted) setOhlc(res.data);
        })
        .catch(() => setOhlc([]));
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // 5s confirmed polling

    // 2. Stream real-time ticks
    const socketURL = API_BASE_URL.replace("/api", "");
    const socket = io(socketURL);

    socket.on("tick", (tickData) => {
      if (!isMounted) return;
      if (tickData.symbol !== selectedSymbol) return;

      setOhlc((prevOhlc) => {
        if (!prevOhlc || prevOhlc.length === 0) return prevOhlc;
        
        const newOhlc = [...prevOhlc];
        const lastIndex = newOhlc.length - 1;
        
        newOhlc[lastIndex] = {
          ...newOhlc[lastIndex],
          close: tickData.close,
          high: Math.max(newOhlc[lastIndex].high, tickData.high),
          low: Math.min(newOhlc[lastIndex].low, tickData.low),
          volume: newOhlc[lastIndex].volume + tickData.volume
        };
        
        return newOhlc;
      });
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, [selectedSymbol]);

  const sortedOhlc = [...ohlc].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const chartData = sortedOhlc.map((d) => ({
    x: new Date(d.date).getTime(),
    y: [d.open, d.high, d.low, d.close],
  }));
  const volumeData = sortedOhlc.map((d) => ({
    x: new Date(d.date).getTime(),
    y: d.volume || Math.floor(Math.random() * 1000 + 1000),
  }));

  const mainOptions = {
    chart: {
      id: "candles",
      type: "candlestick",
      height: 350,
      animations: { enabled: false }, // Direct updates for "live" feel
      toolbar: { autoSelected: "zoom", show: true },
    },
    plotOptions: {
      candlestick: {
        columnWidth: "80%", // Much thicker candles
        colors: { upward: "#22c55e", downward: "#ef4444" },
        wick: { useFillColor: true },
      },
    },
    xaxis: {
      type: "datetime",
      range: 3 * 60 * 1000, // Show last 3 minutes for better density
      labels: {
        style: { colors: theme === "light" ? "#64748b" : "#94a3b8" },
        datetimeFormatter: {
          day: "dd MMM",
          hour: "HH:mm:ss",
          minute: "HH:mm:ss",
        },
      },
      tooltip: { enabled: true },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: theme === "light" ? "#64748b" : "#94a3b8" },
      },
    },
    stroke: {
      width: [1], // Thin border for candles for better definition
    },
    grid: {
      borderColor: theme === "light" ? "#f1f5f9" : "#334155",
    },
  };

  const brushOptions = {
    chart: {
      id: "brush",
      height: 130,
      type: "bar",
      brush: {
        enabled: true,
        target: "candles",
      },
      selection: {
        enabled: true,
        xaxis: {
          min: chartData.length > 18 ? chartData[chartData.length - 18]?.x : (chartData[0]?.x || undefined),
          max: chartData[chartData.length - 1]?.x || undefined,
        },
        fill: { color: "#387ed1", opacity: 0.1 },
        stroke: { color: "#387ed1", width: 1 },
      },
    },
    colors: ["#94a3b8"],
    dataLabels: { enabled: false },
    xaxis: {
      type: "datetime",
      tooltip: { enabled: false },
    },
    yaxis: {
      show: false,
    },
  };

  return (
    <div className="intraday-container">
      <div className="stock-selector mb-4">
        {companies.map((c) => (
          <button
            key={c.symbol}
            onClick={() => setSelectedSymbol(c.symbol)}
            className={`stock-btn ${selectedSymbol === c.symbol ? "active" : ""}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="intraday-header">
        <div className="d-flex align-items-center gap-3">
          <div className="market-status-badge">
            <span className="pulse-dot"></span>
            LIVE MARKET
          </div>
          <h2>{selectedSymbol} Terminal</h2>
        </div>
        <button
          className="btn btn-primary px-4 shadow-sm"
          onClick={() => {
            setPopupType("BUY");
            setSelectedTrade(null);
            setShowPopup(true);
          }}
        >
          Quick Order
        </button>
      </div>
      
      <div className="chart-wrapper p-3 mt-4" style={{ 
        background: 'var(--surface-bg)', 
        borderRadius: 'var(--radius)', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        {chartData.length > 0 ? (
          <>
            <Chart
              options={mainOptions}
              series={[{ data: chartData }]}
              type="candlestick"
              height={350}
            />
            <Chart
              options={brushOptions}
              series={[{ data: volumeData }]}
              type="bar"
              height={130}
            />
          </>
        ) : (
          <div className="no-data-msg py-5">
            Generating live intraday data for {selectedSymbol}...
          </div>
        )}
      </div>
      {showPopup && (
        <BuySellPopup
          type={popupType}
          onClose={() => setShowPopup(false)}
          trade={selectedTrade}
          symbol={selectedSymbol}
        />
      )}
    </div>
  );
};

export default CandleChartIntraday;
