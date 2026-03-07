import React from "react";

export default function OpenAccount() {
  return (
    <div className="container py-5 my-5">
      <div className="row text-center px-4">
        <div className="col-12 px-auto">
          <h1 className="fw-bold mb-4" style={{ color: "var(--text-color)" }}>Open a Zerodha Account</h1>
          <p className="text-muted lead mb-5 mx-auto" style={{ maxWidth: "600px" }}>
            Modern platforms and apps, ₹0 investments, and flat ₹20 intraday and
            F&O trades.
          </p>
          <button className="btn btn-primary btn-lg px-5 shadow-sm">
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
}
