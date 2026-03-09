import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  
  // Retry strategy: If Redis is down, don't crash the app forever.
  // We'll retry a few times and then give up gracefully.
  retryStrategy(times) {
    const delay = Math.min(times * 100, 5000);
    return delay;
  },
  
  // Prevents the "MaxRetriesPerRequestError" from crashing the app
  maxRetriesPerRequest: null, 
  
  // Don't block the Node event loop if commands queue up while disconnected
  enableOfflineQueue: false,
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  // Silence the spammy ECONNREFUSED errors so the console remains readable
  if (err.code === "ECONNREFUSED") {
    // console.warn("⚠️ Redis connection refused. Is Redis running?");
  } else {
    console.error("❌ Redis Client Error", err.message);
  }
});

export default redisClient;
