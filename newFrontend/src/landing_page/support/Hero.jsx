import React from "react";

function Hero() {
  return (
    <section className="container-fluid bg-light" id="supportHero">
      <div
        className="py-5 text-center bg-primary text-white"
        id="supportWrapper"
      >
        <h4 className="fw-bold mb-2">Support Portal</h4>
        <a href="#" className="text-white text-decoration-underline">
          Track Tickets
        </a>
      </div>

      <div className="row p-4 mx-3 gy-4">
        {/* Left Section */}
        <div className="col-12 col-md-6 p-3">
          <h1 className="fs-4 mb-3">
            Search for an answer or browse help topics to create a ticket
          </h1>
          <input
            className="form-control mb-3"
            type="text"
            placeholder="E.g., How do I activate F&O?"
          />
          <div className="d-flex flex-wrap gap-2">
            <a href="#" className="btn btn-outline-secondary btn-sm">
              Track account opening
            </a>
            <a href="#" className="btn btn-outline-secondary btn-sm">
              Track segment activation
            </a>
            <a href="#" className="btn btn-outline-secondary btn-sm">
              Intraday margins
            </a>
            <a href="#" className="btn btn-outline-secondary btn-sm">
              Kite user manual
            </a>
          </div>
        </div>

        {/* Right Section */}
        <div className="col-12 col-md-6 p-3">
          <h1 className="fs-4 mb-3">Featured</h1>
          <ol className="ps-3">
            <li className="mb-2">
              <a href="#" className="text-decoration-none text-dark">
                Current Takeovers and Delisting - January 2024
              </a>
            </li>
            <li>
              <a href="#" className="text-decoration-none text-dark">
                Latest Intraday leverages - MIS & CO
              </a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Hero;
