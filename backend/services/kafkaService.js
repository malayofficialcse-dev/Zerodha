import { Kafka } from "kafkajs";

// Configure Kafka client
const kafka = new Kafka({
  clientId: "zerodha-clone-backend",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

export const producer = kafka.producer({
  retry: { retries: 5 }
});
export const consumer = kafka.consumer({ groupId: "realtime-chart-group" });
const admin = kafka.admin();

let isProducerConnected = false;
let isConsumerConnected = false;

/**
 * Ensure the stock-ticks topic exists in Kafka.
 * Creates it if not already present.
 */
const ensureTopic = async () => {
  try {
    await admin.connect();
    const topics = await admin.listTopics();
    if (!topics.includes("stock-ticks")) {
      await admin.createTopics({
        topics: [{ topic: "stock-ticks", numPartitions: 1, replicationFactor: 1 }],
      });
      console.log("✅ Kafka topic 'stock-ticks' created.");
    } else {
      console.log("ℹ️ Kafka topic 'stock-ticks' already exists.");
    }
    await admin.disconnect();
  } catch (err) {
    console.warn("⚠️ Kafka admin topic check failed:", err.message);
  }
};

/**
 * Initialize Kafka Producer
 */
export const initKafkaProducer = async () => {
  try {
    // Ensure topic exists before connecting producer
    await ensureTopic();
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ Kafka Producer connected successfully.");
  } catch (err) {
    console.warn("⚠️ Kafka Producer connection failed. Will fallback to direct Socket.io emit.", err.message);
    isProducerConnected = false;
  }
};

import { getIO } from "../websockets/streamingServer.js";
import { checkAlerts } from "./alertEngine.js";

/**
 * Initialize Kafka Consumer and subscribe to stock ticks.
 * On failure, registers a fallback that reads directly via the publishTick path.
 */
export const initKafkaConsumer = async (onMessageCallback) => {
  try {
    await consumer.connect();
    isConsumerConnected = true;
    console.log("✅ Kafka Consumer connected successfully.");

    await consumer.subscribe({ topic: "stock-ticks", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const tickData = JSON.parse(message.value.toString());
          // Forward from Kafka → Socket.io → Frontend
          onMessageCallback(tickData);
        } catch (err) {
          console.error("[Kafka Consumer] Error processing message:", err.message);
        }
      },
    });
    console.log("✅ Kafka Consumer is now listening on 'stock-ticks' topic.");
  } catch (err) {
    console.warn("⚠️ Kafka Consumer initialization failed:", err.message);
    console.warn("⚠️ Falling back: ticks will be emitted directly via Socket.io.");
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
    }
    return;
  }

  // Kafka path: produce to topic; consumer will forward to Socket.io
  try {
    await producer.send({
      topic: "stock-ticks",
      messages: [{ value: JSON.stringify(tickData) }],
    });
  } catch (err) {
    console.error("[Kafka] Publish error:", err.message);
    // On publish failure, fallback to direct emit for this tick
    const io = getIO();
    if (io) {
      io.emit("tick", tickData);
      checkAlerts(tickData, (alert, currentPrice) => {
        io.emit("price-alert", { ...alert._doc, currentPrice });
      });
    }
  }
};
