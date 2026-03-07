import generateLiveCandle from "./utils/liveCandleGenerator.js";

setInterval(() => {
  generateLiveCandle();
}, 60 * 1000); // Every 1 minute

// Run once immediately
generateLiveCandle();
