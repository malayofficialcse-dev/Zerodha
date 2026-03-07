import React from "react";

function CreateTicket() {
  const categories = [
    {
      title: "Account Opening",
      topics: [
        "Online Account Opening",
        "Offline Account Opening",
        "Company, Partnership & HUF Accounts",
        "NRI Account Opening",
        "Charges & Fees",
        "Zerodha 3-in-1 Account",
      ],
    },
    {
      title: "KYC & Documentation",
      topics: [
        "PAN and Aadhaar Linking",
        "Document Verification",
        "Bank Proof Upload",
        "Nominee Addition",
        "KYC Revalidation",
        "Mobile/Email Update",
      ],
    },
    {
      title: "Trading & Orders",
      topics: [
        "Placing Buy/Sell Orders",
        "Intraday vs Delivery",
        "Bracket & Cover Orders",
        "Order Rejections",
        "After Market Orders",
        "MIS/CO Margins",
      ],
    },
    {
      title: "Funds & Withdrawals",
      topics: [
        "Adding Funds",
        "Withdrawals Timings",
        "UPI/IMPS/NEFT Transfers",
        "Fund Hold Issues",
        "Withdrawal Limits",
        "Bank Account Change",
      ],
    },
    {
      title: "Mutual Funds & Investments",
      topics: [
        "Investing via Coin",
        "Direct Mutual Funds",
        "SIP Setup",
        "Portfolio Tracking",
        "NAV Updates",
        "Redemption Timelines",
      ],
    },
    {
      title: "Platforms & Tools",
      topics: [
        "Kite Web & Mobile",
        "Console Reports",
        "TradingView Integration",
        "App Errors",
        "Login/Logout Issues",
        "Two-Factor Authentication",
      ],
    },
  ];

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col text-center">
          <h2 className="fw-bold">
            To create a ticket, select a relevant topic
          </h2>
          <p className="text-muted">
            Browse our categorized help topics before reaching out.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {categories.map((category, index) => (
          <div className="col-12 col-md-6 col-lg-4" key={index}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-primary">
                  <i className="fa fa-folder-open me-2"></i>
                  {category.title}
                </h5>
                <ul className="list-unstyled mt-3">
                  {category.topics.map((topic, idx) => (
                    <li key={idx} style={{ lineHeight: "1.8" }}>
                      <a
                        href="#"
                        className="text-decoration-none text-dark d-block"
                      >
                        {topic}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CreateTicket;
