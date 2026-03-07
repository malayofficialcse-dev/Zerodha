import React from "react";

export default function Awards() {
  return (
    <div className="container py-5">
      <div className="row align-items-center flex-column-reverse flex-lg-row">
        {/* Text Section */}
        <div className="col-lg-6 mt-4 mt-lg-0">
          <h2 className="fw-bold mb-3">Largest stock broker in India</h2>
          <p className="text-muted mb-4">
            2+ million Zerodha clients contribute to over 15% of all the volumes
            in India daily by trading and investing in:
          </p>

          <div className="row">
            <div className="col-6">
              <ul className="list-unstyled mb-4">
                <li className="mb-2">✅ Futures and Options</li>
                <li className="mb-2">✅ Commodity derivatives</li>
                <li className="mb-2">✅ Currency derivatives</li>
              </ul>
            </div>
            <div className="col-6">
              <ul className="list-unstyled mb-4">
                <li className="mb-2">✅ Stocks & IPOs</li>
                <li className="mb-2">✅ Direct mutual funds</li>
                <li className="mb-2">✅ Bonds and Govt. Securities</li>
              </ul>
            </div>
          </div>

          <img
            src="media/images/pressLogos.png"
            alt="Press Logo"
            className="img-fluid mt-3"
            style={{ maxWidth: "90%" }}
          />
        </div>

        {/* Image Section */}
        <div className="col-lg-6 text-center">
          <img
            src="media/images/largestBroker.svg"
            alt="Largest Broker"
            className="img-fluid"
            style={{ maxHeight: "300px" }}
          />
        </div>
      </div>
    </div>
  );
}
