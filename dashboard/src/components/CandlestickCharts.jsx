import React, { useEffect, useState, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";
import { Search } from "@mui/icons-material";
import "./CandleChartIntraday.css";
import "./ChartsEnhanced.css";

// ─── Timeframe options ────────────────────────────────────────
const TIMEFRAMES = [
  { label: "5s",  candles: 20  },
  { label: "1m",  candles: 60  },
  { label: "5m",  candles: 50  },
  { label: "1H",  candles: 60  },
  { label: "1D",  candles: 100 },
];

// ─── Helper: compute simple MA ───────────────────────────────
function calcMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, d) => s + d.y[3], 0) / period;
    return { x: data[i].x, y: Number(avg.toFixed(2)) };
  }).filter(Boolean);
}

// ─── LivePriceBadge ──────────────────────────────────────────
const LivePriceBadge = ({ symbol, liveTick }) => {
  const t = liveTick?.[symbol];
  if (!t) return null;
  const isUp = t.isUp ?? true;
  return (
    <div className={`live-price-badge ${isUp ? "badge-up" : "badge-down"}`}>
      <span className="badge-pulse"></span>
      <span className="badge-symbol">{symbol}</span>
      <span className="badge-price">
        ₹{Number(t.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
      <span className="badge-change">
        {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{t.changePct}%
      </span>
    </div>
  );
};

// ─── StatsRow ────────────────────────────────────────────────
const StatsRow = ({ ohlc, company }) => {
  if (!ohlc || ohlc.length === 0) return null;
  const last  = ohlc[ohlc.length - 1];
  const first = ohlc[0];
  const allHighs = ohlc.map(d => d.high);
  const allLows  = ohlc.map(d => d.low);
  const periodHigh = Math.max(...allHighs);
  const periodLow  = Math.min(...allLows);
  const totalVol   = ohlc.reduce((s, d) => s + (d.volume || 0), 0);
  const priceRange = periodHigh - periodLow || 1;
  const pct52 = ((last.close - periodLow) / priceRange) * 100;

  const stats = [
    { label: "Open",   value: `₹${Number(first.open).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { label: "High",   value: `₹${Number(last.high).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,  color: "#26a69a" },
    { label: "Low",    value: `₹${Number(last.low).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,   color: "#ef5350" },
    { label: "Close",  value: `₹${Number(last.close).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
    { label: "Volume", value: totalVol >= 1e6 ? `${(totalVol/1e6).toFixed(1)}M` : `${(totalVol/1e3).toFixed(0)}K` },
  ];

  return (
    <div className="chart-stats-panel">
      {stats.map(s => (
        <div className="stat-chip" key={s.label}>
          <span className="stat-chip-label">{s.label}</span>
          <span className="stat-chip-value" style={s.color ? { color: s.color } : {}}>
            {s.value}
          </span>
        </div>
      ))}
      {/* 52W High/Low Range bar */}
      <div className="range-bar-wrap">
        <span className="range-label">Period Low</span>
        <div className="range-track">
          <div
            className="range-fill"
            style={{ width: `${Math.max(2, Math.min(100, pct52))}%` }}
          />
          <div className="range-thumb" style={{ left: `${Math.max(2, Math.min(98, pct52))}%` }} />
        </div>
        <span className="range-label">Period High</span>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CandlestickCharts = () => {
  const { theme } = useTheme();
  const [companies, setCompanies]       = useState([]);
  const [selected, setSelected]         = useState(null);
  const [ohlc, setOhlc]                 = useState([]);
  const [tfIndex, setTfIndex]           = useState(4);     // default: 1D
  const [showMA20, setShowMA20]         = useState(true);
  const [showMA50, setShowMA50]         = useState(false);
  const [showVolume, setShowVolume]     = useState(true);
  const [showRSI, setShowRSI]           = useState(false);
  const [showMACD, setShowMACD]         = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");

  const allSymbols = useMemo(() => companies.map(c => c.symbol), [companies]);
  const liveTick = useRealTimeTicks(allSymbols);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(c => 
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  // ── Fetch companies on mount ──
  useEffect(() => {
    axios.get(`${API_BASE_URL}/stocks/all`).then((res) => {
      setCompanies(res.data);
      if (res.data.length > 0) setSelected(res.data[0].symbol);
    });
  }, []);

  // ── Fetch OHLC data for selected stock ──
  useEffect(() => {
    if (!selected) return;
    axios.get(`${API_BASE_URL}/stocks/${selected}/ohlc`).then((res) => {
      setOhlc(res.data || []);
    });
  }, [selected]);

  // ── Sync chart with live ticks ──
  const selectedTick = liveTick[selected];
  useEffect(() => {
    if (!selectedTick || ohlc.length === 0) return;

    setOhlc((prev) => {
      if (prev.length === 0) return prev;
      const lastIdx = prev.length - 1;
      const lastCandle = prev[lastIdx];

      const updatedCandle = {
        ...lastCandle,
        close: selectedTick.price,
        high: Math.max(lastCandle.high, selectedTick.price),
        low: Math.min(lastCandle.low, selectedTick.price),
        volume: selectedTick.volume,
      };

      const next = [...prev];
      next[lastIdx] = updatedCandle;
      return next;
    });
  }, [selectedTick, selected]);

  // ── Build chart data scoped to selected timeframe ──
  const { chartData, volumeData, rsiData, macdData } = useMemo(() => {
    const isValid =
      Array.isArray(ohlc) &&
      ohlc.length > 0 &&
      ohlc.every(
        (d) =>
          d &&
          typeof d.open  === "number" &&
          typeof d.high  === "number" &&
          typeof d.low   === "number" &&
          typeof d.close === "number" &&
          d.date
      );

    if (!isValid) return { chartData: [], volumeData: [], rsiData: [], macdData: { macd: [], signal: [], histogram: [] } };

    const sliced = ohlc.slice(-TIMEFRAMES[tfIndex].candles);

    // Calculate a static time shift to make the last data point always end at the current moment
    const latestTimestamp = sliced.length > 0 ? new Date(sliced[sliced.length - 1].date).getTime() : 0;
    const timeOffset = latestTimestamp > 0 ? Date.now() - latestTimestamp : 0;

    const cd = sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: [d.open, d.high, d.low, d.close] }));
    const vd = sliced.map((d) => ({
      x: new Date(d.date).getTime() + timeOffset,
      y: d.volume || 0,
      fillColor: d.close >= d.open ? "#26a69a55" : "#ef535055",
    }));

    const rd = sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.rsi || null }));
    const md = {
      macd: sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.macd || null })),
      signal: sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.signal || null })),
      histogram: sliced.map((d) => ({
        x: new Date(d.date).getTime() + timeOffset,
        y: d.histogram || 0,
        color: (d.histogram || 0) >= 0 ? "#26a69a" : "#ef5350"
      }))
    };

    return { chartData: cd, volumeData: vd, rsiData: rd, macdData: md };
  }, [ohlc, tfIndex]);

  // ── Moving averages ──
  const ma20 = useMemo(() => showMA20 ? calcMA(chartData, Math.min(20, chartData.length)) : [], [chartData, showMA20]);
  const ma50 = useMemo(() => showMA50 ? calcMA(chartData, Math.min(50, chartData.length)) : [], [chartData, showMA50]);

  const labelColors = theme === "light" ? "#64748b" : "#94a3b8";
  const gridColor   = theme === "light" ? "#f1f5f9" : "#1e293b";

  const commonOptions = {
    chart: { 
      toolbar: { show: false }, 
      background: "transparent", 
      animations: { enabled: false },
      sync: { enabled: true, group: "equity-charts" }
    },
    xaxis: {
      type: "datetime",
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      opposite: true,
      labels: { style: { colors: labelColors, fontSize: "0.7rem" } }
    },
    grid: { borderColor: gridColor, strokeDashArray: 3 },
    tooltip: { theme: theme }
  };

  const candleOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "candlestick", id: "candle-main" },
    xaxis: { 
      ...commonOptions.xaxis, 
      labels: { 
        show: true, 
        formatter: function(val) {
          if (!val) return "";
          return new Date(val).toLocaleString("en-IN", {
            month: "short", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
          });
        },
        style: { colors: labelColors, fontSize: "0.7rem" } 
      }, 
      tickAmount: 6 
    },
    yaxis: { 
      ...commonOptions.yaxis, 
      labels: { ...commonOptions.yaxis.labels, formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}` } 
    },
    plotOptions: {
      candlestick: { colors: { upward: "#26a69a", downward: "#ef5350" }, wick: { useFillColor: true } }
    }
  };

  const volumeOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "bar", id: "vol-chart" },
    yaxis: { ...commonOptions.yaxis, labels: { ...commonOptions.yaxis.labels, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v } }
  };

  const rsiOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "line", id: "rsi-chart" },
    yaxis: { min: 0, max: 100, tickAmount: 2, labels: { show: true, style: { colors: labelColors } } },
    annotations: {
      position: 'back',
      yaxis: [
        { y: 70, borderColor: '#ef5350', label: { text: 'Overbought', style: { color: '#ef5350', background: 'transparent' } } },
        { y: 30, borderColor: '#26a69a', label: { text: 'Oversold', style: { color: '#26a69a', background: 'transparent' } } }
      ]
    },
    stroke: { width: 2, colors: ["#8b5cf6"] }
  };

  const macdOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "line", id: "macd-chart" },
    stroke: { width: [2, 2], curve: 'smooth' },
    colors: ["#2196f3", "#ff9800"], // MACD (Blue), Signal (Orange)
    plotOptions: { bar: { columnWidth: '80%' } }
  };

  const maLineSeries = [
    ...(showMA20 && ma20.length > 0 ? [{ name: "MA20", data: ma20, color: "#f59e0b", type: "line" }] : []),
    ...(showMA50 && ma50.length > 0 ? [{ name: "MA50", data: ma50, color: "#8b5cf6", type: "line" }] : []),
  ];

  const selectedCompany = companies.find(c => c.symbol === selected);

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* ── Page header ── */}
      <div className="charts-page-header">
        <div>
          <h2 className="charts-title">Charts</h2>
          <p className="charts-sub">Professional Technical Analysis</p>
        </div>
        {selected && (
          <LivePriceBadge symbol={selected} liveTick={liveTick} />
        )}
      </div>

      {/* ── Stock selection bar (Search + Ticker) ── */}
      <div className="stock-selection-bar mb-4">
        <div className="search-box">
          <Search className="search-icon-mui" />
          <input 
            type="text" 
            placeholder="Search stocks (eg: infy, bse...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ticker-items">
          {filteredCompanies.map((c) => (
            <button
              key={c.symbol}
              onClick={() => setSelected(c.symbol)}
              className={`ticker-btn ${selected === c.symbol ? "active" : ""}`}
            >
              <span className="ticker-sym">{c.symbol}</span>
            </button>
          ))}
          {filteredCompanies.length === 0 && (
            <div className="no-results">No stocks found</div>
          )}
        </div>
      </div>

      {/* ── Chart controls toolbar ── */}
      <div className="chart-toolbar">
        <div className="tf-group">
          {TIMEFRAMES.map((tf, i) => (
            <button key={tf.label} className={`tf-btn ${tfIndex === i ? "tf-active" : ""}`} onClick={() => setTfIndex(i)}>{tf.label}</button>
          ))}
        </div>

        <div className="overlay-group">
          <button className={`overlay-btn ${showMA20 ? "overlay-active-gold" : ""}`} onClick={() => setShowMA20(v => !v)}>MA 20</button>
          <button className={`overlay-btn ${showMA50 ? "overlay-active-purple" : ""}`} onClick={() => setShowMA50(v => !v)}>MA 50</button>
          <button className={`overlay-btn ${showVolume ? "overlay-active-blue" : ""}`} onClick={() => setShowVolume(v => !v)}>Volume</button>
          <button className={`overlay-btn ${showRSI ? "overlay-active-purple" : ""}`} onClick={() => setShowRSI(v => !v)}>RSI</button>
          <button className={`overlay-btn ${showMACD ? "overlay-active-gold" : ""}`} onClick={() => setShowMACD(v => !v)}>MACD</button>
        </div>

        <div className="chart-company-info">
          {selectedCompany && (
            <>
              <span className="company-name-chip">{selectedCompany.name}</span>
              <span className="sector-chip">{selectedCompany.sector}</span>
            </>
          )}
        </div>
      </div>

      <StatsRow ohlc={ohlc.slice(-TIMEFRAMES[tfIndex].candles)} company={selectedCompany} />

      {/* ── Main chart area ── */}
      <div className="chart-main-card">
        {chartData.length > 0 ? (
          <>
            <Chart
              options={candleOptions}
              series={[{ name: "OHLC", data: chartData, type: "candlestick" }, ...maLineSeries]}
              type="candlestick"
              height={350}
            />

            {showVolume && (
              <div className="sub-chart-container">
                <Chart options={volumeOptions} series={[{ name: "Volume", data: volumeData }]} type="bar" height={100} />
              </div>
            )}

            {showRSI && (
              <div className="sub-chart-container">
                <div className="sub-chart-label">RSI (14)</div>
                <Chart options={rsiOptions} series={[{ name: "RSI", data: rsiData }]} type="line" height={100} />
              </div>
            )}

            {showMACD && (
              <div className="sub-chart-container">
                <div className="sub-chart-label">MACD (12, 26, 9)</div>
                <Chart 
                  options={macdOptions} 
                  series={[
                    { name: "Histogram", type: "bar", data: macdData.histogram },
                    { name: "MACD", type: "line", data: macdData.macd },
                    { name: "Signal", type: "line", data: macdData.signal }
                  ]} 
                  height={150} 
                />
              </div>
            )}
          </>
        ) : (
          <div className="chart-loading"><div className="chart-spinner"></div><p>Loading chart data…</p></div>
        )}
      </div>

      {/* ── Market Heatmap ── */}
      <div className="market-heatmap">
        <h3 className="heatmap-title">Market Overview</h3>
        <div className="heatmap-grid">
          {companies.map((c) => {
            const t = liveTick?.[c.symbol];
            const isUp = t?.isUp ?? true;
            const pct = t?.changePct ?? "0.00";
            const intensity = Math.min(Math.abs(parseFloat(pct)), 5) / 5;
            const bg = isUp ? `rgba(38, 166, 154, ${0.1 + intensity * 0.5})` : `rgba(239, 83, 80, ${0.1 + intensity * 0.5})`;
            return (
              <div key={c.symbol} className={`heatmap-cell ${selected === c.symbol ? "heatmap-selected" : ""}`} style={{ background: bg }} onClick={() => setSelected(c.symbol)}>
                <span className="heatmap-sym">{c.symbol}</span>
                <span className="heatmap-price">{t ? `₹${Number(t.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}</span>
                <span className="heatmap-pct" style={{ color: isUp ? "#26a69a" : "#ef5350" }}>{isUp ? "+" : ""}{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CandlestickCharts;
