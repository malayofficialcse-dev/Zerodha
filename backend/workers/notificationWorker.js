import { channel, NOTIFICATION_QUEUE } from "../services/rabbitMQClient.js";
import { sendEmail, sendTelegram } from "../services/notificationService.js";

/**
 * Start the notification consumer
 */
export const startNotificationWorker = async () => {
  if (!channel) {
    console.error("[NotificationWorker] RabbitMQ channel not available.");
    return;
  }

  console.log("[NotificationWorker] Waiting for messages in queue:", NOTIFICATION_QUEUE);

  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const notification = JSON.parse(msg.content.toString());
        const { type, to, subject, message, chatId } = notification;

        console.log(`[NotificationWorker] Processing ${type}`);

        if (type === "email") {
          await sendEmail(to, subject, message);
        } else if (type === "telegram") {
          await sendTelegram(chatId, message);
        } else if (type === "position-alert") {
          const { getIO } = await import("../websockets/streamingServer.js");
          const io = getIO();
          if (io) {
            console.log(`[NotificationWorker] Emitting position-alert for user ${notification.userId}: ${notification.symbol}`);
            io.emit("position-alert", notification);
          }
        }

        channel.ack(msg); // Acknowledge message processed
      } catch (error) {
        console.error("[NotificationWorker] Error processing message:", error.message);
        // Nack without requeue for now to avoid infinite loops on bad data
        channel.nack(msg, false, false);
      }
    }
  });
};
