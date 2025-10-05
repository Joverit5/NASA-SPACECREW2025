import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

// ====== Importar Chat ======
import { ChatGateway } from "./chat/chat.gateway";
import { chatRouter, chatService } from "./chat/chat.controller";

// ====== Importar Game ======
import { GameController } from "./game/game.controller";
import { GameService } from "./game/game.service";

const app = express();
app.use(express.json());

// ====== Configuración de CORS ======
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// ====== Rutas API ======
app.use("/api/chat", chatRouter);

// ====== Servir archivos estáticos ======
const backendPath = path.join(__dirname, "../");
app.use(express.static(backendPath));
console.log(`📁 Sirviendo archivos estáticos desde: ${backendPath}`);

// ====== Crear servidor HTTP + Socket ======
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// ====== Inicializar Chat Gateway ======
new ChatGateway(io, chatService);
console.log("💬 Chat Gateway inicializado");

// ====== Inicializar Game Service y Gateway ======
const gameService = new GameService();
gameService.setIoInstance(io);

io.on("connection", (socket) => {
  console.log(`🎮 Player conectado: ${socket.id}`);
  const gameController = new GameController(io, gameService);
  gameController.registerHandlers(socket);
});

// ====== Ruta principal: unir chat + multiplayer ======
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "../src/combined.html");
  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error("❌ Error sirviendo HTML combinado:", err);
      res.status(500).send(`
        <h1>🚀 NASA-SPACECREW2025</h1>
        <p>Servidor corriendo en puerto 4000</p>
        <p>No se encontró el archivo combined.html</p>
        <p>Ubicación esperada: <code>${htmlPath}</code></p>
      `);
    }
  });
});

// ====== Health check ======
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    port: 4000,
    timestamp: new Date().toISOString(),
  });
});

// ====== Iniciar servidor ======
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 NASA-SPACECREW2025 BACKEND UNIFICADO ║
╠════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  URL: http://localhost:${PORT}              ║
║  Health: http://localhost:${PORT}/health    ║
║  HTML: http://localhost:${PORT}/            ║
╚════════════════════════════════════════╝
  `);
});

// ====== Manejo de errores ======
process.on("SIGINT", () => {
  console.log("\n👋 Cerrando servidor...");
  httpServer.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});
