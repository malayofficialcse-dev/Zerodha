import React, { useState } from "react";
import { Link } from "react-router-dom";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  return (
    <div className="menu-container">
      <div className="logo-section">
        <img src="kite.webp" alt="Kite Logo" className="logo" style={{ width: "24px" }} />
      </div>
      
      <div className="menus">
        <ul>
          <li>
            <Link className="link" to="/dashboard" onClick={() => handleMenuClick(0)}>
              <span className={selectedMenu === 0 ? "menu selected" : "menu"}>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/orders" onClick={() => handleMenuClick(1)}>
              <span className={selectedMenu === 1 ? "menu selected" : "menu"}>Orders</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/holdings" onClick={() => handleMenuClick(2)}>
              <span className={selectedMenu === 2 ? "menu selected" : "menu"}>Holdings</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/positions" onClick={() => handleMenuClick(3)}>
              <span className={selectedMenu === 3 ? "menu selected" : "menu"}>Positions</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/intraday" onClick={() => handleMenuClick(4)}>
              <span className={selectedMenu === 4 ? "menu selected" : "menu"}>Intraday</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/charts" onClick={() => handleMenuClick(6)}>
              <span className={selectedMenu === 6 ? "menu selected" : "menu"}>Charts</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/heatmap" onClick={() => handleMenuClick(9)}>
              <span className={selectedMenu === 9 ? "menu selected" : "menu"}>Heatmap</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/analytics" onClick={() => handleMenuClick(10)}>
              <span className={selectedMenu === 10 ? "menu selected" : "menu"}>Analytics</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/correlation" onClick={() => handleMenuClick(7)}>
              <span className={selectedMenu === 7 ? "menu selected" : "menu"}>Correlation</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/alerts" onClick={() => handleMenuClick(8)}>
              <span className={selectedMenu === 8 ? "menu selected" : "menu"}>Alerts</span>
            </Link>
          </li>
          <li>
            <Link className="link" to="/rebalance" onClick={() => handleMenuClick(11)}>
              <span className={selectedMenu === 11 ? "menu selected" : "menu"}>Rebalance</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="profile" onClick={() => (window.location.href = "/profile")}>
        <div className="avatar">ZU</div>
        <p className="username">USERID</p>
      </div>
    </div>
  );
};

export default Menu;
