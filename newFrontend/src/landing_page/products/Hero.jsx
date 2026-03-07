import React from "react";

function Hero() {
  return (
    <div className="container border-bottom mb-5">
      <div className="text-center mt-5 p-4">
        <h1 className="fw-bold">Technology</h1>
        <h3 className="text-muted mt-3 fs-4">
          Sleek, modern and intuitive trading platforms
        </h3>
        <video
          src="/videos/new3.mp4"
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
        <p className="mt-4 mb-4 fs-6 text-muted">
          Check out our{" "}
          <a href="#" className="text-decoration-none text-primary fw-medium">
            investment offerings{" "}
            <i className="fa fa-long-arrow-right ms-1" aria-hidden="true"></i>
          </a>
        </p>
      </div>
    </div>
  );
}

export default Hero;
