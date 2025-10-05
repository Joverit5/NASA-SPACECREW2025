import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ChatGateway } from "./chat/chat.gateway";
import { chatRouter, chatService } from "./chat/chat.controller";

const app = express();
app.use(express.json());
app.use("/api/chat", chatRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Inicializar Gateway con el servicio compartido
new ChatGateway(io, chatService);

httpServer.listen(4000, () => {
  console.log("Backend corriendo en http://localhost:4000");
});

app.get("/", (req, res) => {
  res.send("🚀 Servidor backend de NASA-SPACECREW2025 funcionando correctamente!");
});
