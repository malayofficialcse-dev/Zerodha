import React from "react";

const Summary = () => {
  return (
    <div className="summary-container">
      <div className="username">
        <h6>Hi, Shubhankar !</h6>
        <div className="divider"></div>
      </div>

      <h3 className="title">Dashboard</h3>

      <div className="stats-row">
        <div className="stat-card">
          <p className="label">Equity Margin</p>
          <h5>3.54k</h5>
        </div>
        <div className="stat-card">
          <p className="label">Used Margin</p>
          <h5>0.00</h5>
        </div>
        <div className="stat-card">
          <p className="label">Available Cash</p>
          <h5>3.54k</h5>
        </div>
      </div>

      <div className="divider"></div>

      <div className="stats-row">
        <div className="stat-card" style={{ flex: '2' }}>
           <p className="label">Market Sentiment</p>
           <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '16px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #ef4444, #22c55e)' }}></div>
           </div>
           <div className="d-flex justify-content-between mt-2">
             <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>BEARISH</span>
             <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '600' }}>BULLISH</span>
           </div>
        </div>
        <div className="stat-card">
          <p className="label">Volatility (VIX)</p>
          <h5 className="loss">15.42 (+2.1%)</h5>
        </div>
      </div>
    </div>
  );
};

export default Summary;
