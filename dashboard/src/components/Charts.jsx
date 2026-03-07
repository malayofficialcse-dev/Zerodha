// import React, { useEffect, useState } from "react";
// import Chart from "react-apexcharts";
// import axios from "axios";
// import CandlestickCharts from "./CandlestickCharts";

// const Charts = () => {
//   const [companies, setCompanies] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [ohlc, setOhlc] = useState([]);
//   const [intervalId, setIntervalId] = useState(null);

//   // Fetch all companies
//   useEffect(() => {
//     axios.get("http://localhost:3003/api/stocks/all").then((res) => {
//       setCompanies(res.data);
//       setSelected(res.data[0]?.symbol);
//     });
//   }, []);

//   // Fetch OHLC for selected company
//   useEffect(() => {
//     if (!selected) return;
//     const fetchOhlc = () => {
//       axios
//         .get(`http://localhost:3003/api/stocks/${selected}/ohlc`)
//         .then((res) => {
//           setOhlc(
//             res.data.map((d) => ({
//               x: new Date(d.date).toISOString().slice(0, 10),
//               y: [d.open, d.high, d.low, d.close],
//             }))
//           );
//         });
//     };
//     fetchOhlc();
//     // Set interval for live update
//     if (intervalId) clearInterval(intervalId);
//     const id = setInterval(() => {
//       axios
//         .post(`http://localhost:3003/api/stocks/${selected}/update`)
//         .then(fetchOhlc);
//     }, 1000);
//     setIntervalId(id);
//     return () => clearInterval(id);
//   }, [selected]);

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Charts</h2>
//       <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
//         {companies.map((c) => (
//           <button
//             key={c.symbol}
//             onClick={() => setSelected(c.symbol)}
//             style={{
//               padding: "8px 16px",
//               background: selected === c.symbol ? "#3182ce" : "#f1f5f9",
//               color: selected === c.symbol ? "#fff" : "#222",
//               border: "none",
//               borderRadius: 8,
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             {c.name}
//           </button>
//         ))}
//       </div>
//       <Chart
//         options={{
//           chart: { type: "candlestick", height: 350, toolbar: { show: true } },
//           title: { text: `${selected} Candlestick Chart`, align: "left" },
//           xaxis: { type: "category" },
//           yaxis: { tooltip: { enabled: true } },
//         }}
//         series={[{ data: ohlc }]}
//         type="candlestick"
//         height={350}
//       />
//     </div>
//   );
// };

// export default Charts;

import React from "react";
import CandlestickCharts from "./CandlestickCharts";

const Charts = () => <CandlestickCharts />;

export default Charts;
