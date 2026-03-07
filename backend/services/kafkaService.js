import { Kafka } from "kafkajs";

// Configure Kafka client
// Adjust clientId and brokers based on your exact environment if needed, defaulting to standard local setup.
const kafka = new Kafka({
  clientId: "zerodha-clone-backend",
  brokers: ["localhost:9092"], // Standard fallback, assuming local running instance
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "realtime-chart-group" });

let isProducerConnected = false;
let isConsumerConnected = false;

/**
 * Initialize Kafka Producer
 */
export const initKafkaProducer = async () => {
  try {
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ Kafka Producer connected successfully.");
  } catch (err) {
    console.warn("⚠️ Kafka Producer connection failed. Real-time ticks disabled.");
    isProducerConnected = false;
  }
};

/**
 * Initialize Kafka Consumer and subscribe to stock ticks
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
          onMessageCallback(tickData);
        } catch (err) {
          console.error("Error processing Kafka message:", err.message);
        }
      },
    });
  } catch (err) {
    console.warn("⚠️ Kafka Consumer initialization failed. Real-time streams to frontend disabled.");
    isConsumerConnected = false;
  }
};

import { getIO } from "../websockets/streamingServer.js";

import { checkAlerts } from "./alertEngine.js";

/**
 * Helper to publish a tick
 */
export const publishTick = async (tickData) => {
  // FALLBACK: If Kafka is not connected, emit directly to socket.io
  // This ensures the dashboard is LIVE even without Kafka setup locally.
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

  try {
    await producer.send({
      topic: "stock-ticks",
      messages: [{ value: JSON.stringify(tickData) }],
    });
  } catch (err) {
    console.error("Kafka publish error (Topic possibly not ready):", err.message);
  }
};
