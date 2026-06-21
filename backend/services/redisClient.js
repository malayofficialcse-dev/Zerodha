import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log(`[Redis] Configuring client → Host: ${REDIS_HOST}, Port: ${REDIS_PORT}`);

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,

  // Retry strategy: If Redis is down, don't crash the app forever.
  retryStrategy(times) {
    const delay = Math.min(times * 100, 5000);
    if (times === 1) {
      console.warn(`⚠️  [Redis] Connection failed. Starting retry strategy...`);
    }
    if (times <= 5) {
      console.log(`[Redis] Retry attempt #${times}. Next retry in ${delay}ms...`);
    } else if (times === 6) {
      console.warn(`⚠️  [Redis] ${times} retries failed. Suppressing further retry logs. App continues without Redis cache.`);
    }
    return delay;
  },

  // Prevents the "MaxRetriesPerRequestError" from crashing the app
  maxRetriesPerRequest: null,

  // Don't block the Node event loop if commands queue up while disconnected
  enableOfflineQueue: false,
});

redisClient.on("connect", () => {
  console.log(`✅ [Redis] Connected successfully → ${REDIS_HOST}:${REDIS_PORT}`);
});

redisClient.on("ready", () => {
  console.log(`✅ [Redis] Client is READY. Caching layer active.`);
});

redisClient.on("reconnecting", (delay) => {
  console.log(`[Redis] Reconnecting in ${delay}ms...`);
});

redisClient.on("close", () => {
  console.warn(`⚠️  [Redis] Connection closed.`);
});

redisClient.on("end", () => {
  console.warn(`⚠️  [Redis] Connection ended. No further retries.`);
});

redisClient.on("error", (err) => {
  if (err.code === "ECONNREFUSED") {
    // Suppress spammy logs after initial failures
  } else {
    console.error(`❌ [Redis] Error: ${err.message}`);
  }
});

export default redisClient;
