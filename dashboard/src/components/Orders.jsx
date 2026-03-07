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

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";

// --- Sell Popup Component ---
const SellPopup = ({ show, onClose, onSell, maxQty, stockName, price }) => {
  const [qty, setQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(price);

  useEffect(() => {
    setQty(1);
    setSellPrice(price);
  }, [show, price]);

  if (!show) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="card p-4" style={{ minWidth: 320 }}>
        <h5 className="mb-3">Sell {stockName}</h5>
        <div className="mb-2">
          <label>Quantity (max {maxQty}):</label>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))
            }
            className="form-control"
          />
        </div>
        <div className="mb-2">
          <label>Sell Price:</label>
          <input
            type="number"
            min={1}
            value={sellPrice}
            onChange={(e) => setSellPrice(Number(e.target.value))}
            className="form-control"
          />
        </div>
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSell(qty, sellPrice)}
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellLoading, setSellLoading] = useState(false);

  // For popup
  const [showSellPopup, setShowSellPopup] = useState(false);
  const [sellOrder, setSellOrder] = useState(null);
  const [maxSellQty, setMaxSellQty] = useState(0);

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

  return (
    <div
      className="py-4"
      style={{
        minHeight: "100vh",
        background: "var(--bg-color)",
      }}
    >
      <div
        className="container-fluid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "var(--surface-bg)",
          borderRadius: "18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          padding: "32px 24px",
        }}
      >
        <h2
          className="mb-4 text-center fw-bold"
          style={{
            color: "var(--text-color)",
            letterSpacing: "1px",
            borderBottom: "2px solid var(--brand-primary)",
            paddingBottom: "12px",
          }}
        >
          My Orders
        </h2>
        {loading && <div className="text-center fs-5">Loading...</div>}
        {error && (
          <div className="alert alert-danger text-center fs-5">{error}</div>
        )}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table align-middle" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: "var(--brand-primary)", color: "#fff" }}>
                  <th style={{ width: 40 }}>#</th>
                  <th style={{ letterSpacing: "1px" }}>Stock Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Mode</th>
                  <th>
                    <span style={{ color: "var(--brand-primary)" }}>Date</span>
                  </th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 fs-5">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, idx) => {
                    let status = "-";
                    let statusColor = "#333";
                    if (order.mode === "SELL") {
                      const avgBuyPrice = getAvgBuyPrice(order.name, idx);
                      const profitOrLoss =
                        (order.price - avgBuyPrice) * order.qty;
                      if (profitOrLoss > 0) {
                        status = `Profit ₹${profitOrLoss.toFixed(2)}`;
                        statusColor = "#38a169";
                      } else if (profitOrLoss < 0) {
                        status = `Loss -₹${Math.abs(profitOrLoss).toFixed(2)}`;
                        statusColor = "#e53e3e";
                      } else {
                        status = "No Profit/Loss";
                        statusColor = "#333";
                      }
                    }

                    // Show Sell button for each BUY order with unsold quantity
                    const availableQty =
                      order.mode === "BUY" ? getAvailableQtyForOrder(order) : 0;

                    return (
                      <tr
                        key={order._id}
                        style={{
                          background: idx % 2 === 0 ? "#f1f5f9" : "#e2e8f0",
                          borderLeft:
                            order.mode === "BUY"
                              ? "5px solid #38a169"
                              : "5px solid #e53e3e",
                        }}
                      >
                        <td className="fw-bold">{idx + 1}</td>
                        <td
                          className="fw-semibold"
                          style={{ color: "var(--brand-primary)" }}
                        >
                          {order.name}
                        </td>
                        <td>{order.qty}</td>
                        <td>
                          <span className="fw-bold" style={{ color: "green" }}>
                            ₹{order.price}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color:
                                order.mode === "BUY" ? "#38a169" : "#e53e3e",
                              fontWeight: "bold",
                              fontSize: "1em",
                              letterSpacing: "1px",
                            }}
                          >
                            {order.mode}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color: "var(--brand-primary)",
                              fontWeight: 600,
                              fontSize: "1em",
                            }}
                          >
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="fw-bold"
                            style={{
                              color: statusColor,
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          {order.mode === "BUY" && availableQty > 0 && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "0.85em" }}
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
        )}
        <SellPopup
          show={showSellPopup}
          onClose={() => setShowSellPopup(false)}
          onSell={handleSell}
          maxQty={maxSellQty}
          stockName={sellOrder?.name}
          price={sellOrder?.price}
        />
      </div>
    </div>
  );
};

export default MyOrders;
