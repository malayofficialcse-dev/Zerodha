import React from "react";

function Hero() {
  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="row justify-content-center text-center border-bottom pb-5 mb-5">
        <div className="col-12">
          <h1 className="fw-bold mb-4">Pricing</h1>
          <video
            src="/videos/new2.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            className="w-100 rounded shadow-sm"
            style={{
              maxHeight: "400px",
              objectFit: "cover",
            }}
          />
          <h3 className="text-muted mt-4 fs-5">
            Free equity investments and flat ₹20 intraday and F&O trades
          </h3>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="row text-center g-4">
        <div className="col-12 col-md-4 px-4">
          <img
            src="media/images/pricingEquity.svg"
            alt="Equity"
            className="img-fluid mb-3"
            style={{ maxHeight: "80px" }}
          />
          <h2 className="fs-4 fw-semibold mb-2">Free equity delivery</h2>
          <p className="text-muted small">
            All equity delivery investments (NSE, BSE) are absolutely free — ₹0
            brokerage.
          </p>
        </div>

        <div className="col-12 col-md-4 px-4">
          <img
            src="media/images/intradayTrades.svg"
            alt="Intraday"
            className="img-fluid mb-3"
            style={{ maxHeight: "80px" }}
          />
          <h2 className="fs-4 fw-semibold mb-2">Intraday and F&O trades</h2>
          <p className="text-muted small">
            Flat ₹20 or 0.03% (whichever is lower) per executed order on
            intraday trades across equity, currency, and commodities.
          </p>
        </div>

        <div className="col-12 col-md-4 px-4">
          <img
            src="media/images/pricingEquity.svg"
            alt="Mutual Funds"
            className="img-fluid mb-3"
            style={{ maxHeight: "80px" }}
          />
          <h2 className="fs-4 fw-semibold mb-2">Free direct MF</h2>
          <p className="text-muted small">
            All direct mutual fund investments are absolutely free — ₹0
            commissions & DP charges.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
