import React, { useEffect, useState, useContext, useMemo } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { io } from "socket.io-client";
import "./CandleChartIntraday.css";
import BuySellPopup from "./BuySellPopup";
import GeneralContext from "./GeneralContext";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import { 
  CandlestickChart, 
  ShowChart, 
  AreaChart as AreaChartIcon, 
  BarChart as BarChartIcon,
  Timeline,
  Functions,
  Search,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

const CandleChartIntraday = () => {
  const { selectedSymbol, setSelectedSymbol } = useContext(GeneralContext);
  const { theme } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [ohlc, setOhlc] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("BUY");
  const [selectedTrade, setSelectedTrade] = useState(null);

  // New features state
  const [chartType, setChartType] = useState("candlestick");
  const [showMA20, setShowMA20] = useState(false);
  const [showMA50, setShowMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

    const fetchData = () => {
      axios
        .get(`${API_BASE_URL}/intraday/${selectedSymbol}/intraday-ohlc`)
        .then((res) => {
          if (isMounted) setOhlc(res.data);
        })
        .catch(() => setOhlc([]));
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);

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

  const sortedOhlc = useMemo(() => 
    [...ohlc].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [ohlc]
  );

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(c => 
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  // Helper for MA calculation
  const calcMA = (data, period) => {
    if (data.length < period) return [];
    return data.map((_, i) => {
      if (i < period - 1) return { x: data[i].x, y: null };
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, curr) => acc + (curr.y[3] || curr.y), 0);
      return { x: data[i].x, y: parseFloat((sum / period).toFixed(2)) };
    }).filter(d => d.y !== null);
  };

  // Helper for RSI calculation
  const calcRSI = (data, period = 14) => {
    if (data.length <= period) return [];
    let gains = 0, losses = 0;
    
    // Initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const diff = (data[i].y[3] || data[i].y) - (data[i - 1].y[3] || data[i - 1].y);
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    const rsiValues = [];

    for (let i = period + 1; i < data.length; i++) {
        const diff = (data[i].y[3] || data[i].y) - (data[i - 1].y[3] || data[i - 1].y);
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiValues.push({ x: data[i].x, y: parseFloat((100 - 100 / (1 + rs)).toFixed(2)) });
    }
    return rsiValues;
  };

  const chartData = useMemo(() => {
    if (chartType === "candlestick") {
      return sortedOhlc.map((d) => ({
        x: new Date(d.date).getTime(),
        y: [d.open, d.high, d.low, d.close],
      }));
    } else if (chartType === "bar") {
      return sortedOhlc.map((d) => ({
        x: new Date(d.date).getTime(),
        y: d.close,
        fillColor: d.close >= d.open ? "#22c55e" : "#ef4444"
      }));
    } else {
      return sortedOhlc.map((d) => ({
        x: new Date(d.date).getTime(),
        y: d.close,
      }));
    }
  }, [sortedOhlc, chartType]);

  const ma20Data = useMemo(() => 
    showMA20 ? calcMA(chartData, 20) : [], 
    [chartData, showMA20]
  );
  const ma50Data = useMemo(() => 
    showMA50 ? calcMA(chartData, 50) : [], 
    [chartData, showMA50]
  );

  const rsiData = useMemo(() => 
    showRSI ? calcRSI(chartData, 14) : [], 
    [chartData, showRSI]
  );

  const volumeData = useMemo(() => 
    sortedOhlc.map((d) => ({
      x: new Date(d.date).getTime(),
      y: d.volume || Math.floor(Math.random() * 1000 + 1000),
    })),
    [sortedOhlc]
  );

  const mainOptions = {
    chart: {
      id: "intraday-main",
      type: chartType,
      height: 350,
      animations: { enabled: false },
      toolbar: { autoSelected: "zoom", show: true },
      background: 'transparent',
      foreColor: theme === "light" ? "#64748b" : "#94a3b8"
    },
    plotOptions: {
      candlestick: {
        columnWidth: "80%",
        colors: { upward: "#22c55e", downward: "#ef4444" },
        wick: { useFillColor: true },
      },
      bar: {
        columnWidth: "50%",
        distributed: false,
      }
    },
    stroke: {
      width: chartType === "line" || chartType === "area" ? 2 : 1,
      curve: 'smooth'
    },
    xaxis: {
      type: "datetime",
      range: chartType === "candlestick" ? 3 * 60 * 1000 : undefined,
      labels: {
        datetimeFormatter: { day: "dd MMM", hour: "HH:mm", minute: "HH:mm" },
      },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        formatter: (val) => val?.toFixed(2)
      }
    },
    grid: {
      borderColor: theme === "light" ? "#f1f5f9" : "#334155",
      strokeDashArray: 4
    },
    tooltip: { theme: theme },
    legend: { show: true, position: 'top' }
  };

  const series = [
    {
      name: selectedSymbol,
      type: chartType,
      data: chartData
    },
    ...(showMA20 ? [{ name: "MA20", type: "line", data: ma20Data }] : []),
    ...(showMA50 ? [{ name: "MA50", type: "line", data: ma50Data }] : [])
  ];

  const brushOptions = {
    chart: {
      id: "brush",
      height: 130,
      type: "bar",
      brush: { enabled: true, target: "intraday-main" },
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
    xaxis: { type: "datetime" },
    yaxis: { show: false },
  };

  const rsiOptions = {
    chart: {
      id: "rsi",
      height: 130,
      type: "line",
      background: 'transparent',
      foreColor: theme === "light" ? "#64748b" : "#94a3b8",
      toolbar: { show: false }
    },
    colors: ["#8b5cf6"],
    stroke: { width: 2 },
    xaxis: { type: "datetime", labels: { show: false } },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 2,
      labels: { formatter: (v) => v.toFixed(0) }
    },
    grid: {
      borderColor: theme === "light" ? "#f1f5f9" : "#334155",
      strokeDashArray: 4
    },
    annotations: {
      yaxis: [
        { y: 70, borderColor: '#ef4444', label: { text: '70', style: { color: '#ef4444' } } },
        { y: 30, borderColor: '#22c55e', label: { text: '30', style: { color: '#22c55e' } } }
      ]
    },
    tooltip: { theme: theme }
  };

  return (
    <div className="intraday-container">
      <div className="stock-selection-bar mb-3">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search stocks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.value || e.target.value)}
          />
        </div>
        <div className="ticker-items">
          {filteredCompanies.map((c) => (
            <button
              key={c.symbol}
              onClick={() => setSelectedSymbol(c.symbol)}
              className={`ticker-btn ${selectedSymbol === c.symbol ? "active" : ""}`}
            >
              <span className="ticker-sym">{c.symbol}</span>
            </button>
          ))}
          {filteredCompanies.length === 0 && (
            <div className="no-results">No stocks found</div>
          )}
        </div>
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
      
      <div className="chart-wrapper p-3 mt-4">
        <div className="chart-toolbar d-flex justify-content-between align-items-center mb-3">
          <div className="toolbar-group d-flex gap-2">
            <button 
              className={`toolbar-btn ${chartType === "candlestick" ? "active" : ""}`}
              onClick={() => setChartType("candlestick")}
              title="Candlesticks"
            >
              <CandlestickChart fontSize="small" />
            </button>
            <button 
              className={`toolbar-btn ${chartType === "area" ? "active" : ""}`}
              onClick={() => setChartType("area")}
              title="Area Chart"
            >
              <AreaChartIcon fontSize="small" />
            </button>
            <button 
              className={`toolbar-btn ${chartType === "line" ? "active" : ""}`}
              onClick={() => setChartType("line")}
              title="Line Chart"
            >
              <ShowChart fontSize="small" />
            </button>
            <button 
              className={`toolbar-btn ${chartType === "bar" ? "active" : ""}`}
              onClick={() => setChartType("bar")}
              title="Bar Chart"
            >
              <BarChartIcon fontSize="small" />
            </button>
          </div>

          <div className="toolbar-group d-flex gap-2 align-items-center">
            <div className="indicator-toggles d-flex gap-1 border-end pe-2">
              <button 
                className={`indicator-btn ${showMA20 ? "active" : ""}`}
                onClick={() => setShowMA20(!showMA20)}
              >
                MA20
              </button>
              <button 
                className={`indicator-btn ${showMA50 ? "active" : ""}`}
                onClick={() => setShowMA50(!showMA50)}
              >
                MA50
              </button>
              <button 
                className={`indicator-btn ${showRSI ? "active" : ""}`}
                onClick={() => setShowRSI(!showRSI)}
              >
                RSI
              </button>
            </div>
            <button 
              className={`toolbar-btn ${showVolume ? "active" : ""}`}
              onClick={() => setShowVolume(!showVolume)}
              title="Toggle Volume"
            >
              {showVolume ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <>
            <Chart
              options={mainOptions}
              series={series}
              type={chartType}
              height={350}
            />
            {showRSI && (
              <div className="rsi-container mt-2">
                <div className="small fw-bold mb-1" style={{ color: '#8b5cf6' }}>RSI (14)</div>
                <Chart
                  options={rsiOptions}
                  series={[{ name: "RSI", data: rsiData }]}
                  type="line"
                  height={130}
                />
              </div>
            )}
            {showVolume && (
              <div className="volume-container mt-2">
                <div className="small fw-bold mb-1" style={{ color: '#94a3b8' }}>Volume</div>
                <Chart
                  options={brushOptions}
                  series={[{ name: "Volume", data: volumeData }]}
                  type="bar"
                  height={130}
                />
              </div>
            )}
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
