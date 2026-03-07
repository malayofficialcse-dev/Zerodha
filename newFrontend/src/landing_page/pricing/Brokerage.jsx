import React from "react";

function Brokerage() {
  return (
    <div className="container">
      <div className="row py-5 mt-5 border-top align-items-start flex-column flex-lg-row text-center text-lg-start">
        
        {/* Left Section: Brokerage Calculator */}
        <div className="col-lg-8 mb-4 mb-lg-0">
          <a href="#" className="text-decoration-none">
            <h3 className="fs-5 text-primary">Brokerage calculator</h3>
          </a>
          <ul className="text-muted small ps-3 pt-3">
            <li className="mb-2">
              Call & Trade and RMS auto-squareoff: Additional charges of ₹50 + GST per order.
            </li>
            <li className="mb-2">Digital contract notes will be sent via e-mail.</li>
            <li className="mb-2">
              Physical copies of contract notes, if required, shall be charged ₹20 per contract note. Courier charges apply.
            </li>
            <li className="mb-2">
              For NRI account (non-PIS): 0.5% or ₹100 per executed order for equity (whichever is lower).
            </li>
            <li className="mb-2">
              For NRI account (PIS): 0.5% or ₹200 per executed order for equity (whichever is lower).
            </li>
            <li className="mb-2">
              If the account is in debit balance, any order placed will be charged ₹40 per executed order instead of ₹20.
            </li>
          </ul>
        </div>

        {/* Right Section: List of Charges */}
        <div className="col-lg-4">
          <a href="#" className="text-decoration-none">
            <h3 className="fs-5 text-primary">List of charges</h3>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Brokerage;
