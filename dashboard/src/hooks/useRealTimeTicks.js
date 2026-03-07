import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/config.js";

const socketURL = API_BASE_URL.replace("/api", "").replace(/\/$/, "");

let sharedSocket = null;
let socketRefCount = 0;
const listeners = new Set();

// Single shared socket connection for the entire app
function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(socketURL, { transports: ["websocket"] });
    sharedSocket.on("connect", () => {
      console.log(`[Socket] Connected to ${socketURL}`);
    });
    sharedSocket.on("tick", (data) => {
      listeners.forEach((fn) => fn(data));
    });
  }
  return sharedSocket;
}

/**
 * useRealTimeTicks: Subscribe to live price ticks for specific symbols.
 * Ticks are received every 1 second but React state is updated every 5 seconds
 * (batched flush) so the UI refreshes in sync with the backend aggregation cycle.
 *
 * @param {string[]} symbols       - e.g. ["RELIANCE", "NIFTY"]
 * @param {Object}   initialPrices - seed values shown before the first flush
 */
export function useRealTimeTicks(symbols, initialPrices = {}) {
  const [prices, setPrices] = useState(initialPrices);
  const symbolsRef = useRef(new Set(symbols));

  // Buffer: stores the *latest* tick for each symbol without triggering re-render
  const bufferRef = useRef({});

  // Keep symbolsRef in sync when the caller changes the symbols array
  useEffect(() => {
    symbolsRef.current = new Set(symbols);
  }, [symbols]);

  // Sync state with initialPrices when they change (e.g. after DB fetch)
  useEffect(() => {
    setPrices((prev) => {
      const next = { ...prev };
      Object.entries(initialPrices).forEach(([sym, data]) => {
        // Only seed if we don't already have live data for this symbol
        if (!next[sym]) {
          next[sym] = data;
        }
      });
      return next;
    });
  }, [initialPrices]);

  useEffect(() => {
    getSocket(); // ensure socket is open
    socketRefCount++;

    // On every incoming tick, just write to the buffer (no React state update)
    const handler = (tick) => {
      if (!symbolsRef.current.has(tick.symbol)) return;
      bufferRef.current[tick.symbol] = tick;
    };

    listeners.add(handler);

    // Every 5 seconds flush the buffer → single React state update
    const flushInterval = setInterval(() => {
      const buffer = bufferRef.current;
      if (Object.keys(buffer).length === 0) return;

      setPrices((prev) => {
        const next = { ...prev };
        Object.entries(buffer).forEach(([symbol, tick]) => {
          const prevEntry = prev[symbol] || {};
          const prevClose = prevEntry.prevClose ?? prevEntry.price ?? tick.close;
          const change = tick.close - prevClose;
          const changePct = prevClose
            ? ((change / prevClose) * 100).toFixed(2)
            : "0.00";
          next[symbol] = {
            price: tick.close,
            prevClose,
            change: Number(change.toFixed(2)),
            changePct,
            isUp: change >= 0,
            high: tick.high,
            low: tick.low,
            volume: tick.volume,
          };
        });
        return next;
      });

      // Clear buffer after flush so stale data isn't re-applied next cycle
      bufferRef.current = {};
    }, 5000);

    return () => {
      listeners.delete(handler);
      clearInterval(flushInterval);
      socketRefCount--;
      if (socketRefCount === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, []); // intentionally run only once

  return prices;
}

export default useRealTimeTicks;
