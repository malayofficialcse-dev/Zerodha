import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { API_BASE_URL } from "../config/config";
import { useRealTimeTicks } from "../hooks/useRealTimeTicks";
import "./MarketHeatmap.css";

const MarketHeatmap = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/stocks/all`)
      .then((res) => {
        setStocks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stocks for heatmap:", err);
        setLoading(false);
      });
  }, []);

  const symbols = useMemo(() => stocks.map((s) => s.symbol), [stocks]);
  
  // Seed initial prices for the real-time hook
  const seedPrices = useMemo(() => {
    const seed = {};
    stocks.forEach((s) => {
      const last = s.ohlc?.[s.ohlc.length - 1];
      const prev = s.ohlc?.[s.ohlc.length - 2] || last;
      seed[s.symbol] = {
        price: s.currentPrice,
        prevClose: prev?.close || s.currentPrice,
      };
    });
    return seed;
  }, [stocks]);

  const ticks = useRealTimeTicks(symbols, seedPrices);

  // Process data for Treemap
  const series = useMemo(() => {
    const sectorMap = {};

    stocks.forEach((s) => {
      const tick = ticks[s.symbol] || seedPrices[s.symbol] || { price: s.currentPrice, prevClose: s.currentPrice };
      const currentPrice = tick.price;
      const prevClose = tick.prevClose || s.currentPrice;
      const changePct = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
      
      // Parse market cap (e.g. "450.5T" -> 450.5)
      const mCap = parseFloat(s.marketCap) || 10;

      if (!sectorMap[s.sector]) {
        sectorMap[s.sector] = [];
      }

      sectorMap[s.sector].push({
        x: s.symbol,
        y: mCap, // Size based on Market Cap
        metadata: {
          name: s.name,
          change: changePct.toFixed(2),
          price: currentPrice.toFixed(2),
        }
      });
    });

    return Object.keys(sectorMap).map((sector) => ({
      name: sector,
      data: sectorMap[sector],
    }));
  }, [stocks, ticks, seedPrices]);

  const options = {
    legend: {
      show: false
    },
    chart: {
      height: 500,
      type: 'treemap',
      toolbar: {
        show: false
      },
      background: 'transparent',
    },
    theme: {
        mode: 'dark'
    },
    title: {
      text: 'Market Heatmap (Sector-wise)',
      align: 'left',
      style: {
        fontSize: '18px',
        color: 'var(--text-main)',
        fontWeight: '600'
      }
    },
    colors: [
      function({ value, seriesIndex, dataPointIndex, w }) {
        const series = w.config.series;
        if (!series || !series[seriesIndex] || !series[seriesIndex].data || !series[seriesIndex].data[dataPointIndex]) {
          return '#4b5563'; // Fallback to grey
        }
        const data = series[seriesIndex].data[dataPointIndex];
        const change = parseFloat(data.metadata?.change || 0);
        
        if (change >= 2) return '#10b981'; // Bright Green
        if (change > 0.5) return '#059669'; // Mid Green
        if (change >= -0.5 && change <= 0.5) return '#4b5563'; // Grey
        if (change < -2) return '#ef4444'; // Bright Red
        return '#dc2626'; // Mid Red
      }
    ],
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false
      }
    },
    tooltip: {
      theme: 'dark',
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const configSeries = w.config.series;
        if (!configSeries || !configSeries[seriesIndex] || !configSeries[seriesIndex].data || !configSeries[seriesIndex].data[dataPointIndex]) {
          return '';
        }
        const data = configSeries[seriesIndex].data[dataPointIndex];
        const change = data.metadata?.change || '0.00';
        const isUp = parseFloat(change) >= 0;
        return `
          <div class="heatmap-tooltip">
            <div class="header">${data.metadata?.name || data.x} (${data.x})</div>
            <div class="price">₹${data.metadata?.price || '0.00'}</div>
            <div class="change ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${change}%</div>
            <div class="sector">${configSeries[seriesIndex].name}</div>
          </div>
        `;
      }
    },
    dataLabels: {
        enabled: true,
        style: {
            fontSize: '12px',
            fontWeight: 'bold'
        },
        formatter: function(text, op) {
            const data = op.w.config.series[op.seriesIndex]?.data[op.dataPointIndex];
            const change = data?.metadata?.change || '0.00';
            return [text, `${change}%`];
        },
        offsetY: -4
    }
  };

  if (loading) {
    return <div className="heatmap-loading">Generating Heatmap...</div>;
  }

  return (
    <div className="heatmap-container">
        <div className="heatmap-header">
            <h1>Market Overview</h1>
            <p>Size represents Market Cap | Color represents Daily % Change</p>
        </div>
      <div className="heatmap-wrapper">
        <Chart options={options} series={series} type="treemap" height="600" />
      </div>
      <div className="heatmap-legend">
          <div className="legend-item"><span className="box strong-up"></span> &gt;2%</div>
          <div className="legend-item"><span className="box up"></span> 0.5% to 2%</div>
          <div className="legend-item"><span className="box neutral"></span> -0.5% to 0.5%</div>
          <div className="legend-item"><span className="box down"></span> -2% to -0.5%</div>
          <div className="legend-item"><span className="box strong-down"></span> &lt;-2%</div>
      </div>
    </div>
  );
};

export default MarketHeatmap;
