// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../config/config.js"; // adjust path as needed

// const MyOrders = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [sellLoading, setSellLoading] = useState(false);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${API_BASE_URL}/order/myOrders`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       setOrders(res.data);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to fetch orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     // eslint-disable-next-line
//   }, []);

//   const handleSell = async (order) => {
//     setSellLoading(true);
//     try {
//       await axios.post(
//         `${API_BASE_URL}/order/newOrder`,
//         {
//           name: order.name,
//           qty: order.qty,
//           price: order.price,
//           mode: "SELL",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       await fetchOrders(); // Refresh orders after selling
//     } catch (err) {
//       alert(
//         err.response?.data?.error ||
//           "Sell failed. Please check your holdings or try again."
//       );
//     } finally {
//       setSellLoading(false);
//     }
//   };

//   // Helper: Calculate average buy price for a stock up to a certain index
//   const getAvgBuyPrice = (stockName, uptoIdx) => {
//     let totalQty = 0;
//     let totalSpent = 0;
//     for (let i = 0; i < uptoIdx; i++) {
//       const o = orders[i];
//       if (o.name === stockName && o.mode === "BUY") {
//         totalQty += o.qty;
//         totalSpent += o.qty * o.price;
//       }
//       if (o.name === stockName && o.mode === "SELL") {
//         totalQty -= o.qty;
//         totalSpent -= o.qty * o.price; // Remove sold value from spent
//       }
//     }
//     return totalQty > 0 ? totalSpent / totalQty : 0;
//   };

//   return (
//     <div
//       className="py-4"
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
//       }}
//     >
//       <div
//         className="container-fluid"
//         style={{
//           maxWidth: "1200px",
//           margin: "0 auto",
//           background: "var(--surface-bg)",
//           borderRadius: "18px",
//           boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
//           padding: "32px 24px",
//         }}
//       >
//         <h2
//           className="mb-4 text-center fw-bold"
//           style={{
//             color: "#2a4365",
//             letterSpacing: "1px",
//             borderBottom: "2px solid #3182ce",
//             paddingBottom: "12px",
//           }}
//         >
//           My Orders
//         </h2>
//         {loading && <div className="text-center fs-5">Loading...</div>}
//         {error && (
//           <div className="alert alert-danger text-center fs-5">{error}</div>
//         )}
//         {!loading && !error && (
//           <div className="table-responsive">
//             <table className="table align-middle" style={{ minWidth: 700 }}>
//               <thead>
//                 <tr style={{ background: "var(--brand-primary)", color: "#fff" }}>
//                   <th style={{ width: 40 }}>#</th>
//                   <th style={{ letterSpacing: "1px" }}>Stock Name</th>
//                   <th>Quantity</th>
//                   <th>Price</th>
//                   <th>Mode</th>
//                   <th>
//                     <span style={{ color: "var(--brand-primary)" }}>Date</span>
//                   </th>
//                   <th>Status</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orders.length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="text-center py-4 fs-5">
//                       No orders found.
//                     </td>
//                   </tr>
//                 ) : (
//                   orders.map((order, idx) => {
//                     let status = "-";
//                     let statusColor = "#333";
//                     if (order.mode === "SELL") {
//                       const avgBuyPrice = getAvgBuyPrice(order.name, idx);
//                       const profitOrLoss =
//                         (order.price - avgBuyPrice) * order.qty;
//                       if (profitOrLoss > 0) {
//                         status = `Profit ₹${profitOrLoss.toFixed(2)}`;
//                         statusColor = "#38a169"; // green
//                       } else if (profitOrLoss < 0) {
//                         status = `Loss -₹${Math.abs(profitOrLoss).toFixed(2)}`;
//                         statusColor = "#e53e3e"; // red
//                       } else {
//                         status = "No Profit/Loss";
//                         statusColor = "#333";
//                       }
//                     }

//                     return (
//                       <tr
//                         key={order._id}
//                         style={{
//                           background: idx % 2 === 0 ? "#f1f5f9" : "#e2e8f0",
//                           borderLeft:
//                             order.mode === "BUY"
//                               ? "5px solid #38a169"
//                               : "5px solid #e53e3e",
//                         }}
//                       >
//                         <td className="fw-bold">{idx + 1}</td>
//                         <td
//                           className="fw-semibold"
//                           style={{ color: "var(--brand-primary)" }}
//                         >
//                           {order.name}
//                         </td>
//                         <td>{order.qty}</td>
//                         <td>
//                           <span className="fw-bold" style={{ color: "green" }}>
//                             ₹{order.price}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             style={{
//                               color:
//                                 order.mode === "BUY" ? "#38a169" : "#e53e3e",
//                               fontWeight: "bold",
//                               fontSize: "1em",
//                               letterSpacing: "1px",
//                             }}
//                           >
//                             {order.mode}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             style={{
//                               color: "#3182ce",
//                               fontWeight: 600,
//                               fontSize: "1em",
//                             }}
//                           >
//                             {order.createdAt
//                               ? new Date(order.createdAt).toLocaleString()
//                               : "-"}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             className="fw-bold"
//                             style={{
//                               color: statusColor,
//                             }}
//                           >
//                             {status}
//                           </span>
//                         </td>
//                         {/* <td>
//                           {order.mode === "BUY" && (
//                             <button
//                               className="btn btn-danger btn-sm"
//                               disabled={sellLoading}
//                               onClick={() => handleSell(order)}
//                             >
//                               {sellLoading ? "Selling..." : "Sell"}
//                             </button>
//                           )}
//                         </td> */}

//                         <td>
//                           {" "}
//                           {order.mode === "BUY" && (
//                             <button
//                               className="btn btn-danger btn-sm tiny-sell-btn"
//                               disabled={sellLoading}
//                               onClick={() => handleSell(order)}
//                             >
//                               {sellLoading ? "Selling..." : "Sell"}
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MyOrders;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../config/config.js";

// // --- Sell Popup Component ---
// const SellPopup = ({ show, onClose, onSell, maxQty, stockName, price }) => {
//   const [qty, setQty] = useState(1);
//   const [sellPrice, setSellPrice] = useState(price);

//   useEffect(() => {
//     setQty(1);
//     setSellPrice(price);
//   }, [show, price]);

//   if (!show) return null;

//   return (
//     <div
//       className="modal-backdrop"
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "100vh",
//         background: "rgba(0,0,0,0.3)",
//         zIndex: 1000,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <div className="card p-4" style={{ minWidth: 320 }}>
//         <h5 className="mb-3">Sell {stockName}</h5>
//         <div className="mb-2">
//           <label>Quantity (max {maxQty}):</label>
//           <input
//             type="number"
//             min={1}
//             max={maxQty}
//             value={qty}
//             onChange={(e) =>
//               setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))
//             }
//             className="form-control"
//           />
//         </div>
//         <div className="mb-2">
//           <label>Sell Price:</label>
//           <input
//             type="number"
//             min={1}
//             value={sellPrice}
//             onChange={(e) => setSellPrice(Number(e.target.value))}
//             className="form-control"
//           />
//         </div>
//         <div className="d-flex justify-content-between mt-3">
//           <button className="btn btn-secondary" onClick={onClose}>
//             Cancel
//           </button>
//           <button
//             className="btn btn-primary"
//             onClick={() => onSell(qty, sellPrice)}
//           >
//             Sell
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const MyOrders = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [sellLoading, setSellLoading] = useState(false);

//   // For popup
//   const [showSellPopup, setShowSellPopup] = useState(false);
//   const [sellOrder, setSellOrder] = useState(null);
//   const [maxSellQty, setMaxSellQty] = useState(0);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${API_BASE_URL}/order/myOrders`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       setOrders(res.data);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to fetch orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     // eslint-disable-next-line
//   }, []);

//   // Calculate available quantity for a stock
//   const getAvailableQty = (stockName) => {
//     let bought = 0,
//       sold = 0;
//     orders.forEach((o) => {
//       if (o.name === stockName) {
//         if (o.mode === "BUY") bought += o.qty;
//         if (o.mode === "SELL") sold += o.qty;
//       }
//     });
//     return bought - sold;
//   };

//   // Helper: Calculate average buy price for a stock up to a certain index
//   const getAvgBuyPrice = (stockName, uptoIdx) => {
//     let totalQty = 0;
//     let totalSpent = 0;
//     for (let i = 0; i < uptoIdx; i++) {
//       const o = orders[i];
//       if (o.name === stockName && o.mode === "BUY") {
//         totalQty += o.qty;
//         totalSpent += o.qty * o.price;
//       }
//       if (o.name === stockName && o.mode === "SELL") {
//         totalQty -= o.qty;
//         totalSpent -= o.qty * o.price;
//       }
//     }
//     return totalQty > 0 ? totalSpent / totalQty : 0;
//   };

//   // Handle sell from popup
//   // const handleSell = async (qty, price) => {
//   //   setSellLoading(true);
//   //   try {
//   //     await axios.post(
//   //       `${API_BASE_URL}/order/newOrder`,
//   //       {
//   //         name: sellOrder.name,
//   //         qty,
//   //         price,
//   //         mode: "SELL",
//   //       },
//   //       {
//   //         headers: {
//   //           Authorization: `Bearer ${localStorage.getItem("token")}`,
//   //         },
//   //       }
//   //     );
//   //     setShowSellPopup(false);
//   //     await fetchOrders();
//   //   } catch (err) {
//   //     alert(
//   //       err.response?.data?.error ||
//   //         "Sell failed. Please check your holdings or try again."
//   //     );
//   //   } finally {
//   //     setSellLoading(false);
//   //   }
//   // };

//   const handleSell = async (qty, price) => {
//     setSellLoading(true);
//     try {
//       await axios.post(
//         `${API_BASE_URL}/order/newOrder`,
//         {
//           name: sellOrder.name,
//           qty: Number(qty), // <-- Ensure number
//           price: Number(price), // <-- Ensure number
//           mode: "SELL",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       setShowSellPopup(false);
//       await fetchOrders();
//     } catch (err) {
//       alert(
//         err.response?.data?.error ||
//           "Sell failed. Please check your holdings or try again."
//       );
//     } finally {
//       setSellLoading(false);
//     }
//   };

//   return (
//     <div
//       className="py-4"
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
//       }}
//     >
//       <div
//         className="container-fluid"
//         style={{
//           maxWidth: "1200px",
//           margin: "0 auto",
//           background: "var(--surface-bg)",
//           borderRadius: "18px",
//           boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
//           padding: "32px 24px",
//         }}
//       >
//         <h2
//           className="mb-4 text-center fw-bold"
//           style={{
//             color: "#2a4365",
//             letterSpacing: "1px",
//             borderBottom: "2px solid #3182ce",
//             paddingBottom: "12px",
//           }}
//         >
//           My Orders
//         </h2>
//         {loading && <div className="text-center fs-5">Loading...</div>}
//         {error && (
//           <div className="alert alert-danger text-center fs-5">{error}</div>
//         )}
//         {!loading && !error && (
//           <div className="table-responsive">
//             <table className="table align-middle" style={{ minWidth: 700 }}>
//               <thead>
//                 <tr style={{ background: "var(--brand-primary)", color: "#fff" }}>
//                   <th style={{ width: 40 }}>#</th>
//                   <th style={{ letterSpacing: "1px" }}>Stock Name</th>
//                   <th>Quantity</th>
//                   <th>Price</th>
//                   <th>Mode</th>
//                   <th>
//                     <span style={{ color: "var(--brand-primary)" }}>Date</span>
//                   </th>
//                   <th>Status</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orders.length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="text-center py-4 fs-5">
//                       No orders found.
//                     </td>
//                   </tr>
//                 ) : (
//                   orders.map((order, idx) => {
//                     let status = "-";
//                     let statusColor = "#333";
//                     if (order.mode === "SELL") {
//                       const avgBuyPrice = getAvgBuyPrice(order.name, idx);
//                       const profitOrLoss =
//                         (order.price - avgBuyPrice) * order.qty;
//                       if (profitOrLoss > 0) {
//                         status = `Profit ₹${profitOrLoss.toFixed(2)}`;
//                         statusColor = "#38a169";
//                       } else if (profitOrLoss < 0) {
//                         status = `Loss -₹${Math.abs(profitOrLoss).toFixed(2)}`;
//                         statusColor = "#e53e3e";
//                       } else {
//                         status = "No Profit/Loss";
//                         statusColor = "#333";
//                       }
//                     }

//                     // Only show Sell button for BUY orders with available qty
//                     const availableQty =
//                       order.mode === "BUY" ? getAvailableQty(order.name) : 0;

//                     return (
//                       <tr
//                         key={order._id}
//                         style={{
//                           background: idx % 2 === 0 ? "#f1f5f9" : "#e2e8f0",
//                           borderLeft:
//                             order.mode === "BUY"
//                               ? "5px solid #38a169"
//                               : "5px solid #e53e3e",
//                         }}
//                       >
//                         <td className="fw-bold">{idx + 1}</td>
//                         <td
//                           className="fw-semibold"
//                           style={{ color: "var(--brand-primary)" }}
//                         >
//                           {order.name}
//                         </td>
//                         <td>{order.qty}</td>
//                         <td>
//                           <span className="fw-bold" style={{ color: "green" }}>
//                             ₹{order.price}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             style={{
//                               color:
//                                 order.mode === "BUY" ? "#38a169" : "#e53e3e",
//                               fontWeight: "bold",
//                               fontSize: "1em",
//                               letterSpacing: "1px",
//                             }}
//                           >
//                             {order.mode}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             style={{
//                               color: "#3182ce",
//                               fontWeight: 600,
//                               fontSize: "1em",
//                             }}
//                           >
//                             {order.createdAt
//                               ? new Date(order.createdAt).toLocaleString()
//                               : "-"}
//                           </span>
//                         </td>
//                         <td>
//                           <span
//                             className="fw-bold"
//                             style={{
//                               color: statusColor,
//                             }}
//                           >
//                             {status}
//                           </span>
//                         </td>
//                         <td>
//                           {order.mode === "BUY" && availableQty > 0 && (
//                             <button
//                               className="btn btn-primary btn-sm"
//                               style={{ fontSize: "0.85em" }}
//                               disabled={sellLoading}
//                               onClick={() => {
//                                 setSellOrder(order);
//                                 setMaxSellQty(availableQty);
//                                 setShowSellPopup(true);
//                               }}
//                             >
//                               Sell
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//         <SellPopup
//           show={showSellPopup}
//           onClose={() => setShowSellPopup(false)}
//           onSell={handleSell}
//           maxQty={maxSellQty}
//           stockName={sellOrder?.name}
//           price={sellOrder?.price}
//         />
//       </div>
//     </div>
//   );
// };

// export default MyOrders;

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import Chart from "react-apexcharts";
import {
  TrendingUp,
  TrendingDown,
  ReceiptLong,
  Timeline,
  ShowChart,
} from "@mui/icons-material";

// ─── Sell Popup: live price + P&L preview + theme-aware ───────────────────
const SellPopup = ({ show, onClose, onSell, maxQty, stockName, buyPrice, livePrice, sellLoading }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const card    = isDark ? "#1e293b" : "#ffffff";
  const cardBg2 = isDark ? "#0f172a" : "#f8fafc";
  const border  = isDark ? "#334155" : "#e2e8f0";
  const text    = isDark ? "#f8fafc" : "#0f172a";
  const muted   = isDark ? "#94a3b8" : "#64748b";
  const overlay = isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)";

  const [qty, setQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(livePrice || buyPrice || 0);

  const userEditedRef = React.useRef(false);
  useEffect(() => {
    if (livePrice && !userEditedRef.current)
      setSellPrice(Number(livePrice.toFixed(2)));
  }, [livePrice]);

  useEffect(() => {
    if (show) {
      userEditedRef.current = false;
      setQty(1);
      setSellPrice(Number((livePrice || buyPrice || 0).toFixed(2)));
    }
  }, [show]);

  if (!show) return null;

  const pnl      = (sellPrice - buyPrice) * qty;
  const isProfit = pnl > 0;
  const isLoss   = pnl < 0;
  const pnlColor = isProfit ? "#22c55e" : isLoss ? "#ef4444" : "#64748b";
  const pnlBg    = isProfit ? "rgba(34,197,94,0.08)" : isLoss ? "rgba(239,68,68,0.08)" : "rgba(100,116,139,0.06)";
  const pnlLabel = isProfit
    ? `▲ Profit  ₹${pnl.toFixed(2)}`
    : isLoss ? `▼ Loss  -₹${Math.abs(pnl).toFixed(2)}`
    : "No P&L";
  const btnBg = isProfit
    ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : isLoss ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : "linear-gradient(135deg,#3b82f6,#2563eb)";

  const inp = {
    width: "100%", padding: "10px 14px",
    background: cardBg2, border: `1px solid ${border}`, borderRadius: 4,
    color: text, fontSize: "1rem", outline: "none", boxSizing: "border-box"
  };
  const lbl = { color: muted, fontSize: "0.78rem", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ position:"fixed", inset:0, background:overlay, zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>
      <div style={{ background:card, border:`1px solid ${border}`, borderRadius:4, padding:"28px 32px", width:420, maxWidth:"95vw", boxShadow:"0 30px 80px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
          <div>
            <h5 style={{ color:text, fontWeight:800, margin:0, fontSize:"1.2rem" }}>Sell {stockName}</h5>
            <span style={{ color:muted, fontSize:"0.8rem" }}>Place a market sell order</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:muted, fontSize:"1.4rem", cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        {/* Avg buy price */}
        <div style={{ background:cardBg2, borderRadius:4, padding:"10px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", border:`1px solid ${border}` }}>
          <span style={{ color:muted, fontSize:"0.82rem" }}>Your Avg. Buy Price</span>
          <span style={{ color:text, fontWeight:700 }}>₹{Number(buyPrice).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
        </div>

        {/* Live price */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", display:"inline-block", boxShadow:"0 0 0 3px rgba(34,197,94,0.25)" }} />
            Live Market Price (auto-captured)
          </label>
          <div style={{ ...inp, border:"1px solid rgba(34,197,94,0.45)", color:"#22c55e", fontWeight:800, fontSize:"1.3rem", cursor:"default" }}>
            {livePrice ? `₹${Number(livePrice).toLocaleString("en-IN",{minimumFractionDigits:2})}` : "Waiting for tick…"}
          </div>
        </div>

        {/* Editable sell price */}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Sell Price (you can adjust)</label>
          <input type="number" min={0.01} step={0.05} value={sellPrice}
            onChange={(e) => { userEditedRef.current=true; setSellPrice(Number(e.target.value)); }}
            style={inp} />
        </div>

        {/* Qty */}
        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Quantity (max {maxQty})</label>
          <input type="number" min={1} max={maxQty} value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
            style={inp} />
        </div>

        {/* P&L preview */}
        <div style={{ background:pnlBg, border:`1px solid ${pnlColor}33`, borderRadius:4, padding:"14px 18px", marginBottom:20, textAlign:"center" }}>
          <div style={{ color:muted, fontSize:"0.77rem", marginBottom:5 }}>
            Estimated P&amp;L &nbsp;({qty} × ₹{Number(sellPrice).toFixed(2)} − ₹{Number(buyPrice).toFixed(2)})
          </div>
          <div style={{ color:pnlColor, fontWeight:900, fontSize:"1.45rem" }}>{pnlLabel}</div>
          {(isProfit || isLoss) && (
            <div style={{ color:pnlColor, fontSize:"0.77rem", marginTop:4, opacity:0.8 }}>
              {isProfit ? "✓ You are in profit on this trade" : "✕ You are at a loss on this trade"}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:cardBg2, border:`1px solid ${border}`, borderRadius:4, color:muted, fontWeight:600, cursor:"pointer", fontSize:"0.9rem" }}>Cancel</button>
          <button onClick={() => onSell(qty, sellPrice)} disabled={sellLoading||!sellPrice}
            style={{ flex:1, padding:"11px", background:btnBg, border:"none", borderRadius:4, color:"#fff", fontWeight:700, cursor:sellLoading?"not-allowed":"pointer", fontSize:"0.9rem", opacity:sellLoading?0.65:1 }}>
            {sellLoading ? "Placing order…" : `Sell ${qty} @ ₹${Number(sellPrice).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub, color, icon, theme }) => {
  const isDark = theme === "dark";
  return (
    <div
      style={{
        background: isDark ? "#1e293b" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        borderRadius: 4,
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transition: "transform 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
        <span style={{ color: color || "#94a3b8", opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: color || (isDark ? "#f8fafc" : "#0f172a"), lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.74rem", color: isDark ? "#64748b" : "#94a3b8" }}>{sub}</div>}
    </div>
  );
};

const MyOrders = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg         = isDark ? "#0f172a" : "#f1f5f9";
  const card       = isDark ? "#1e293b" : "#ffffff";
  const cardBg2    = isDark ? "#0f172a" : "#f8fafc";
  const border     = isDark ? "#334155" : "#e2e8f0";
  const text       = isDark ? "#f8fafc" : "#0f172a";
  const muted      = isDark ? "#94a3b8" : "#64748b";
  const thead      = isDark ? "#0f172a" : "#f8fafc";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellLoading, setSellLoading] = useState(false);

  // For popup
  const [showSellPopup, setShowSellPopup] = useState(false);
  const [sellOrder, setSellOrder] = useState(null);
  const [maxSellQty, setMaxSellQty] = useState(0);

  // Live prices from socket — symbol → current close price
  const [livePrices, setLivePrices] = useState({});

  // Connect to socket once; update livePrices on every tick
  useEffect(() => {
    const socketURL = API_BASE_URL.replace("/api", "");
    const socket = io(socketURL);
    socket.on("tick", (tick) => {
      if (tick?.symbol && tick?.close) {
        setLivePrices((prev) => ({ ...prev, [tick.symbol]: tick.close }));
      }
    });
    return () => socket.disconnect();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/order/myOrders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // Helper: Calculate available quantity for a specific BUY order
  const getAvailableQtyForOrder = (order) => {
    if (order.mode !== "BUY") return 0;
    let sold = 0;
    let buyQty = order.qty;
    let buyIdx = orders.findIndex((o) => o._id === order._id);
    for (let i = buyIdx + 1; i < orders.length; i++) {
      const o = orders[i];
      if (o.name === order.name && o.mode === "SELL") {
        sold += o.qty;
      }
    }
    return Math.max(0, buyQty - sold);
  };

  // Helper: Calculate average buy price for a stock up to a certain index
  const getAvgBuyPrice = (stockName, uptoIdx) => {
    let totalQty = 0;
    let totalSpent = 0;
    for (let i = 0; i < uptoIdx; i++) {
      const o = orders[i];
      if (o.name === stockName && o.mode === "BUY") {
        totalQty += o.qty;
        totalSpent += o.qty * o.price;
      }
      if (o.name === stockName && o.mode === "SELL") {
        totalQty -= o.qty;
        totalSpent -= o.qty * o.price;
      }
    }
    return totalQty > 0 ? totalSpent / totalQty : 0;
  };

  const handleSell = async (qty, price) => {
    setSellLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/order/newOrder`,
        {
          name: sellOrder.name,
          qty: Number(qty),
          price: Number(price),
          mode: "SELL",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setShowSellPopup(false);
      await fetchOrders();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Sell failed. Please check your holdings or try again."
      );
    } finally {
      setSellLoading(false);
    }
  };

  // Helper: Format numbers as Indian Rupees (INR)
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Calculate realized P&L history (equity curve over time)
  const realizedPnLHistory = useMemo(() => {
    const chronological = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let cumulative = 0;
    const stockInventory = {}; // symbol -> { qty, totalCost }
    const timeline = [];

    // Seed 0 value at the start
    if (chronological.length > 0) {
      const firstDate = new Date(chronological[0].createdAt);
      timeline.push({
        x: new Date(firstDate.getTime() - 60000).getTime(), // 1 min prior
        y: 0,
      });
    }

    chronological.forEach((order) => {
      const { name: symbol, qty, price, mode, createdAt } = order;
      const dateMs = new Date(createdAt).getTime();

      if (!stockInventory[symbol]) {
        stockInventory[symbol] = { qty: 0, totalCost: 0 };
      }

      if (mode === "BUY") {
        stockInventory[symbol].qty += qty;
        stockInventory[symbol].totalCost += qty * price;
      } else if (mode === "SELL") {
        const inv = stockInventory[symbol];
        const avgBuyPrice = inv.qty > 0 ? inv.totalCost / inv.qty : price;
        const pnl = (price - avgBuyPrice) * qty;
        cumulative += pnl;

        inv.qty = Math.max(0, inv.qty - qty);
        inv.totalCost = inv.qty * avgBuyPrice;
      }

      timeline.push({
        x: dateMs,
        y: Number(cumulative.toFixed(2)),
      });
    });

    return timeline;
  }, [orders]);

  // Calculate metrics for stats
  const stats = useMemo(() => {
    const chronological = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let cumulative = 0;
    let wins = 0;
    let losses = 0;
    let bestPnl = 0;
    let worstPnl = 0;
    let totalInvested = 0;
    let totalRealized = 0;
    let buyCount = 0;
    let sellCount = 0;
    const stockInventory = {};

    chronological.forEach((order) => {
      const { name: symbol, qty, price, mode } = order;

      if (!stockInventory[symbol]) {
        stockInventory[symbol] = { qty: 0, totalCost: 0 };
      }

      if (mode === "BUY") {
        stockInventory[symbol].qty += qty;
        stockInventory[symbol].totalCost += qty * price;
        totalInvested += qty * price;
        buyCount++;
      } else if (mode === "SELL") {
        const inv = stockInventory[symbol];
        const avgBuyPrice = inv.qty > 0 ? inv.totalCost / inv.qty : price;
        const pnl = (price - avgBuyPrice) * qty;
        cumulative += pnl;
        totalRealized += qty * price;
        sellCount++;

        if (pnl > 0) wins++;
        else if (pnl < 0) losses++;

        if (pnl > bestPnl) bestPnl = pnl;
        if (pnl < worstPnl) worstPnl = pnl;

        inv.qty = Math.max(0, inv.qty - qty);
        inv.totalCost = inv.qty * avgBuyPrice;
      }
    });

    const winRate = sellCount > 0 ? ((wins / sellCount) * 100).toFixed(1) : "0.0";

    return {
      totalPnL: cumulative,
      wins,
      losses,
      totalInvested,
      totalRealized,
      winRate,
      bestTrade: bestPnl,
      worstTrade: worstPnl,
      buyCount,
      sellCount
    };
  }, [orders]);

  // Area Chart config
  const chartOpts = {
    chart: {
      type: "area",
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [stats.totalPnL >= 0 ? "#22c55e" : "#ef4444"],
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.35,
        opacityTo: 0.05,
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: { colors: muted, fontSize: "10px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (v) => `₹${fmt(v)}`,
        style: { colors: muted, fontSize: "10px" },
      },
    },
    grid: {
      borderColor: border,
      strokeDashArray: 4,
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      x: { format: "dd MMM yy HH:mm" },
      y: { formatter: (v) => `₹${fmt(v)}` },
    },
    dataLabels: { enabled: false },
  };

  const chartSeries = [
    {
      name: "Cumulative Realized P&L",
      data: realizedPnLHistory,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        padding: "24px",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 4,
          boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${border}`, paddingBottom: 16 }}>
          <h2 style={{ color: text, fontWeight: 800, fontSize: "1.8rem", margin: 0 }}>My Orders</h2>
          <p style={{ color: muted, margin: "4px 0 0", fontSize: "0.88rem" }}>Realized P&amp;L performance and trade ledger</p>
        </div>

        {loading && <div className="text-center py-5 fs-5" style={{ color: text }}>Loading...</div>}
        {error && (
          <div className="alert alert-danger text-center fs-5" style={{ borderRadius: 4 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
              <KpiCard
                theme={theme}
                label="Net Realized P&L"
                icon={stats.totalPnL >= 0 ? <TrendingUp fontSize="small"/> : <TrendingDown fontSize="small"/>}
                value={`${stats.totalPnL >= 0 ? "+" : ""}₹${fmt(stats.totalPnL)}`}
                sub="Cumulative Realized Profit/Loss"
                color={stats.totalPnL >= 0 ? "#22c55e" : "#ef4444"}
              />
              <KpiCard
                theme={theme}
                label="Win Rate"
                icon={<Timeline fontSize="small"/>}
                value={`${stats.winRate}%`}
                sub={`${stats.wins} wins / ${stats.losses} losses`}
                color={parseFloat(stats.winRate) >= 50 ? "#22c55e" : "#ef4444"}
              />
              <KpiCard
                theme={theme}
                label="Best Sell Trade"
                icon={<span style={{ fontSize: "1.1rem" }}>🏆</span>}
                value={`+₹${fmt(stats.bestTrade)}`}
                sub="Single highest profit"
                color="#22c55e"
              />
              <KpiCard
                theme={theme}
                label="Worst Sell Trade"
                icon={<span style={{ fontSize: "1.1rem" }}>📉</span>}
                value={`${stats.worstTrade < 0 ? "" : "+"}₹${fmt(stats.worstTrade)}`}
                sub="Single lowest payout"
                color={stats.worstTrade < 0 ? "#ef4444" : "#64748b"}
              />
            </div>

            {/* Chart + Breakdown Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "stretch" }}>
              {/* Left Column: Realized P&L curve */}
              <div style={{ background: cardBg2, border: `1px solid ${border}`, borderRadius: 4, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 16, background: stats.totalPnL >= 0 ? "#22c55e" : "#ef4444", borderRadius: 2 }} />
                  <h4 style={{ margin: 0, color: text, fontSize: "0.95rem", fontWeight: 700 }}>Realized P&amp;L Area Chart</h4>
                </div>
                {realizedPnLHistory.length > 1 ? (
                  <Chart options={chartOpts} series={chartSeries} type="area" height={220} />
                ) : (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: "0.85rem" }}>
                    Not enough transaction data to plot P&amp;L trendline.
                  </div>
                )}
              </div>

              {/* Right Column: Breakdown */}
              <div style={{ background: cardBg2, border: `1px solid ${border}`, borderRadius: 4, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 16, background: "#387ed1", borderRadius: 2 }} />
                  <h4 style={{ margin: 0, color: text, fontSize: "0.95rem", fontWeight: 700 }}>Orders Statistics</h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  {[
                    { label: "Total Buy Orders", value: stats.buyCount, icon: <ReceiptLong fontSize="small" style={{ color: "#387ed1" }} /> },
                    { label: "Total Sell Orders", value: stats.sellCount, icon: <ReceiptLong fontSize="small" style={{ color: "#ef4444" }} /> },
                    { label: "Total Volume Invested", value: `₹${fmt(stats.totalInvested)}`, icon: <ShowChart fontSize="small" style={{ color: "#22c55e" }} /> },
                    { label: "Total Volume Realized", value: `₹${fmt(stats.totalRealized)}`, icon: <ShowChart fontSize="small" style={{ color: "#a855f7" }} /> },
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 8,
                        borderBottom: index < 3 ? `1px solid ${border}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.icon}
                        <span style={{ fontSize: "0.8rem", color: muted, fontWeight: 500 }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: "0.9rem", color: text, fontWeight: 700 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Table Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 16, background: "#387ed1", borderRadius: 2 }} />
                <h4 style={{ margin: 0, color: text, fontSize: "0.95rem", fontWeight: 700 }}>Ledger Details</h4>
              </div>

              <div style={{ overflowX: "auto", border: `1px solid ${border}`, borderRadius: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", background: card }}>
                  <thead>
                    <tr style={{ background: thead, borderBottom: `1px solid ${border}` }}>
                      <th style={{ width: 50, padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>#</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Stock Name</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Quantity</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Price</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Mode</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Date</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Status</th>
                      <th style={{ padding: "12px 14px", color: muted, fontWeight: 600, textAlign: "left" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "30px 20px", color: muted }}>
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => {
                        let statusText = "—";
                        let statusColor = muted;
                        if (order.mode === "SELL") {
                          const avgBuyPrice = getAvgBuyPrice(order.name, idx);
                          const profitOrLoss = (order.price - avgBuyPrice) * order.qty;
                          if (profitOrLoss > 0) {
                            statusText = `Profit ₹${fmt(profitOrLoss)}`;
                            statusColor = "#22c55e";
                          } else if (profitOrLoss < 0) {
                            statusText = `Loss -₹${fmt(Math.abs(profitOrLoss))}`;
                            statusColor = "#ef4444";
                          } else {
                            statusText = "₹0.00";
                            statusColor = muted;
                          }
                        }

                        const availableQty = order.mode === "BUY" ? getAvailableQtyForOrder(order) : 0;

                        return (
                          <tr
                            key={order._id}
                            style={{
                              background: idx % 2 === 0 ? card : cardBg2,
                              borderLeft: `4px solid ${order.mode === "BUY" ? "#22c55e" : "#ef4444"}`,
                              borderBottom: `1px solid ${border}`,
                            }}
                          >
                            <td style={{ padding: "12px 14px", color: text, fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: "12px 14px", color: text, fontWeight: 700 }}>{order.name}</td>
                            <td style={{ padding: "12px 14px", color: text }}>{order.qty}</td>
                            <td style={{ padding: "12px 14px", color: text, fontWeight: 700 }}>₹{fmt(order.price)}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  background: order.mode === "BUY" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                  color: order.mode === "BUY" ? "#22c55e" : "#ef4444",
                                }}
                              >
                                {order.mode}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", color: muted }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                            <td style={{ padding: "12px 14px", color: statusColor, fontWeight: 700 }}>
                              {statusText}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {order.mode === "BUY" && availableQty > 0 && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    fontSize: "0.78rem",
                                    padding: "4px 12px",
                                    borderRadius: 4,
                                    background: "#387ed1",
                                    border: "none",
                                    color: "#fff",
                                    fontWeight: 600,
                                    cursor: sellLoading ? "not-allowed" : "pointer",
                                  }}
                                  disabled={sellLoading}
                                  onClick={() => {
                                    setSellOrder(order);
                                    setMaxSellQty(availableQty);
                                    setShowSellPopup(true);
                                  }}
                                >
                                  Sell
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        <SellPopup
          show={showSellPopup}
          onClose={() => setShowSellPopup(false)}
          onSell={handleSell}
          maxQty={maxSellQty}
          stockName={sellOrder?.name}
          buyPrice={sellOrder?.price}
          livePrice={livePrices[sellOrder?.name] ?? sellOrder?.price}
          sellLoading={sellLoading}
        />
      </div>
    </div>
  );
};

export default MyOrders;
