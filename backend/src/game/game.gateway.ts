import { Server } from "socket.io"
import type * as http from "http"
import { GameController } from "./game.controller"
import { GameService } from "./game.service"

export function createGameGateway(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  const gameService = new GameService()
  gameService.setIoInstance(io)

  io.on("connection", (socket) => {
    console.log(`🟢 Player connected: ${socket.id}`)
    
    const controller = new GameController(io, gameService)
    controller.registerHandlers(socket)

    // Send initial connection confirmation
    socket.emit("connected", {
      playerId: socket.id,
      timestamp: Date.now(),
    })
  })

  // Cleanup on server shutdown
  process.on("SIGTERM", () => {
    console.log("🔴 Server shutting down...")
    io.close(() => {
      console.log("✅ All connections closed")
    })
  })

  console.log("✅ Game Gateway initialized")
  return io
}