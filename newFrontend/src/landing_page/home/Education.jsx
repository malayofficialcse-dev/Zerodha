import React from "react";

export default function Education() {
  return (
    <div className="container py-5">
      <div className="row align-items-center flex-column-reverse flex-lg-row">
        {/* Text Section */}
        <div className="col-lg-6 mt-4 mt-lg-0">
          <h2 className="fw-bold mb-3">Free and open market education</h2>
          <p className="text-muted">
            Varsity, the largest online stock market education book in the world
            covering everything from the basics to advanced trading.
          </p>
          <a
            href="#"
            className="text-decoration-none d-inline-block mb-4 fw-medium text-primary"
          >
            Varsity{" "}
            <i className="fa fa-long-arrow-right ms-1" aria-hidden="true"></i>
          </a>

          <p className="text-muted mt-4">
            TradingQ&A, the most active trading and investment community in
            India for all your market related queries.
          </p>
          <a
            href="#"
            className="text-decoration-none d-inline-block fw-medium text-primary"
          >
            TradingQ&A{" "}
            <i className="fa fa-long-arrow-right ms-1" aria-hidden="true"></i>
          </a>
        </div>

        {/* Image Section */}
        <div className="col-lg-6 text-center">
          <img
            src="media/images/education.svg"
            alt="Education Illustration"
            className="img-fluid"
            style={{ maxHeight: "350px" }}
          />
        </div>
      </div>
    </div>
  );
}
