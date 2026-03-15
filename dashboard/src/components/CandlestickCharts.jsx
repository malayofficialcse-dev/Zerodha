// import React, { useEffect, useState, useRef, useMemo } from "react";
// import Chart from "react-apexcharts";
// import axios from "axios";
// import { io } from "socket.io-client";
// import { API_BASE_URL } from "../config/config.js";
// import { useTheme } from "../ThemeContext.jsx";
// import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";
// import { Search } from "@mui/icons-material";
// import "./CandleChartIntraday.css";
// import "./ChartsEnhanced.css";

// // ─── Timeframe options ────────────────────────────────────────
// const TIMEFRAMES = [
//   { label: "5s",  candles: 20  },
//   { label: "1m",  candles: 60  },
//   { label: "5m",  candles: 50  },
//   { label: "1H",  candles: 60  },
//   { label: "1D",  candles: 100 },
// ];

// // ─── Helper: compute simple MA ───────────────────────────────
// function calcMA(data, period) {
//   return data.map((_, i) => {
//     if (i < period - 1) return null;
//     const slice = data.slice(i - period + 1, i + 1);
//     const avg = slice.reduce((s, d) => s + d.y[3], 0) / period;
//     return { x: data[i].x, y: Number(avg.toFixed(2)) };
//   }).filter(Boolean);
// }

// // ─── LivePriceBadge ──────────────────────────────────────────
// const LivePriceBadge = ({ symbol, liveTick }) => {
//   const t = liveTick?.[symbol];
//   if (!t) return null;
//   const isUp = t.isUp ?? true;
//   return (
//     <div className={`live-price-badge ${isUp ? "badge-up" : "badge-down"}`}>
//       <span className="badge-pulse"></span>
//       <span className="badge-symbol">{symbol}</span>
//       <span className="badge-price">
//         ₹{Number(t.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//       </span>
//       <span className="badge-change">
//         {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{t.changePct}%
//       </span>
//     </div>
//   );
// };

// // ─── StatsRow ────────────────────────────────────────────────
// const StatsRow = ({ ohlc, company }) => {
//   if (!ohlc || ohlc.length === 0) return null;
//   const last  = ohlc[ohlc.length - 1];
//   const first = ohlc[0];
//   const allHighs = ohlc.map(d => d.high);
//   const allLows  = ohlc.map(d => d.low);
//   const periodHigh = Math.max(...allHighs);
//   const periodLow  = Math.min(...allLows);
//   const totalVol   = ohlc.reduce((s, d) => s + (d.volume || 0), 0);
//   const priceRange = periodHigh - periodLow || 1;
//   const pct52 = ((last.close - periodLow) / priceRange) * 100;

//   const stats = [
//     { label: "Open",   value: `₹${Number(first.open).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
//     { label: "High",   value: `₹${Number(last.high).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,  color: "#26a69a" },
//     { label: "Low",    value: `₹${Number(last.low).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,   color: "#ef5350" },
//     { label: "Close",  value: `₹${Number(last.close).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
//     { label: "Volume", value: totalVol >= 1e6 ? `${(totalVol/1e6).toFixed(1)}M` : `${(totalVol/1e3).toFixed(0)}K` },
//   ];

//   return (
//     <div className="chart-stats-panel">
//       {stats.map(s => (
//         <div className="stat-chip" key={s.label}>
//           <span className="stat-chip-label">{s.label}</span>
//           <span className="stat-chip-value" style={s.color ? { color: s.color } : {}}>
//             {s.value}
//           </span>
//         </div>
//       ))}
//       {/* 52W High/Low Range bar */}
//       <div className="range-bar-wrap">
//         <span className="range-label">Period Low</span>
//         <div className="range-track">
//           <div
//             className="range-fill"
//             style={{ width: `${Math.max(2, Math.min(100, pct52))}%` }}
//           />
//           <div className="range-thumb" style={{ left: `${Math.max(2, Math.min(98, pct52))}%` }} />
//         </div>
//         <span className="range-label">Period High</span>
//       </div>
//     </div>
//   );
// };

// // ─── Main Component ──────────────────────────────────────────
// const CandlestickCharts = () => {
//   const { theme } = useTheme();
//   const [companies, setCompanies]       = useState([]);
//   const [selected, setSelected]         = useState(null);
//   const [ohlc, setOhlc]                 = useState([]);
//   const [tfIndex, setTfIndex]           = useState(4);     // default: 1D
//   const [showMA20, setShowMA20]         = useState(true);
//   const [showMA50, setShowMA50]         = useState(false);
//   const [showVolume, setShowVolume]     = useState(true);
//   const [showRSI, setShowRSI]           = useState(false);
//   const [showMACD, setShowMACD]         = useState(false);
//   const [searchTerm, setSearchTerm]     = useState("");

//   const allSymbols = useMemo(() => companies.map(c => c.symbol), [companies]);
//   const liveTick = useRealTimeTicks(allSymbols);

//   const filteredCompanies = useMemo(() => {
//     if (!searchTerm) return companies;
//     return companies.filter(c => 
//       c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       c.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [companies, searchTerm]);

//   // ── Fetch companies on mount ──
//   useEffect(() => {
//     axios.get(`${API_BASE_URL}/stocks/all`).then((res) => {
//       setCompanies(res.data);
//       if (res.data.length > 0) setSelected(res.data[0].symbol);
//     });
//   }, []);

//   // ── Fetch OHLC data for selected stock ──
//   useEffect(() => {
//     if (!selected) return;
//     axios.get(`${API_BASE_URL}/stocks/${selected}/ohlc`).then((res) => {
//       setOhlc(res.data || []);
//     });
//   }, [selected]);

//   // ── Sync chart with live ticks ──
//   const selectedTick = liveTick[selected];
//   useEffect(() => {
//     if (!selectedTick || ohlc.length === 0) return;

//     setOhlc((prev) => {
//       if (prev.length === 0) return prev;
//       const lastCandle = prev[prev.length - 1];

//       // Create a sequential timestamp so the chart draws a new distinct bar
//       const lastTime = new Date(lastCandle.date).getTime();
//       const nextTime = lastTime + 60000; // add 1 minute for visual separation

//       const newCandle = {
//         ...lastCandle,
//         date: new Date(nextTime).toISOString(),
//         open: selectedTick.price,
//         high: selectedTick.price,
//         low: selectedTick.price,
//         close: selectedTick.price,
//         volume: selectedTick.volume || Math.floor(Math.random() * 5000 + 1000),
//       };

//       return [...prev, newCandle];
//     });
//   }, [selectedTick, selected]);

//   // ── Build chart data scoped to selected timeframe ──
//   const { chartData, volumeData, rsiData, macdData } = useMemo(() => {
//     const isValid =
//       Array.isArray(ohlc) &&
//       ohlc.length > 0 &&
//       ohlc.every(
//         (d) =>
//           d &&
//           typeof d.open  === "number" &&
//           typeof d.high  === "number" &&
//           typeof d.low   === "number" &&
//           typeof d.close === "number" &&
//           d.date
//       );

//     if (!isValid) return { chartData: [], volumeData: [], rsiData: [], macdData: { macd: [], signal: [], histogram: [] } };

//     const sliced = ohlc.slice(-TIMEFRAMES[tfIndex].candles);

//     // Calculate a static time shift to make the last data point always end at the current moment
//     const latestTimestamp = sliced.length > 0 ? new Date(sliced[sliced.length - 1].date).getTime() : 0;
//     const timeOffset = latestTimestamp > 0 ? Date.now() - latestTimestamp : 0;

//     const cd = sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: [d.open, d.high, d.low, d.close] }));
//     const vd = sliced.map((d) => ({
//       x: new Date(d.date).getTime() + timeOffset,
//       y: d.volume || 0,
//       fillColor: d.close >= d.open ? "#26a69a55" : "#ef535055",
//     }));

//     const rd = sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.rsi || null }));
//     const md = {
//       macd: sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.macd || null })),
//       signal: sliced.map((d) => ({ x: new Date(d.date).getTime() + timeOffset, y: d.signal || null })),
//       histogram: sliced.map((d) => ({
//         x: new Date(d.date).getTime() + timeOffset,
//         y: d.histogram || 0,
//         color: (d.histogram || 0) >= 0 ? "#26a69a" : "#ef5350"
//       }))
//     };

//     return { chartData: cd, volumeData: vd, rsiData: rd, macdData: md };
//   }, [ohlc, tfIndex]);

//   // ── Moving averages ──
//   const ma20 = useMemo(() => showMA20 ? calcMA(chartData, Math.min(20, chartData.length)) : [], [chartData, showMA20]);
//   const ma50 = useMemo(() => showMA50 ? calcMA(chartData, Math.min(50, chartData.length)) : [], [chartData, showMA50]);

//   const labelColors = theme === "light" ? "#64748b" : "#94a3b8";
//   const gridColor   = theme === "light" ? "#f1f5f9" : "#1e293b";

//   const commonOptions = {
//     chart: { 
//       toolbar: { show: false }, 
//       background: "transparent", 
//       animations: { enabled: false },
//       sync: { enabled: true, group: "equity-charts" }
//     },
//     xaxis: {
//       type: "datetime",
//       labels: { show: false },
//       axisBorder: { show: false },
//       axisTicks: { show: false },
//       tooltip: { enabled: false }
//     },
//     yaxis: {
//       opposite: true,
//       labels: { style: { colors: labelColors, fontSize: "0.7rem" } }
//     },
//     grid: { borderColor: gridColor, strokeDashArray: 3 },
//     tooltip: { theme: theme }
//   };

//   const candleOptions = {
//     ...commonOptions,
//     chart: { ...commonOptions.chart, type: "candlestick", id: "candle-main" },
//     xaxis: { 
//       ...commonOptions.xaxis, 
//       labels: { 
//         show: true, 
//         formatter: function(val) {
//           if (!val) return "";
//           return new Date(val).toLocaleString("en-IN", {
//             month: "short", day: "2-digit",
//             hour: "2-digit", minute: "2-digit"
//           });
//         },
//         style: { colors: labelColors, fontSize: "0.7rem" } 
//       }, 
//       tickAmount: 6 
//     },
//     yaxis: { 
//       ...commonOptions.yaxis, 
//       labels: { ...commonOptions.yaxis.labels, formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}` } 
//     },
//     plotOptions: {
//       candlestick: { colors: { upward: "#26a69a", downward: "#ef5350" }, wick: { useFillColor: true } }
//     }
//   };

//   const volumeOptions = {
//     ...commonOptions,
//     chart: { ...commonOptions.chart, type: "bar", id: "vol-chart" },
//     yaxis: { ...commonOptions.yaxis, labels: { ...commonOptions.yaxis.labels, formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v } }
//   };

//   const rsiOptions = {
//     ...commonOptions,
//     chart: { ...commonOptions.chart, type: "line", id: "rsi-chart" },
//     yaxis: { min: 0, max: 100, tickAmount: 2, labels: { show: true, style: { colors: labelColors } } },
//     annotations: {
//       position: 'back',
//       yaxis: [
//         { y: 70, borderColor: '#ef5350', label: { text: 'Overbought', style: { color: '#ef5350', background: 'transparent' } } },
//         { y: 30, borderColor: '#26a69a', label: { text: 'Oversold', style: { color: '#26a69a', background: 'transparent' } } }
//       ]
//     },
//     stroke: { width: 2, colors: ["#8b5cf6"] }
//   };

//   const macdOptions = {
//     ...commonOptions,
//     chart: { ...commonOptions.chart, type: "line", id: "macd-chart" },
//     stroke: { width: [2, 2], curve: 'smooth' },
//     colors: ["#2196f3", "#ff9800"], // MACD (Blue), Signal (Orange)
//     plotOptions: { bar: { columnWidth: '80%' } }
//   };

//   const maLineSeries = [
//     ...(showMA20 && ma20.length > 0 ? [{ name: "MA20", data: ma20, color: "#f59e0b", type: "line" }] : []),
//     ...(showMA50 && ma50.length > 0 ? [{ name: "MA50", data: ma50, color: "#8b5cf6", type: "line" }] : []),
//   ];

//   const selectedCompany = companies.find(c => c.symbol === selected);

//   return (
//     <div style={{ padding: "0 24px 24px" }}>
//       {/* ── Page header ── */}
//       <div className="charts-page-header">
//         <div>
//           <h2 className="charts-title">Charts</h2>
//           <p className="charts-sub">Professional Technical Analysis</p>
//         </div>
//         {selected && (
//           <LivePriceBadge symbol={selected} liveTick={liveTick} />
//         )}
//       </div>

//       {/* ── Stock selection bar (Search + Ticker) ── */}
//       <div className="stock-selection-bar mb-4">
//         <div className="search-box">
//           <Search className="search-icon-mui" />
//           <input 
//             type="text" 
//             placeholder="Search stocks (eg: infy, bse...)" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//         <div className="ticker-items">
//           {filteredCompanies.map((c) => (
//             <button
//               key={c.symbol}
//               onClick={() => setSelected(c.symbol)}
//               className={`ticker-btn ${selected === c.symbol ? "active" : ""}`}
//             >
//               <span className="ticker-sym">{c.symbol}</span>
//             </button>
//           ))}
//           {filteredCompanies.length === 0 && (
//             <div className="no-results">No stocks found</div>
//           )}
//         </div>
//       </div>

//       {/* ── Chart controls toolbar ── */}
//       <div className="chart-toolbar">
//         <div className="tf-group">
//           {TIMEFRAMES.map((tf, i) => (
//             <button key={tf.label} className={`tf-btn ${tfIndex === i ? "tf-active" : ""}`} onClick={() => setTfIndex(i)}>{tf.label}</button>
//           ))}
//         </div>

//         <div className="overlay-group">
//           <button className={`overlay-btn ${showMA20 ? "overlay-active-gold" : ""}`} onClick={() => setShowMA20(v => !v)}>MA 20</button>
//           <button className={`overlay-btn ${showMA50 ? "overlay-active-purple" : ""}`} onClick={() => setShowMA50(v => !v)}>MA 50</button>
//           <button className={`overlay-btn ${showVolume ? "overlay-active-blue" : ""}`} onClick={() => setShowVolume(v => !v)}>Volume</button>
//           <button className={`overlay-btn ${showRSI ? "overlay-active-purple" : ""}`} onClick={() => setShowRSI(v => !v)}>RSI</button>
//           <button className={`overlay-btn ${showMACD ? "overlay-active-gold" : ""}`} onClick={() => setShowMACD(v => !v)}>MACD</button>
//         </div>

//         <div className="chart-company-info">
//           {selectedCompany && (
//             <>
//               <span className="company-name-chip">{selectedCompany.name}</span>
//               <span className="sector-chip">{selectedCompany.sector}</span>
//             </>
//           )}
//         </div>
//       </div>

//       <StatsRow ohlc={ohlc.slice(-TIMEFRAMES[tfIndex].candles)} company={selectedCompany} />

//       {/* ── Main chart area ── */}
//       <div className="chart-main-card">
//         {chartData.length > 0 ? (
//           <>
//             <Chart
//               options={candleOptions}
//               series={[{ name: "OHLC", data: chartData, type: "candlestick" }, ...maLineSeries]}
//               type="candlestick"
//               height={350}
//             />

//             {showVolume && (
//               <div className="sub-chart-container">
//                 <Chart options={volumeOptions} series={[{ name: "Volume", data: volumeData }]} type="bar" height={100} />
//               </div>
//             )}

//             {showRSI && (
//               <div className="sub-chart-container">
//                 <div className="sub-chart-label">RSI (14)</div>
//                 <Chart options={rsiOptions} series={[{ name: "RSI", data: rsiData }]} type="line" height={100} />
//               </div>
//             )}

//             {showMACD && (
//               <div className="sub-chart-container">
//                 <div className="sub-chart-label">MACD (12, 26, 9)</div>
//                 <Chart 
//                   options={macdOptions} 
//                   series={[
//                     { name: "Histogram", type: "bar", data: macdData.histogram },
//                     { name: "MACD", type: "line", data: macdData.macd },
//                     { name: "Signal", type: "line", data: macdData.signal }
//                   ]} 
//                   height={150} 
//                 />
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="chart-loading"><div className="chart-spinner"></div><p>Loading chart data…</p></div>
//         )}
//       </div>

//       {/* ── Market Heatmap ── */}
//       <div className="market-heatmap">
//         <h3 className="heatmap-title">Market Overview</h3>
//         <div className="heatmap-grid">
//           {companies.map((c) => {
//             const t = liveTick?.[c.symbol];
//             const isUp = t?.isUp ?? true;
//             const pct = t?.changePct ?? "0.00";
//             const intensity = Math.min(Math.abs(parseFloat(pct)), 5) / 5;
//             const bg = isUp ? `rgba(38, 166, 154, ${0.1 + intensity * 0.5})` : `rgba(239, 83, 80, ${0.1 + intensity * 0.5})`;
//             return (
//               <div key={c.symbol} className={`heatmap-cell ${selected === c.symbol ? "heatmap-selected" : ""}`} style={{ background: bg }} onClick={() => setSelected(c.symbol)}>
//                 <span className="heatmap-sym">{c.symbol}</span>
//                 <span className="heatmap-price">{t ? `₹${Number(t.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}</span>
//                 <span className="heatmap-pct" style={{ color: isUp ? "#26a69a" : "#ef5350" }}>{isUp ? "+" : ""}{pct}%</span>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CandlestickCharts;



import React, { useEffect, useState, useRef, useMemo } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks.js";
import { Search } from "@mui/icons-material";
import { EMA, BollingerBands, VWAP, ATR, bullishengulfingpattern, bearishengulfingpattern, abandonedbaby, darkcloudcover, downsidetasukigap, doji, morningdojistar, morningstar, threewhitesoldiers } from "technicalindicators";
import "./CandleChartIntraday.css";
import "./ChartsEnhanced.css";

// ─── Pattern Recognition Helper ──────────────────────────────────
function detectCandlestickPatterns(ohlc) {
  if (!ohlc || ohlc.length < 5) return [];
  
  const input = {
    open: ohlc.map(d => d.open),
    high: ohlc.map(d => d.high),
    low: ohlc.map(d => d.low),
    close: ohlc.map(d => d.close),
  };

  const patterns = [];
  
  // Bullish patterns
  const bullishEngulfing = bullishengulfingpattern(input);
  const morningStar = morningstar(input);
  const morningDojiStar = morningdojistar(input);
  const threeWhiteSoldiers = threewhitesoldiers(input);
  
  // Bearish patterns
  const bearishEngulfing = bearishengulfingpattern(input);
  const darkCloudCover = darkcloudcover(input);
  
  // Neutral/Reversal
  const dojiPattern = doji(input);
  const abandonedBaby = abandonedbaby(input);

  // Map boolean results back to indices
  for (let i = 0; i < ohlc.length; i++) {
    const d = ohlc[i];
    let matchedPattern = null;
    let color = "#26a69a"; // default bullish
    
    if (bullishEngulfing[i]) { matchedPattern = "Bullish Engulfing"; }
    else if (morningStar[i]) { matchedPattern = "Morning Star"; }
    else if (morningDojiStar[i]) { matchedPattern = "Morning Doji Star"; }
    else if (threeWhiteSoldiers[i]) { matchedPattern = "3 White Soldiers"; }
    else if (bearishEngulfing[i]) { matchedPattern = "Bearish Engulfing"; color = "#ef5350"; }
    else if (darkCloudCover[i]) { matchedPattern = "Dark Cloud Cover"; color = "#ef5350"; }
    else if (abandonedBaby[i]) { matchedPattern = "Abandoned Baby"; color = "#f59e0b"; }
    // Doji represents indecision, we'll mark it distinctively
    else if (dojiPattern[i]) { matchedPattern = "Doji"; color = "#8b5cf6"; }
    
    if (matchedPattern) {
      patterns.push({
        x: new Date(d.date).getTime(),
        y: d.high,
        pattern: matchedPattern,
        color: color
      });
    }
  }
  
  return patterns;
}

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
  const [showEMA20, setShowEMA20]       = useState(false);
  const [showBB, setShowBB]             = useState(false);
  const [showVWAP, setShowVWAP]         = useState(false);
  const [showATR, setShowATR]           = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);
  const [showVolume, setShowVolume]     = useState(true);
  const [showRSI, setShowRSI]           = useState(false);
  const [showMACD, setShowMACD]         = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");

  const [compareStock, setCompareStock] = useState("");
  const [compareData, setCompareData]   = useState([]);

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
    axios.get(`${API_BASE_URL}/stocks/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then((res) => {
      setCompanies(res.data);
      if (res.data.length > 0) setSelected(res.data[0].symbol);
    }).catch(err => console.error(err));
  }, []);

  // ── Fetch OHLC data for selected stock ──
  useEffect(() => {
    if (!selected) return;
    axios.get(`${API_BASE_URL}/stocks/${selected}/ohlc`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then((res) => {
      setOhlc(res.data || []);
    }).catch(err => console.error(err));
  }, [selected]);

  // ── Fetch OHLC data for compared stock ──
  useEffect(() => {
    if (!compareStock) {
      setCompareData([]);
      return;
    }
    axios.get(`${API_BASE_URL}/stocks/${compareStock}/ohlc`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then((res) => {
      setCompareData(res.data || []);
    }).catch(err => console.error(err));
  }, [compareStock]);

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
  const { chartData, volumeData, rsiData, macdData, indicators, patternMarkers, compareSeries } = useMemo(() => {
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

    if (!isValid) return { chartData: [], volumeData: [], rsiData: [], macdData: { macd: [], signal: [], histogram: [] }, indicators: {}, patternMarkers: [], compareSeries: [] };

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

    const closePrices = sliced.map(d => d.close);
    const highPrices = sliced.map(d => d.high);
    const lowPrices = sliced.map(d => d.low);
    const volumes = sliced.map(d => d.volume || 0);

    // EMA
    let ema20 = [];
    if (showEMA20) {
      const e = EMA.calculate({ period: 20, values: closePrices });
      const diff = sliced.length - e.length;
      ema20 = e.map((val, i) => ({ x: new Date(sliced[i + diff].date).getTime() + timeOffset, y: val }));
    }

    // Bollinger Bands
    let bb = { upper: [], middle: [], lower: [] };
    if (showBB) {
      const b = BollingerBands.calculate({ period: 20, stdDev: 2, values: closePrices });
      const diff = sliced.length - b.length;
      b.forEach((val, i) => {
        const time = new Date(sliced[i + diff].date).getTime() + timeOffset;
        bb.upper.push({ x: time, y: val.upper });
        bb.middle.push({ x: time, y: val.middle });
        bb.lower.push({ x: time, y: val.lower });
      });
    }

    // VWAP
    let vwap = [];
    if (showVWAP) {
      const v = VWAP.calculate({ high: highPrices, low: lowPrices, close: closePrices, volume: volumes });
      const diff = sliced.length - v.length;
      vwap = v.map((val, i) => ({ x: new Date(sliced[i + diff].date).getTime() + timeOffset, y: val }));
    }

    // ATR
    let atr = [];
    if (showATR) {
      const a = ATR.calculate({ high: highPrices, low: lowPrices, close: closePrices, period: 14 });
      const diff = sliced.length - a.length;
      atr = a.map((val, i) => ({ x: new Date(sliced[i + diff].date).getTime() + timeOffset, y: val }));
    }

    // Pattern Recognition
    let patternMarkers = [];
    if (showPatterns) {
      const patterns = detectCandlestickPatterns(sliced);
      patternMarkers = patterns.map(p => ({
        x: p.x + timeOffset,
        y: p.y,
        marker: { size: 6, fillColor: p.color, strokeColor: "#fff", radius: 2 },
        label: {
          text: p.pattern,
          style: { background: p.color, color: "#fff", fontSize: "10px", padding: { left: 4, right: 4, top: 2, bottom: 2 } }
        }
      }));
    }

    // Compare Stock
    let compareSeries = [];
    if (compareStock && compareData.length > 0) {
      const limit = TIMEFRAMES[tfIndex].candles;
      const baseClose = sliced[0]?.close || 1;
      const compSliced = compareData.slice(-limit);
      const compBaseClose = compSliced[0]?.close || 1;
      
      compareSeries = compSliced.map((d, i) => {
         // Scale the comparison stock to the base stock's price range for visualization purposes
         // (since both are plotted on the same Y-axis scale)
         const pctChange = (d.close - compBaseClose) / compBaseClose;
         const scaledValue = baseClose * (1 + pctChange);
         return { x: new Date(d.date).getTime() + timeOffset, y: scaledValue };
      });
    }

    return { 
      chartData: cd, 
      volumeData: vd, 
      rsiData: rd, 
      macdData: md,
      indicators: { ema20, bb, vwap, atr },
      patternMarkers,
      compareSeries
    };
  }, [ohlc, tfIndex, showEMA20, showBB, showVWAP, showATR, showPatterns, compareStock, compareData]);

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

  const atrOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "line", id: "atr-chart" },
    stroke: { width: 2, colors: ["#26a69a"] },
    yaxis: { labels: { show: true, style: { colors: labelColors } } }
  };

  const maLineSeries = [
    ...(showMA20 && ma20.length > 0 ? [{ name: "MA20", data: ma20, color: "#f59e0b", type: "line" }] : []),
    ...(showMA50 && ma50.length > 0 ? [{ name: "MA50", data: ma50, color: "#8b5cf6", type: "line" }] : []),
    ...(showEMA20 && indicators.ema20.length > 0 ? [{ name: "EMA20", data: indicators.ema20, color: "#3b82f6", type: "line" }] : []),
    ...(showVWAP && indicators.vwap.length > 0 ? [{ name: "VWAP", data: indicators.vwap, color: "#10b981", type: "line", stroke: { dashArray: 4 } }] : []),
    ...(showBB && indicators.bb.upper.length > 0 ? [
      { name: "BB Upper", data: indicators.bb.upper, color: "#94a3b8", type: "line", stroke: { dashArray: 2 } },
      { name: "BB Lower", data: indicators.bb.lower, color: "#94a3b8", type: "line", stroke: { dashArray: 2 } },
      { name: "BB Middle", data: indicators.bb.middle, color: "#64748b", type: "line" }
    ] : []),
    ...(compareSeries.length > 0 ? [{ name: compareStock, data: compareSeries, color: "#ec4899", type: "line" }] : [])
  ];

  // Inject pattern markers into candlestick options
  const candleOptionsWithAnnotations = {
    ...candleOptions,
    annotations: {
      ...candleOptions.annotations,
      points: patternMarkers
    }
  };

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
          <button className={`overlay-btn ${showEMA20 ? "overlay-active-blue" : ""}`} onClick={() => setShowEMA20(v => !v)}>EMA 20</button>
          <button className={`overlay-btn ${showBB ? "overlay-active-gold" : ""}`} onClick={() => setShowBB(v => !v)}>Bollinger Bands</button>
          <button className={`overlay-btn ${showVWAP ? "overlay-active-purple" : ""}`} onClick={() => setShowVWAP(v => !v)}>VWAP</button>
          <button className={`overlay-btn ${showVolume ? "overlay-active-blue" : ""}`} onClick={() => setShowVolume(v => !v)}>Volume</button>
          <button className={`overlay-btn ${showRSI ? "overlay-active-purple" : ""}`} onClick={() => setShowRSI(v => !v)}>RSI</button>
          <button className={`overlay-btn ${showMACD ? "overlay-active-gold" : ""}`} onClick={() => setShowMACD(v => !v)}>MACD</button>
          <button className={`overlay-btn ${showATR ? "overlay-active-blue" : ""}`} onClick={() => setShowATR(v => !v)}>ATR</button>
          <button className={`overlay-btn ${showPatterns ? "overlay-active-gold" : ""}`} onClick={() => setShowPatterns(v => !v)}>Patterns</button>
        </div>

        <div className="chart-company-info" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {selectedCompany && (
            <>
              <span className="company-name-chip">{selectedCompany.name}</span>
              <span className="sector-chip">{selectedCompany.sector}</span>
            </>
          )}
          {/* Compare feature Dropdown/Select */}
          <div className="compare-select" style={{ marginLeft: '10px' }}>
            <select 
              value={compareStock} 
              onChange={(e) => setCompareStock(e.target.value)}
              className="chart-compare-dropdown"
              style={{
                 background: theme === 'light' ? '#f1f5f9' : '#1e293b',
                 color: theme === 'light' ? '#0f172a' : '#f8fafc',
                 border: '1px solid',
                 borderColor: theme === 'light' ? '#cbd5e1' : '#334155',
                 padding: '4px 8px',
                 borderRadius: '4px',
                 fontSize: '12px'
              }}
            >
              <option value="">+ Compare</option>
              {companies.filter(c => c.symbol !== selected).map(c => (
                <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <StatsRow ohlc={ohlc.slice(-TIMEFRAMES[tfIndex].candles)} company={selectedCompany} />

      {/* ── Main chart area ── */}
      <div className="chart-main-card">
        {chartData.length > 0 ? (
          <>
            <Chart
              options={candleOptionsWithAnnotations}
              series={[{ name: "OHLC", data: chartData, type: "candlestick" }, ...maLineSeries]}
              type="candlestick"
              height={400} // Increased height slightly to accommodate overlays
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

            {showATR && (
              <div className="sub-chart-container">
                <div className="sub-chart-label">ATR (14)</div>
                <Chart 
                  options={atrOptions} 
                  series={[{ name: "ATR", type: "line", data: indicators.atr }]} 
                  height={100} 
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