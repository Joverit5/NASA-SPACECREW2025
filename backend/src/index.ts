import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ChatGateway } from "./chat/chat.gateway";

const app = express();
const httpServer = createServer(app);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Se recomienda en dev todo abierto, en prod restringir
  },
});

// Inicializar gateway de chat
new ChatGateway(io);

httpServer.listen(4000, () => {
  console.log("Backend corriendo en http://localhost:4000");
});
