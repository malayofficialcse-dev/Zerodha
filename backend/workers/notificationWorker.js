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

        console.log(`[NotificationWorker] Processing ${type} for ${to || chatId}`);

        if (type === "email") {
          await sendEmail(to, subject, message);
        } else if (type === "telegram") {
          await sendTelegram(chatId, message);
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
