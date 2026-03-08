import React from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Menu from "./Menu";
import GeneralContext, { GeneralContextProvider } from "./GeneralContext";
const Home = () => {
  return (
    <GeneralContextProvider>
      <HomeContent />
    </GeneralContextProvider>
  );
};

const HomeContent = () => {
  const { isSidebarOpen } = React.useContext(GeneralContext);
  
  return (
    <div className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Menu />
      <TopBar />
      <Dashboard />
    </div>
  );
};

export default Home;
