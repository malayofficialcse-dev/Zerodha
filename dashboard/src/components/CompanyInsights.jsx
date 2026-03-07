import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import "./CompanyInsights.css";

const CompanyInsights = ({ stock: initialStock, onClose }) => {
  const [stock, setStock] = useState(initialStock);
  const [marketDepth, setMarketDepth] = useState([]);
  const [bidPercentage, setBidPercentage] = useState(65);

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    if (!stock) return;

    // Simulate high-frequency polling for Market Depth and random metric shifts
    const interval = setInterval(() => {
      // 1. Generate randomized Market Depth
      const newDepth = [...Array(5)].map((_, i) => ({
        bidQty: (Math.random() * 5000 + 100).toFixed(0),
        offerQty: (Math.random() * 5000 + 100).toFixed(0),
        price: (stock.currentPrice - (i * 0.05 + Math.random() * 0.1)).toFixed(2),
      }));
      setMarketDepth(newDepth);

      // 2. Shift Bid/Ask percentage
      setBidPercentage(prev => {
        const shift = (Math.random() - 0.5) * 5;
        return Math.min(Math.max(prev + shift, 30), 90).toFixed(1);
      });

      // 3. Briefly nudge the current price for visual feedback if close to market depth
      setStock(prev => {
        if (!prev) return prev;
        const drift = (Math.random() - 0.5) * 0.5;
        return { ...prev, currentPrice: Number((prev.currentPrice + drift).toFixed(2)) };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [stock?.symbol, stock?.currentPrice]);

  if (!stock) {
    return (
      <div className="company-insights-panel empty">
        <p>Select a company to view insights</p>
      </div>
    );
  }

  const ratingColor = {
    BUY: "#00e676",
    HOLD: "#ff9800",
    SELL: "#ff5252",
  }[stock.analystRating || "HOLD"];

  const sparklineOptions = {
    chart: {
      type: "area",
      sparkline: { enabled: true },
      animations: { enabled: true, easing: "linear", dynamicAnimation: { speed: 800 } },
    },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: [stock.ohlc && stock.ohlc.length > 1 && stock.ohlc[stock.ohlc.length-1].close >= stock.ohlc[0].close ? "#00e676" : "#ff5252"],
    tooltip: { enabled: false },
  };

  const sparklineSeries = [
    {
      name: "Price",
      data: stock.ohlc ? stock.ohlc.map((h) => h.close) : [],
    },
  ];

  const currentPrice = stock.currentPrice || 0;
  const prevClose = stock.ohlc && stock.ohlc.length > 1 ? stock.ohlc[stock.ohlc.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevClose;
  const percentChange = ((priceChange / prevClose) * 100).toFixed(2);

  return (
    <div className="company-insights-panel">
      <div className="insights-header">
        <div>
          <h3>{stock.name}</h3>
          <span className="symbol-pill">{stock.symbol}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="rating-badge" style={{ backgroundColor: `${ratingColor}22`, color: ratingColor }}>
            {stock.analystRating}
          </span>
          {onClose && (
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
              title="Close Insights"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="price-overview">
        <div className="main-price">
          <h2>₹{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <span className={`change ${priceChange >= 0 ? "up" : "down"}`}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)} ({percentChange}%)
          </span>
        </div>
        <div className="sparkline-container">
          <Chart
            options={sparklineOptions}
            series={sparklineSeries}
            type="area"
            height={70}
          />
        </div>
      </div>

      <div className="description-section">
        <p>{stock.description || "Leading company in its sector, showing strong market resilience and performance."}</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <label>Market Cap</label>
          <span>{stock.marketCap}</span>
        </div>
        <div className="metric-card">
          <label>P/E Ratio</label>
          <span>{stock.peRatio}</span>
        </div>
        <div className="metric-card">
          <label>Volume</label>
          <span>{(Math.random() * 10).toFixed(1)}M</span>
        </div>
        <div className="metric-card">
          <label>Div. Yield</label>
          <span>{stock.dividendYield}%</span>
        </div>
      </div>

      <div className="range-section">
        <div className="range-labels">
          <div className="label-group">
            <label>52W Low</label>
            <span>₹{(stock.low52w || 0).toLocaleString()}</span>
          </div>
          <div className="label-group text-end">
            <label>52W High</label>
            <span>₹{(stock.high52w || 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="range-bar">
          <div 
            className="current-price-marker" 
            style={{ 
              left: `${Math.min(Math.max(((currentPrice - stock.low52w) / (stock.high52w - stock.low52w)) * 100, 0), 100)}%` 
            }}
          ></div>
        </div>
      </div>

      <div className="sentiment-section">
        <label>Live Sentiment Index</label>
        <div className="sentiment-bar-container">
          <div 
            className="sentiment-fill" 
            style={{ 
              width: stock.analystRating === "BUY" ? "85%" : stock.analystRating === "HOLD" ? "50%" : "20%",
              backgroundColor: ratingColor 
            }}
          ></div>
        </div>
        <div className="sentiment-labels">
          <span>Bearish</span>
          <span>Bullish</span>
        </div>
      </div>

      <div className="market-depth-section">
        <label>Market Depth (L2)</label>
        <div className="depth-header">
          <span>Bid Qty</span>
          <span>Price</span>
          <span>Offer Qty</span>
        </div>
        {marketDepth.length > 0 ? marketDepth.map((row, i) => (
          <div className="depth-row" key={i}>
            <span className="bid-qty">{row.bidQty}</span>
            <span className="price-center">₹{row.price}</span>
            <span className="offer-qty">{row.offerQty}</span>
          </div>
        )) : (
          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Initializing data...</p>
        )}
        <div className="depth-total">
          <span className="bid-total">{bidPercentage}%</span>
          <div className="bid-offer-bar">
            <div className="bid-fill" style={{ width: `${bidPercentage}%` }}></div>
          </div>
          <span className="offer-total">{(100 - bidPercentage).toFixed(1)}%</span>
        </div>
      </div>

      <div className="technical-summary">
        <label>Technical Summary (1D)</label>
        <div className="tech-indicators">
          <div className="tech-item">
            <span className="name">RSI (14)</span>
            <span className={`val ${stock.analystRating === "BUY" ? "up" : stock.analystRating === "SELL" ? "down" : ""}`}>
              {stock.analystRating === "BUY" ? "64.2" : stock.analystRating === "SELL" ? "28.4" : "45.1"}
            </span>
          </div>
          <div className="tech-item">
            <span className="name">MACD</span>
            <span className={`val ${stock.analystRating === "BUY" ? "up" : stock.analystRating === "SELL" ? "down" : ""}`}>
              {stock.analystRating === "BUY" ? "Bullish" : stock.analystRating === "SELL" ? "Bearish" : "Neutral"}
            </span>
          </div>
          <div className="tech-item">
            <span className="name">STOCH</span>
            <span className={`val ${stock.analystRating === "BUY" ? "up" : stock.analystRating === "SELL" ? "down" : ""}`}>
              {stock.analystRating === "BUY" ? "Oversold" : stock.analystRating === "SELL" ? "Overbought" : "Neutral"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInsights;
