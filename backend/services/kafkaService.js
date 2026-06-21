import { Kafka } from "kafkajs";

const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "localhost:9092";

console.log(`[Kafka] Initializing client. Brokers: ${KAFKA_BROKERS}`);

// Configure Kafka client
const kafka = new Kafka({
  clientId: "zerodha-clone-backend",
  brokers: [KAFKA_BROKERS],
  logCreator: () => (entry) => {
    const { namespace, level, label, log } = entry;
    const { message, ...extra } = log;
    const levelMap = { 0: "ERROR", 1: "WARN", 2: "INFO", 4: "DEBUG" };
    const lvl = levelMap[level] || "LOG";
    if (level <= 2) {
      console.log(`[Kafka][${lvl}][${namespace}] ${message}`, Object.keys(extra).length ? extra : "");
    }
  },
});

export const producer = kafka.producer({ retry: { retries: 5 } });
export const consumer = kafka.consumer({ groupId: "realtime-chart-group" });
const admin = kafka.admin();

let isProducerConnected = false;
let isConsumerConnected = false;
let publishCount = 0;

/**
 * Ensure the stock-ticks topic exists in Kafka.
 * Creates it if not already present.
 */
const ensureTopic = async () => {
  try {
    console.log("[Kafka][Admin] Connecting admin client to check topics...");
    await admin.connect();
    const topics = await admin.listTopics();
    console.log(`[Kafka][Admin] Existing topics: [${topics.join(", ")}]`);

    if (!topics.includes("stock-ticks")) {
      console.log("[Kafka][Admin] Topic 'stock-ticks' not found. Creating...");
      await admin.createTopics({
        topics: [{ topic: "stock-ticks", numPartitions: 1, replicationFactor: 1 }],
      });
      console.log("✅ [Kafka][Admin] Topic 'stock-ticks' created successfully.");
    } else {
      console.log("ℹ️  [Kafka][Admin] Topic 'stock-ticks' already exists. Skipping creation.");
    }
    await admin.disconnect();
    console.log("[Kafka][Admin] Admin client disconnected.");
  } catch (err) {
    console.warn("⚠️  [Kafka][Admin] Topic check/creation failed:", err.message);
    console.warn("[Kafka][Admin] Is Kafka / Zookeeper running on", KAFKA_BROKERS, "?");
  }
};

/**
 * Initialize Kafka Producer
 */
export const initKafkaProducer = async () => {
  try {
    console.log("[Kafka][Producer] Ensuring topic exists before connecting producer...");
    await ensureTopic();

    console.log("[Kafka][Producer] Connecting producer...");
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ [Kafka][Producer] Connected successfully. Ready to publish ticks.");
  } catch (err) {
    console.warn("⚠️  [Kafka][Producer] Connection FAILED:", err.message);
    console.warn("[Kafka][Producer] 👉 Fallback mode: ticks will be emitted directly via Socket.io (no Kafka).");
    isProducerConnected = false;
  }
};

import { getIO } from "../websockets/streamingServer.js";
import { checkAlerts, checkIntradayAlerts } from "./alertEngine.js";

/**
 * Initialize Kafka Consumer and subscribe to stock ticks.
 * On failure, registers a fallback that reads directly via the publishTick path.
 */
export const initKafkaConsumer = async (onMessageCallback) => {
  try {
    console.log("[Kafka][Consumer] Connecting consumer (groupId: realtime-chart-group)...");
    await consumer.connect();
    isConsumerConnected = true;
    console.log("✅ [Kafka][Consumer] Connected successfully.");

    console.log("[Kafka][Consumer] Subscribing to topic 'stock-ticks' (fromBeginning: false)...");
    await consumer.subscribe({ topic: "stock-ticks", fromBeginning: false });
    console.log("✅ [Kafka][Consumer] Subscribed to 'stock-ticks'.");

    let msgCount = 0;
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const tickData = JSON.parse(message.value.toString());
          msgCount++;
          if (msgCount % 100 === 0) {
            console.log(`[Kafka][Consumer] Processed ${msgCount} messages. Latest: ${tickData.symbol} @ ₹${tickData.close}`);
          }
          // Forward from Kafka → Socket.io → Frontend
          onMessageCallback(tickData);
        } catch (err) {
          console.error("[Kafka][Consumer] Error processing message:", err.message);
        }
      },
    });
    console.log("✅ [Kafka][Consumer] Listening on 'stock-ticks' topic. Pipeline: Kafka → Socket.io → Frontend");
  } catch (err) {
    console.warn("⚠️  [Kafka][Consumer] Initialization FAILED:", err.message);
    console.warn("⚠️  [Kafka][Consumer] 👉 Fallback mode active: ticks go directly Socket.io → Frontend (bypassing Kafka).");
    isConsumerConnected = false;
    // Mark producer as disconnected too so publishTick falls back to direct emit
    isProducerConnected = false;
  }
};

/**
 * Helper to publish a tick.
 * - If Kafka producer is connected: sends to 'stock-ticks' topic (consumer picks it up → Socket.io)
 * - If Kafka is NOT connected: emits directly to Socket.io (graceful fallback)
 */
export const publishTick = async (tickData) => {
  // FALLBACK: If Kafka producer or consumer is not connected, emit directly to socket.io
  if (!isProducerConnected) {
    const io = getIO();
    if (io) {
      io.emit("tick", tickData);

      // Also check alerts in fallback mode
      checkAlerts(tickData, (alert, currentPrice) => {
        io.emit("price-alert", {
          ...alert._doc,
          currentPrice,
        });
      });

      // Check intraday stop-loss / target in fallback mode
      checkIntradayAlerts(tickData);
    }
    return;
  }

  // Kafka path: produce to topic; consumer will forward to Socket.io
  try {
    await producer.send({
      topic: "stock-ticks",
      messages: [{ value: JSON.stringify(tickData) }],
    });
    publishCount++;
    if (publishCount % 500 === 0) {
      console.log(`[Kafka][Producer] Published ${publishCount} tick messages to 'stock-ticks' topic.`);
    }
  } catch (err) {
    console.error("[Kafka][Producer] Publish error:", err.message);
    // On publish failure, fallback to direct emit for this tick
    const io = getIO();
    if (io) {
      io.emit("tick", tickData);
      checkAlerts(tickData, (alert, currentPrice) => {
        io.emit("price-alert", { ...alert._doc, currentPrice });
      });
      checkIntradayAlerts(tickData);
    }
  }
};
