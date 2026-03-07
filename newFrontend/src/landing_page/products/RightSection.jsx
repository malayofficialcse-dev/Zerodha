import React from "react";

function RightSection({ imageURL, productName, productDesription, learnMore }) {
  return (
    <div className="container py-5">
      <div className="row align-items-center flex-column-reverse flex-lg-row">
        {/* Text Section */}
        <div className="col-lg-6 mt-4 mt-lg-0">
          <h2 className="fw-bold mb-3">{productName}</h2>
          <p className="text-muted">{productDesription}</p>
          <div className="mt-3">
            <a
              href={learnMore}
              className="text-decoration-none text-primary fw-medium"
            >
              Learn More <i className="fa fa-long-arrow-right ms-1" />
            </a>
          </div>
        </div>

        {/* Image Section */}
        <div className="col-lg-6 text-center">
          <img
            src={imageURL}
            alt={productName}
            className="img-fluid"
            style={{ maxHeight: "400px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default RightSection;
