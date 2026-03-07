import React from "react";

export default function Stats() {
  return (
    <div className="container py-5 my-5">
      <div className="row flex-column flex-lg-row align-items-center">
        <div className="col-lg-6 px-4">
          <h2 className="fw-bold mb-5" style={{ color: "var(--text-color)" }}>Trust with confidence</h2>

          <div className="mb-5">
            <h4 className="fw-semibold h5 mb-3">Customer-first always</h4>
            <p className="text-muted" style={{ lineHeight: '1.7' }}>
              That's why 1.6+ crore customers trust Zerodha with ~ ₹6 lakh
              crores of equity investments and contribute to 15% of daily retail
              exchange volumes in India.
            </p>
          </div>

          <div className="mb-5">
            <h4 className="fw-semibold h5 mb-3">No spam or gimmicks</h4>
            <p className="text-muted" style={{ lineHeight: '1.7' }}>
              No gimmicks, spam, "gamification", or annoying push notifications.
              High-quality apps that you use at your pace, the way you like. 
            </p>
          </div>

          <div className="mb-5">
            <h4 className="fw-semibold h5 mb-3">The Zerodha universe</h4>
            <p className="text-muted" style={{ lineHeight: '1.7' }}>
              Not just an app, but a whole ecosystem. Our investments in 30+
              fintech startups offer you tailored services specific to your
              needs.
            </p>
          </div>
        </div>

        <div className="col-lg-6 px-4 text-center">
          <img
            src="media/images/ecosystem.png"
            alt="Ecosystem"
            className="img-fluid mb-5 shadow-sm"
            style={{ maxWidth: "85%", borderRadius: 'var(--radius)' }}
          />
          <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
            <a href="#!" className="text-decoration-none fw-bold" style={{ color: "var(--brand-primary)" }}>
              Explore our products <i className="fa fa-long-arrow-right ms-1"></i>
            </a>
            <a href="#!" className="text-decoration-none fw-bold" style={{ color: "var(--brand-primary)" }}>
              Try Kite demo <i className="fa fa-long-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
