import React from "react";

export default function Pricing() {
  return (
    <div className="container py-5">
      <div className="row flex-column-reverse flex-lg-row align-items-center">
        {/* Left Text Section */}
        <div className="col-lg-6 mt-4 mt-lg-0">
          <h2 className="fw-bold mb-3">Unbeatable pricing</h2>
          <p className="text-muted mb-4">
            We pioneered the concept of discount broking and price transparency
            in India. Flat fees and no hidden charges.
          </p>
          <a href="#" className="text-decoration-none fw-medium text-primary">
            See Pricing{" "}
            <i className="fa fa-long-arrow-right ms-1" aria-hidden="true"></i>
          </a>
        </div>

        {/* Right Pricing Cards */}
        <div className="col-lg-6 mb-5 mb-lg-0">
          <div className="row g-3 text-center">
            <div className="col-6">
              <div className="border rounded p-4 h-100 shadow-sm">
                <h2 className="mb-3 text-success">
                  <i className="fa-solid fa-indian-rupee-sign me-1"></i>0
                </h2>
                <p className="text-muted mb-0">
                  Free equity delivery <br /> & direct mutual funds
                </p>
              </div>
            </div>

            <div className="col-6">
              <div className="border rounded p-4 h-100 shadow-sm">
                <h2 className="mb-3 text-primary">
                  <i className="fa-solid fa-indian-rupee-sign me-1"></i>20
                </h2>
                <p className="text-muted mb-0">
                  Intraday & <br /> F&O trading
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
