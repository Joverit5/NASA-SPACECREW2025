import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import path from "path"
import { GameService } from "./services/game.service"

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

const gameService = new GameService()
gameService.setIoInstance(io)

// Serve static files
app.use(express.static(path.join(__dirname, "../public")))

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`)

  // Create or join session
  socket.on("create_session", ({ sessionId, playerName }) => {
    const session = gameService.createSession(sessionId, socket.id, playerName)
    socket.join(sessionId)

    socket.emit("join_success", {
      sessionId,
      playerId: socket.id,
      playerName,
      isHost: true,
      player: Array.from(session.players.values()).find((p) => p.id === socket.id),
      sessionState: gameService.getSessionState(sessionId),
    })

    console.log(`Session created: ${sessionId} by ${playerName}`)
  })

  socket.on("join_session", ({ sessionId, player }) => {
    const result = gameService.joinSession(sessionId, socket.id, player.name)

    if (!result.success) {
      socket.emit("join_rejected", {
        message:
          result.reason === "room_full"
            ? "Room is full (max 5 players)"
            : result.reason === "name_taken"
              ? "Name already taken"
              : result.reason === "session_not_found"
                ? "Session not found"
                : "Cannot join session",
        reason: result.reason,
      })
      return
    }

    socket.join(sessionId)

    const sessionState = gameService.getSessionState(sessionId)

    socket.emit("join_success", {
      sessionId,
      playerId: socket.id,
      playerName: player.name,
      isHost: result.player?.isHost || false,
      player: result.player,
      sessionState,
    })

    socket.to(sessionId).emit("player_joined", {
      player: result.player,
      sessionState, // Include full state for sync
    })

    // Send chat history
    if (sessionState?.chatHistory) {
      socket.emit("chat_history", sessionState.chatHistory)
    }

    console.log(`Player ${player.name} joined session ${sessionId}`)
  })

  // Area management
  socket.on("place_area", ({ sessionId, area }) => {
    const result = gameService.placeArea(sessionId, socket.id, area)

    if (result.success && result.area) {
      io.to(sessionId).emit("area_placed", { area: result.area })
    } else {
      socket.emit("place_error", { reason: "not_host" })
    }
  })

  socket.on("update_area", ({ sessionId, areaId, updates }) => {
    const success = gameService.updateArea(sessionId, socket.id, areaId, updates)

    if (success) {
      io.to(sessionId).emit("area_updated", { areaId, updates })
    }
  })

  socket.on("remove_area", ({ sessionId, areaId }) => {
    const success = gameService.removeArea(sessionId, socket.id, areaId)

    if (success) {
      io.to(sessionId).emit("area_removed", { areaId })
    }
  })

  // Player movement
  socket.on("player_move", ({ sessionId, x, y, direction }) => {
    const success = gameService.updatePlayerPosition(sessionId, socket.id, x, y, direction)

    if (success) {
      socket.to(sessionId).emit("player_moved", {
        playerId: socket.id,
        x,
        y,
        direction,
      })
    }
  })

  // Chat
  socket.on("chat_message", ({ sessionId, text }) => {
    const result = gameService.addChatMessage(sessionId, socket.id, text)

    if (result.success && result.message) {
      io.to(sessionId).emit("chat_message_broadcast", result.message)
    }
  })

  // Mission start
  socket.on("start_mission", ({ sessionId }) => {
    const success = gameService.startMission(sessionId, socket.id)

    if (success) {
      io.to(sessionId).emit("mission_started", {
        timestamp: Date.now(),
      })
    }
  })

  // Disconnect
  socket.on("disconnect", () => {
    // Find and remove player from all sessions
    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id)

    rooms.forEach((sessionId) => {
      const session = gameService.getSession(sessionId)
      if (session) {
        const player = session.players.get(socket.id)
        if (player) {
          gameService.removePlayer(sessionId, socket.id)
          socket.to(sessionId).emit("player_left", {
            playerId: socket.id,
            playerName: player.name,
          })
        }
      }
    })

    console.log(`Player disconnected: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
