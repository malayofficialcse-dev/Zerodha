import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
export const NOTIFICATION_QUEUE = "notifications";

let connection = null;
let channel = null;
let publishedCount = 0;

console.log(`[RabbitMQ] Configured URL: ${RABBITMQ_URL.replace(/:\/\/.*@/, "://***@")}`);
console.log(`[RabbitMQ] Queue: '${NOTIFICATION_QUEUE}'`);

/**
 * Initialize RabbitMQ connection and channel
 */
export const initRabbitMQ = async () => {
  try {
    console.log("[RabbitMQ] Attempting to connect...");
    connection = await amqp.connect(RABBITMQ_URL);
    console.log("✅ [RabbitMQ] Connection established successfully.");

    console.log("[RabbitMQ] Creating channel...");
    channel = await connection.createChannel();
    console.log("✅ [RabbitMQ] Channel created.");

    console.log(`[RabbitMQ] Asserting queue '${NOTIFICATION_QUEUE}' (durable: true)...`);
    const queueInfo = await channel.assertQueue(NOTIFICATION_QUEUE, {
      durable: true, // Queue survives broker restart
    });
    console.log(`✅ [RabbitMQ] Queue '${NOTIFICATION_QUEUE}' ready. Messages: ${queueInfo.messageCount}, Consumers: ${queueInfo.consumerCount}`);

    connection.on("error", (err) => {
      console.error("❌ [RabbitMQ] Connection error:", err.message);
      channel = null;
      connection = null;
      console.log("[RabbitMQ] Scheduling reconnect in 5s...");
      setTimeout(initRabbitMQ, 5000);
    });

    connection.on("close", () => {
      console.warn("⚠️  [RabbitMQ] Connection closed unexpectedly. Retrying in 5s...");
      channel = null;
      connection = null;
      setTimeout(initRabbitMQ, 5000);
    });

    console.log("✅ [RabbitMQ] Fully initialized. Notification pipeline ready.");
  } catch (error) {
    console.error("❌ [RabbitMQ] Connection FAILED:", error.message);
    console.warn("[RabbitMQ] 👉 Is RabbitMQ running? Check if the service is up on localhost:5672");
    console.warn("[RabbitMQ] Retrying in 5s...");
    setTimeout(initRabbitMQ, 5000);
  }
};

/**
 * Publish a message to the notification queue
 * @param {Object} message The notification data
 */
export const publishNotification = async (message) => {
  if (!channel) {
    console.warn("[RabbitMQ] ⚠️  Channel not initialized. Message DROPPED:", message.type || "unknown");
    return false;
  }

  try {
    const buffer = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(NOTIFICATION_QUEUE, buffer, {
      persistent: true, // Message survives broker restart
    });
    publishedCount++;
    console.log(`[RabbitMQ] ✅ Published message #${publishedCount} → type='${message.type}' queue='${NOTIFICATION_QUEUE}'`,
      message.symbol ? `symbol=${message.symbol}` : "",
      message.userId ? `userId=${message.userId}` : ""
    );
    return true;
  } catch (error) {
    console.error("[RabbitMQ] ❌ Publish error:", error.message, "| message type:", message.type);
    return false;
  }
};

export { channel };
