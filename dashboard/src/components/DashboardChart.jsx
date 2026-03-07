// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import ReactApexChart from "react-apexcharts";
// import { API_BASE_URL } from "../config/config.js"; // adjust path as needed

// const chartTypes = ["column", "area", "line"]; // TEAM A: column, TEAM B: area, TEAM C: line

// const DashboardChart = () => {
//   const [series, setSeries] = useState([]);
//   const [labels, setLabels] = useState([]);

//   useEffect(() => {
//     axios.get(`${API_BASE_URL}/dashboard/positions`).then((res) => {
//       // 1. Get all unique dates (sorted)
//       const allDates = Array.from(
//         new Set(res.data.map((pos) => pos.date))
//       ).sort();

//       setLabels(allDates);

//       // 2. Group positions by company name
//       const companyMap = {};
//       res.data.forEach((pos) => {
//         if (!companyMap[pos.name]) {
//           companyMap[pos.name] = {};
//         }
//         companyMap[pos.name][pos.date] = pos.value;
//       });

//       // 3. Build series array
//       const companyNames = Object.keys(companyMap);
//       const chartSeries = companyNames.map((name, idx) => ({
//         name,
//         type: chartTypes[idx % chartTypes.length], // TEAM A: column, TEAM B: area, TEAM C: line
//         data: allDates.map((date) => companyMap[name][date] || 0),
//       }));

//       setSeries(chartSeries);
//     });
//   }, []);

//   const options = {
//     chart: {
//       height: 350,
//       type: "line",
//       stacked: false,
//     },
//     stroke: {
//       width: [0, 2, 5],
//       curve: "smooth",
//     },
//     plotOptions: {
//       bar: {
//         columnWidth: "50%",
//       },
//     },
//     fill: {
//       opacity: [0.85, 0.25, 1],
//       gradient: {
//         inverseColors: false,
//         shade: "light",
//         type: "vertical",
//         opacityFrom: 0.85,
//         opacityTo: 0.55,
//         stops: [0, 100, 100, 100],
//       },
//     },
//     labels: labels.map((d) =>
//       new Date(d).toLocaleString("en-US", { month: "short", year: "2-digit" })
//     ),
//     markers: {
//       size: 0,
//     },
//     xaxis: {
//       type: "category",
//       labels: {
//         rotate: -45,
//       },
//     },
//     yaxis: {
//       title: {
//         text: "Points",
//       },
//     },
//     tooltip: {
//       shared: true,
//       intersect: false,
//       y: {
//         formatter: function (y) {
//           if (typeof y !== "undefined") {
//             return y.toFixed(0) + " points";
//           }
//           return y;
//         },
//       },
//     },
//     legend: {
//       position: "top",
//     },
//     colors: ["#2196f3", "#00e396", "#FA8072"], // Blue, Green, Orange
//   };

//   return (
//     <div>
//       <h3 className="title">Positions Chart</h3>
//       <div id="chart">
//         <ReactApexChart
//           options={options}
//           series={series}
//           type="line"
//           height={350}
//         />
//       </div>
//     </div>
//   );
// };

// export default DashboardChart;

import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactApexChart from "react-apexcharts";
import { API_BASE_URL } from "../config/config.js";

// 10 distinct colors for 10 companies
const companyColors = [
  "#2196f3", // Blue
  "#00e396", // Green
  "#FA8072", // Salmon
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#F44336", // Red
  "#607D8B", // Blue Grey
  "#FFC107", // Amber
  "#43A047", // Dark Green
  "#3F51B5", // Indigo
];

const DashboardChart = () => {
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);
  const [companyNames, setCompanyNames] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/dashboard/positions`).then((res) => {
      // 1. Get all unique dates (sorted)
      const allDates = Array.from(
        new Set(res.data.map((pos) => pos.date))
      ).sort();

      setLabels(allDates);

      // 2. Group positions by company name
      const companyMap = {};
      res.data.forEach((pos) => {
        if (!companyMap[pos.name]) {
          companyMap[pos.name] = {};
        }
        companyMap[pos.name][pos.date] = pos.value;
      });

      // 3. Build series array for up to 10 companies
      const companyNamesArr = Object.keys(companyMap).slice(0, 10);
      setCompanyNames(companyNamesArr);

      const chartSeries = companyNamesArr.map((name) => ({
        name,
        type: "line",
        data: allDates.map((date) => companyMap[name][date] || 0),
      }));

      setSeries(chartSeries);
    });
  }, []);

  const options = {
    chart: {
      height: 400,
      type: "line",
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: true },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    fill: {
      type: "solid",
      opacity: 0.7,
    },
    labels: labels.map((d) =>
      new Date(d).toLocaleString("en-US", { month: "short", year: "2-digit" })
    ),
    markers: {
      size: 4,
      hover: { size: 7 },
    },
    xaxis: {
      type: "category",
      labels: {
        rotate: -45,
        style: { fontSize: "13px" },
      },
      title: { text: "Date", style: { fontWeight: 600 } },
    },
    yaxis: {
      title: {
        text: "Position Value",
        style: { fontWeight: 600 },
      },
      labels: {
        formatter: (val) => val.toLocaleString(),
        style: { fontSize: "13px" },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return y.toLocaleString();
          }
          return y;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "15px",
      markers: { width: 18, height: 18, radius: 6 },
      itemMargin: { horizontal: 12, vertical: 4 },
    },
    colors: companyColors,
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 4,
      padding: { left: 10, right: 10 },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 300 },
          legend: { fontSize: "12px" },
          xaxis: { labels: { rotate: -30, fontSize: "11px" } },
        },
      },
    ],
  };

  return (
    <div
      className="card shadow-sm p-4 mb-4"
      style={{ background: "#fff", borderRadius: "18px" }}
    >
      <h3
        className="mb-3 fw-bold text-primary text-center"
        style={{ letterSpacing: "1px" }}
      >
        Company Positions Over Time
      </h3>
      <div id="chart">
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height={options.chart.height}
        />
      </div>
      <div className="mt-3 text-center">
        <span className="text-muted" style={{ fontSize: "0.95em" }}>
          Showing position trends for up to 10 companies, each with a unique
          color.
        </span>
      </div>
    </div>
  );
};

export default DashboardChart;
