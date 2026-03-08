import React from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Menu from "./Menu";

import { GeneralContextProvider } from "./GeneralContext";

const Home = () => {
  return (
    <GeneralContextProvider>
      <div className="app-container">
        <Menu />
        <TopBar />
        <Dashboard />
      </div>
    </GeneralContextProvider>
  );
};

export default Home;
