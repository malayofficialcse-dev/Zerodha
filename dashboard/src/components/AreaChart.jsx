import React from "react";
import Chart from "react-apexcharts";
import { useTheme } from "../ThemeContext.jsx";

const AreaChart = ({ data }) => {
  const { theme } = useTheme();

  const options = {
    chart: {
      type: "area",
      height: 250,
      fontFamily: "'Inter', sans-serif",
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    colors: ["#387ed1", "#22c55e"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: data.map((d) => d.name),
      labels: {
        rotate: -45,
        style: { colors: theme === "light" ? "#64748b" : "#94a3b8" },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
        style: { colors: theme === "light" ? "#64748b" : "#94a3b8" },
      },
    },
    grid: {
      borderColor: theme === "light" ? "#f1f5f9" : "#334155",
      strokeDashArray: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: theme === "light" ? "#0f172a" : "#f1f5f9" },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.05,
        opacityTo: 0.3,
        stops: [0, 90],
      },
    },
    tooltip: { theme },
  };

  const series = [
    {
      name: "Investment",
      data: data.map((d) => (d.avg * d.qty).toFixed(2)),
    },
    {
      name: "Current Value",
      data: data.map((d) => (d.price * d.qty).toFixed(2)),
    },
  ];

  return (
    <div
      className="chart-wrapper p-4 mb-4"
      style={{
        background: "var(--surface-bg)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "4px", height: "18px", background: "#387ed1", borderRadius: "2px" }}></div>
        <h5 style={{ margin: 0, fontWeight: 600 }}>Portfolio Overview</h5>
      </div>
      <Chart options={options} series={series} type="area" height={250} />
    </div>
  );
};

export default AreaChart;
