import nodemailer from "nodemailer";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send an email notification
 * @param {string} to Receiver email
 * @param {string} subject Email subject
 * @param {string} text Email body
 */
export const sendEmail = async (to, subject, text) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[NotificationService] SMTP credentials missing. Email skipped.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    console.log(`[NotificationService] Email sent to ${to}`);
  } catch (error) {
    console.error("[NotificationService] Email error:", error.message);
  }
};

/**
 * Send a Telegram notification
 * @param {string} chatId Telegram Chat ID
 * @param {string} message Message text
 */
export const sendTelegram = async (chatId, message) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("[NotificationService] TELEGRAM_BOT_TOKEN missing. Telegram skipped.");
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const data = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: "HTML"
  });

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[NotificationService] Telegram message sent to ${chatId}`);
          resolve(JSON.parse(responseBody));
        } else {
          console.error(`[NotificationService] Telegram error ${res.statusCode}:`, responseBody);
          reject(new Error(`Telegram API error: ${res.statusCode}`));
        }
      });
    });

    req.on("error", (err) => {
      console.error("[NotificationService] Telegram request error:", err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};
