import { sendEmail, sendTelegram } from "../services/notificationService.js";
import dotenv from "dotenv";

dotenv.config();

const testNotifications = async () => {
  console.log("🚀 Starting Notification Service Test...");

  const testMessage = `🔔 <b>TEST ALERT</b>\n\nStock: <b>RELIANCE</b>\nCondition: <b>above</b>\nTarget: <b>₹2500</b>\nActual Price: <b>₹2505</b>\nTime: ${new Date().toLocaleString()}`;

  // 1. Test Telegram
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TEST_TELEGRAM_CHAT_ID) {
    console.log("Testing Telegram...");
    try {
      await sendTelegram(process.env.TEST_TELEGRAM_CHAT_ID, testMessage);
      console.log("✅ Telegram test successful!");
    } catch (err) {
      console.error("❌ Telegram test failed:", err.message);
    }
  } else {
    console.warn("⚠️ Telegram test skipped: TELEGRAM_BOT_TOKEN or TEST_TELEGRAM_CHAT_ID missing in .env");
  }

  // 2. Test Email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.TEST_EMAIL_TO) {
    console.log("Testing Email...");
    try {
      await sendEmail(process.env.TEST_EMAIL_TO, "Test Price Alert", testMessage.replace(/<[^>]*>/g, ""));
      console.log("✅ Email test successful!");
    } catch (err) {
      console.error("❌ Email test failed:", err.message);
    }
  } else {
    console.warn("⚠️ Email test skipped: SMTP credentials or TEST_EMAIL_TO missing in .env");
  }

  console.log("🏁 Test completed.");
};

testNotifications();
