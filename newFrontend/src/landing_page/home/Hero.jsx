import React from "react";

export default function Hero() {
  return (
    <div className="container py-5 mb-5 hero-section">
      <div className="row align-items-center text-center">
        <div className="col-12 mb-5">
          <div className="hero-video-wrapper">
            <video
              src="/videos/new1.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-100 hero-video"
              style={{
                maxHeight: "500px",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
        <div className="col-12 px-4">
          <h1 className="display-4 fw-bold mb-3" style={{ color: "var(--text-color)" }}>Invest in everything</h1>
          <p className="lead text-muted mb-5 mx-auto" style={{ maxWidth: "600px" }}>
            Online platform to invest in stocks, derivatives, mutual funds,
            ETFs, bonds, and more.
          </p>
          <button className="btn btn-primary btn-lg px-5 shadow-sm">
            Sign up for free
          </button>
        </div>
      </div>
    </div>
  );
}
