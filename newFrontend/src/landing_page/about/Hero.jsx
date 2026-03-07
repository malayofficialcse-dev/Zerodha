import React from "react";

function Hero() {
  return (
    <div className="container my-5">
      {/* Headline */}
      <div className="row justify-content-center text-center mb-5 px-3">
        <div className="col-lg-10">
          <h1 className="fw-bold fs-2">
            We pioneered the discount broking model in India
            <br className="d-none d-md-block" />
            <span className="text-primary">
              {" "}
              Now, we are breaking ground with our technology.
            </span>
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div
        className="row border-top pt-5 px-3 text-muted fs-6"
        style={{ lineHeight: "1.8" }}
      >
        <div className="col-12 col-md-6 mb-4 mb-md-0 px-md-4">
          <p>
            We kick-started operations on the 15th of August, 2010 with the goal
            of breaking all barriers that traders and investors face in India in
            terms of cost, support, and technology. We named the company{" "}
            <strong>Zerodha</strong>, a combination of "Zero" and <em>Rodha</em>
            , the Sanskrit word for barrier.
          </p>
          <p>
            Today, our disruptive pricing models and in-house technology have
            made us the biggest stock broker in India.
          </p>
          <p>
            Over <strong>1+ Crore clients</strong> place millions of orders
            every day through our powerful ecosystem of investment platforms,
            contributing over <strong>15%</strong> of all Indian retail trading
            volumes.
          </p>
        </div>

        <div className="col-12 col-md-6 px-md-4">
          <p>
            In addition, we run a number of popular open online educational and
            community initiatives to empower retail traders and investors.
          </p>
          <p>
            <a href="#!" className="text-decoration-none text-primary fw-medium">
              Rainmatter
            </a>
            , our fintech fund and incubator, has invested in several fintech
            startups with the goal of growing the Indian capital markets.
          </p>
          <p>
            And yet, we are always up to something new every day. Catch up on
            the latest updates on our{" "}
            <a href="#!" className="text-decoration-none text-primary fw-medium">
              blog
            </a>{" "}
            or see what the{" "}
            <a href="#!" className="text-decoration-none text-primary fw-medium">
              media
            </a>{" "}
            is saying about us.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
