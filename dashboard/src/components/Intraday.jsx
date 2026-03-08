import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import BuySellPopup from "./BuySellPopup";
import CandleChartIntraday from "./CandleChartIntraday";
import CompanyInsights from "./CompanyInsights";
import GeneralContext from "./GeneralContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./IntradayExtraStyles.css";

const Intraday = () => {
  const { selectedSymbol, isSidebarOpen } = useContext(GeneralContext);
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("BUY");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showInsights, setShowInsights] = useState(true);


  useEffect(() => {
    // Fetch user trades
    axios
      .get(`${API_BASE_URL}/intraday/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setTrades(res.data));
  }, [showPopup]);

  useEffect(() => {
    // Fetch specific stock info for insights
    if (selectedSymbol) {
      axios.get(`${API_BASE_URL}/stocks/all`).then((res) => {
        const stock = res.data.find(s => s.symbol === selectedSymbol);
        setStockInfo(stock);
      });
    }
  }, [selectedSymbol]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Intraday Trading</h2>
        <div className="d-flex align-items-center gap-3">
          {!showInsights && (
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowInsights(true)}
              style={{ borderRadius: 'var(--radius)' }}
            >
              Show Insights
            </button>
          )}
          <div className="badge bg-primary px-3 py-2" style={{ borderRadius: '4px' }}>
            Real-time Analysis Active
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className={`col-lg-${!isSidebarOpen ? '9' : (showInsights ? '8' : '12')}`}>
          <CandleChartIntraday symbol={selectedSymbol || "RELIANCE"} />
        </div>
        
        {/* Extra Features when Sidebar is closed */}
        {!isSidebarOpen && (
          <div className="col-lg-3">
            <div className="extra-features-panel">
               <div className="feature-card mb-3">
                  <h6>Market Sentiment</h6>
                  <div className="sentiment-bar">
                    <div className="bullish" style={{ width: '65%' }}></div>
                    <div className="bearish" style={{ width: '35%' }}></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.7rem' }}>
                    <span>BULLISH 65%</span>
                    <span>BEARISH 35%</span>
                  </div>
               </div>

               <div className="feature-card mb-3">
                  <h6>Market Depth</h6>
                  <div className="depth-table">
                    <div className="depth-row header"><span>Bid</span><span>Ask</span></div>
                    <div className="depth-row"><span>1034.50 (200)</span><span className="text-danger">1034.55 (150)</span></div>
                    <div className="depth-row"><span>1034.45 (450)</span><span className="text-danger">1034.60 (300)</span></div>
                    <div className="depth-row"><span>1034.40 (120)</span><span className="text-danger">1034.65 (80)</span></div>
                  </div>
               </div>

               <CompanyInsights stock={stockInfo} onClose={() => {}} compact={true} />
            </div>
          </div>
        )}

        {isSidebarOpen && showInsights && (
          <div className="col-lg-4">
            <CompanyInsights stock={stockInfo} onClose={() => setShowInsights(false)} />
          </div>
        )}
      </div>

      <div className="my-4 d-flex gap-3">
        <button
          className="btn btn-success"
          onClick={() => {
            setPopupType("BUY");
            setSelectedTrade(null);
            setShowPopup(true);
          }}
        >
          Buy
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            setPopupType("SELL");
            setSelectedTrade(null);
            setShowPopup(true);
          }}
        >
          Sell
        </button>
      </div>

      {showPopup && (
        <BuySellPopup
          type={popupType}
          onClose={() => setShowPopup(false)}
          trade={selectedTrade}
          symbol={selectedSymbol || "RELIANCE"}
        />
      )}

      <div className="table-responsive mt-4">
        <h3 className="mb-3">My Intraday Trades</h3>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Qty</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>P/L</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t._id}>
                <td>{t.symbol}</td>
                <td>{t.qty}</td>
                <td>₹{t.buyPrice}</td>
                <td>{t.sellPrice ? `₹${t.sellPrice}` : "-"}</td>
                <td
                  className={
                    t.profitOrLoss > 0
                      ? "text-success fw-bold"
                      : t.profitOrLoss < 0
                      ? "text-danger fw-bold"
                      : "text-muted"
                  }
                >
                  {t.profitOrLoss > 0
                    ? `+₹${t.profitOrLoss}`
                    : t.profitOrLoss < 0
                    ? `-₹${Math.abs(t.profitOrLoss)}`
                    : "₹0"}
                </td>
                <td
                  className={
                    t.status === "OPEN"
                      ? "text-success fw-semibold"
                      : "text-danger fw-semibold"
                  }
                >
                  {t.status}
                </td>
                <td>
                  {t.status === "OPEN" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setPopupType("SELL");
                        setSelectedTrade(t);
                        setShowPopup(true);
                      }}
                    >
                      Sell
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Intraday;
