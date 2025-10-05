/*import express from "express";
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
  res.send("🚀 Servidor backend de NASA-SPATIUM funcionando correctamente!");
});
*/
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

// Importaciones opcionales con manejo de errores
let ChatGateway, chatRouter, chatService;
try {
  const chatModule = require("./chat/chat.gateway");
  const chatController = require("./chat/chat.controller");
  ChatGateway = chatModule.ChatGateway;
  chatRouter = chatController.chatRouter;
  chatService = chatController.chatService;
} catch (error) {
  console.log("⚠️  Chat module no encontrado, continuando sin chat...");
}

// Importar Game modules
import { GameController } from "./game/game.controller";
import { GameService } from "./game/game.service";

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// Rutas de API (solo si existe chat)
if (chatRouter) {
  app.use("/api/chat", chatRouter);
}

// Servir archivos estáticos desde backend/ (donde está multiplayer.html)
// __dirname está en backend/src/, entonces subimos un nivel para llegar a backend/
const backendPath = path.join(__dirname, "../");
app.use(express.static(backendPath));

console.log(`📁 Sirviendo archivos estáticos desde: ${backendPath}`);

// Crear servidor HTTP
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Inicializar Chat Gateway (si existe)
if (ChatGateway && chatService) {
  try {
    new ChatGateway(io, chatService);
    console.log("✅ Chat Gateway inicializado");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error inicializando Chat:", error.message);
    } else {
      console.error("❌ Error inicializando Chat:", error);
    }
  }
}

// Inicializar Game Service
const gameService = new GameService();
gameService.setIoInstance(io);

// Inicializar Game Gateway
io.on("connection", (socket) => {
  console.log(`🎮 Player connected: ${socket.id}`);
  
  try {
    const gameController = new GameController(io, gameService);
    gameController.registerHandlers(socket);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error registrando handlers para ${socket.id}:`, error.message);
    } else {
      console.error(`❌ Error registrando handlers para ${socket.id}:`, error);
    }
  }
});

// Ruta principal - servir multiplayer.html
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "../src/multiplayer.html");
  console.log(`📄 Intentando servir: ${htmlPath}`);
  
  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error("❌ Error sirviendo HTML:", err);
      res.status(500).send(`
        <h1>🚀 Servidor backend de NASA-SPACECREW2025</h1>
        <p>Servidor funcionando en puerto 4000</p>
        <p><strong>Error:</strong> No se encontró multiplayer.html en backend/</p>
        <p>Ubicación esperada: <code>${htmlPath}</code></p>
        <p>Conéctate desde tu cliente a: <code>http://localhost:4000</code></p>
      `);
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    port: 4000,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Backend NASA-SPACECREW2025         ║
╠════════════════════════════════════════╣
║  Puerto: ${PORT}                            ║
║  URL: http://localhost:${PORT}              ║
║  Health: http://localhost:${PORT}/health    ║
║  HTML: http://localhost:${PORT}/            ║
╚════════════════════════════════════════╝
  `);
  console.log(`\n💡 Abre tu navegador en: http://localhost:${PORT}\n`);
});

// Manejo de errores globales
process.on("uncaughtException", (error) => {
  console.error("❌ Error no capturado:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada no manejada:", reason);
});

process.on("SIGINT", () => {
  console.log("\n👋 Cerrando servidor...");
  httpServer.close(() => {
    console.log("✅ Servidor cerrado");
    process.exit(0);
  });
});