import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const NOTIFICATION_QUEUE = "notifications";

let connection = null;
let channel = null;

/**
 * Initialize RabbitMQ connection and channel
 */
export const initRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue(NOTIFICATION_QUEUE, {
      durable: true // Queue survives broker restart
    });
    
    console.log("✅ RabbitMQ connected and notification queue ready");
    
    connection.on("error", (err) => {
      console.error("❌ RabbitMQ Connection Error:", err.message);
      setTimeout(initRabbitMQ, 5000); // Reconnect on failure
    });
    
    connection.on("close", () => {
      console.warn("⚠️ RabbitMQ Connection closed. Retrying...");
      setTimeout(initRabbitMQ, 5000);
    });
    
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error.message);
    setTimeout(initRabbitMQ, 5000);
  }
};

/**
 * Publish a message to the notification queue
 * @param {Object} message The notification data
 */
export const publishNotification = async (message) => {
  if (!channel) {
    console.warn("[RabbitMQ] Channel not initialized. Message dropped.");
    return false;
  }
  
  try {
    const buffer = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(NOTIFICATION_QUEUE, buffer, {
      persistent: true // Message survives broker restart
    });
    return true;
  } catch (error) {
    console.error("[RabbitMQ] Publish error:", error.message);
    return false;
  }
};

export { channel, NOTIFICATION_QUEUE };
