import React from "react";

function Universe() {
  const platforms = [
    {
      name: "smallcase",
      description: "Thematic investment platform",
      logo: "media/images/smallcaseLogo.png",
    },
    {
      name: "Sensibull",
      description: "Options trading simplified",
      logo: "media/images/sensibullLogo.png",
    },
    {
      name: "Tickertape",
      description: "Stock screener & market research",
      logo: "media/images/thicker.png",
    },
    {
      name: "GoldenPi",
      description: "Bonds & fixed income investments",
      logo: "media/images/goldenpiLogo.png",
    },
    {
      name: "Streak",
      description: "Algo trading without coding",
      logo: "media/images/streakLogo.png",
    },
    {
      name: "Refinitiv",
      description: "Professional charting and analysis tools",
      logo: "media/images/Refinitiv.png",
    },
  ];

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold">The Zerodha Universe</h1>
        <p className="text-muted">
          Extend your trading and investment experience with our curated partner
          platforms
        </p>
      </div>

      <div className="row g-4 justify-content-center">
        {platforms.map((platform, index) => (
          <div className="col-6 col-md-4 text-center" key={index}>
            <img
              src={platform.logo}
              alt={platform.name}
              className="img-fluid mb-3"
              style={{ maxHeight: "60px" }}
            />
            <h6 className="fw-semibold">{platform.name}</h6>
            <p className="text-muted small">{platform.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-5 mb-5">
        <button className="btn btn-primary px-4 py-2 fs-6 rounded-pill">
          Signup Now
        </button>
      </div>
    </div>
  );
}

export default Universe;
