import { Server } from "socket.io";
import { initKafkaConsumer } from "../services/kafkaService.js";
import { checkAlerts } from "../services/alertEngine.js";

let io;

export const initStreamingServer = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://zerodha-3-2n76.onrender.com",
        "https://zerodha-4-giue.onrender.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket Client disconnected:", socket.id);
    });
  });


  // Start consuming from Kafka and pipe it directly to all connected socket clients
  await initKafkaConsumer((tickData) => {
    // 1. Live price streaming to charts/dashboard
    if (io) {
      // console.log(`[Socket] Broadcasting tick for ${tickData.symbol}`);
      io.emit("tick", tickData);
    }

    // 2. Real-time alert engine
    checkAlerts(tickData, (alert, currentPrice) => {
      if (io) {
        io.emit("price-alert", {
          ...alert._doc,
          currentPrice,
        });
      }
    });
  });


  console.log("WebSocket Streaming Server initialized and bound to Kafka Consumer.");
};

export const getIO = () => io;
