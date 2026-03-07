import React from "react";

function Team() {
  return (
    <div className="container my-5">
      {/* Header */}
      <div className="row border-top pt-5">
        <div className="col text-center">
          <h1 className="fw-bold">People</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="row align-items-center text-muted fs-6 pt-4">
        {/* Image Section */}
        <div className="col-12 col-md-6 text-center mb-4 mb-md-0">
          <img
            src="media/images/nithinKamath.jpg"
            alt="Nithin Kamath"
            className="img-fluid rounded-circle"
            style={{ maxWidth: "250px", height: "auto" }}
          />
          <h4 className="mt-4 mb-1 fw-semibold">Nithin Kamath</h4>
          <h6 className="text-secondary">Founder, CEO</h6>
        </div>

        {/* Bio Section */}
        <div className="col-12 col-md-6">
          <p>
            Nithin bootstrapped and founded Zerodha in 2010 to overcome the
            hurdles he faced during his decade-long stint as a trader. Today,
            Zerodha has changed the landscape of the Indian broking industry.
          </p>
          <p>
            He is a member of the SEBI Secondary Market Advisory Committee
            (SMAC) and the Market Data Advisory Committee (MDAC).
          </p>
          <p>Playing basketball is his zen.</p>
          <p>
            Connect on{" "}
            <a href="#" className="text-decoration-none text-primary">
              Homepage
            </a>{" "}
            /{" "}
            <a href="#" className="text-decoration-none text-primary">
              TradingQnA
            </a>{" "}
            /{" "}
            <a href="#" className="text-decoration-none text-primary">
              Twitter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Team;
