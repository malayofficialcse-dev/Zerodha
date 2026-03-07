import React from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Menu from "./Menu";

const Home = () => {
  return (
    <div className="app-container">
      <Menu />
      <TopBar />
      <Dashboard />
    </div>
  );
};

export default Home;
