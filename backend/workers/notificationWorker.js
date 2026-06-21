import { channel, NOTIFICATION_QUEUE } from "../services/rabbitMQClient.js";
import { sendEmail, sendTelegram } from "../services/notificationService.js";

let processedCount = 0;

/**
 * Start the notification consumer
 */
export const startNotificationWorker = async () => {
  if (!channel) {
    console.error("❌ [NotificationWorker] RabbitMQ channel not available. Worker NOT started.");
    console.warn("[NotificationWorker] 👉 Ensure RabbitMQ is running and initRabbitMQ() completed successfully.");
    return;
  }

  console.log(`[NotificationWorker] ✅ Starting consumer on queue '${NOTIFICATION_QUEUE}'...`);

  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const notification = JSON.parse(msg.content.toString());
        const { type, to, subject, message, chatId } = notification;

        processedCount++;
        console.log(`[NotificationWorker] 📬 Message #${processedCount} received → type='${type}'`,
          notification.symbol ? `symbol=${notification.symbol}` : "",
          notification.userId ? `userId=${notification.userId}` : "",
          to ? `to=${to}` : ""
        );

        if (type === "email") {
          console.log(`[NotificationWorker] 📧 Sending email to: ${to} | Subject: "${subject}"`);
          await sendEmail(to, subject, message);
          console.log(`[NotificationWorker] ✅ Email sent to ${to}`);
        } else if (type === "telegram") {
          console.log(`[NotificationWorker] ✈️  Sending Telegram message to chatId: ${chatId}`);
          await sendTelegram(chatId, message);
          console.log(`[NotificationWorker] ✅ Telegram message sent to ${chatId}`);
        } else if (type === "position-alert") {
          console.log(`[NotificationWorker] 🚨 Position alert → user=${notification.userId} symbol=${notification.symbol} limitType=${notification.limitType} triggerPrice=₹${notification.triggerPrice} P&L=₹${notification.pnl}`);
          const { getIO } = await import("../websockets/streamingServer.js");
          const io = getIO();
          if (io) {
            io.emit("position-alert", notification);
            console.log(`[NotificationWorker] ✅ position-alert emitted to all Socket.io clients.`);
          } else {
            console.warn("[NotificationWorker] ⚠️  Socket.io IO instance not available. position-alert NOT emitted.");
          }
        } else {
          console.warn(`[NotificationWorker] ⚠️  Unknown notification type: '${type}'. Skipping.`);
        }

        channel.ack(msg);
        console.log(`[NotificationWorker] ✅ Message #${processedCount} acknowledged.`);
      } catch (error) {
        console.error("[NotificationWorker] ❌ Error processing message:", error.message);
        channel.nack(msg, false, false);
        console.warn("[NotificationWorker] Message nacked (not requeued).");
      }
    }
  });

  console.log(`[NotificationWorker] ✅ Consumer registered on '${NOTIFICATION_QUEUE}'. Waiting for messages...`);
};
