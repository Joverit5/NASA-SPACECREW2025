import type { Server, Socket } from "socket.io"
import type { GameService } from "./game.service"

export class GameController {
  constructor(
    private io: Server,
    private gameService: GameService,
  ) {}

  registerHandlers(socket: Socket) {
    console.log(`🔌 Handlers registered for: ${socket.id}`)

    // Create a new session (host only)
    socket.on("create_session", (data: { sessionId: string; playerName: string }) => {
      const { sessionId, playerName } = data

      // Check if session already exists
      let session = this.gameService.getSession(sessionId)
      if (session) {
        socket.emit("join_rejected", {
          reason: "session_exists",
          message: "La sesión ya existe",
        })
        return
      }

      // Create session with this player as host
      session = this.gameService.createSession(sessionId, socket.id, 5)
      const playerState = this.gameService.addPlayer(sessionId, socket.id, playerName)

      if (!playerState) {
        socket.emit("join_rejected", {
          reason: "error",
          message: "Error al crear la sesión",
        })
        return
      }

      socket.join(sessionId)

      socket.emit("join_success", {
        playerId: socket.id,
        playerName: playerState.name,
        sessionId,
        isHost: true,
        player: {
          id: playerState.id,
          name: playerState.name,
          role: playerState.role.name,
        },
      })

      console.log(`✅ Session created: ${sessionId} by ${playerName}`)
    })

    // Join an existing session
    socket.on("join_session", (data: { sessionId: string; player: { name: string } }) => {
      const { sessionId, player } = data

      let session = this.gameService.getSession(sessionId)

      // If session doesn't exist, try to create it (for backwards compatibility)
      if (!session) {
        session = this.gameService.createSession(sessionId, socket.id, 5)
      }

      const playerState = this.gameService.addPlayer(sessionId, socket.id, player.name)

      if (!playerState) {
        if (session && Object.keys(session.players).length >= session.maxPlayers) {
          socket.emit("join_rejected", {
            reason: "room_full",
            message: "La sala está llena (máximo 5 jugadores)",
          })
        } else {
          socket.emit("join_rejected", {
            reason: "name_taken",
            message: "Ese nombre ya está en uso",
          })
        }
        return
      }

      socket.join(sessionId)

      socket.emit("join_success", {
        playerId: socket.id,
        playerName: playerState.name,
        sessionId,
        isHost: playerState.isHost,
        player: {
          id: playerState.id,
          name: playerState.name,
          role: playerState.role.name,
        },
      })

      const chatHistory = this.gameService.getChatHistory(sessionId)
      socket.emit("chat_history", chatHistory)

      // Notify others and send current session state
      socket.to(sessionId).emit("player_joined", {
        player: {
          id: socket.id,
          name: playerState.name,
          role: playerState.role.name,
        },
        sessionState: {
          areas: session.areas,
          players: Object.values(session.players),
        },
      })

      this.gameService.broadcastSessionState(sessionId, this.io)
    })

    // Get current session state
    socket.on("get_session", (data: { sessionId: string }) => {
      const { sessionId } = data
      this.gameService.broadcastSessionState(sessionId, this.io)
    })

    // Player movement
    socket.on("player:move", (data: { sessionId?: string; dx: number; dy: number; direction: string }) => {
      const sessionId = data.sessionId || this.gameService.findPlayerSession(socket.id)
      if (!sessionId) return

      const moved = this.gameService.updatePlayer(sessionId, socket.id, {
        dx: data.dx,
        dy: data.dy,
        direction: data.direction,
      })

      if (moved) {
        const session = this.gameService.getSession(sessionId)
        const player = session?.players[socket.id]
        
        if (player) {
          // Emit individual player_moved event
          socket.to(sessionId).emit("player_moved", {
            playerId: socket.id,
            x: Math.round(player.x / 32), // Convert to tile coordinates
            y: Math.round(player.y / 32),
            direction: player.direction,
          })
        }
      }
    })

    // Place area
    socket.on("place_area", (data: { sessionId: string; area: any }) => {
      const { sessionId, area } = data
      const placedArea = this.gameService.placeArea(sessionId, area, socket.id)

      if (placedArea) {
        // Emit area_placed to all clients
        this.io.to(sessionId).emit("area_placed", {
          area: placedArea,
        })
        
        this.gameService.broadcastSessionState(sessionId, this.io)
      } else {
        const session = this.gameService.getSession(sessionId)
        const player = session?.players[socket.id]
        
        if (!player?.isHost) {
          socket.emit("place_error", {
            reason: "not_host",
            message: "Solo el host puede colocar áreas",
          })
        } else {
          socket.emit("place_error", {
            reason: "cannot_place",
            message: "No se puede colocar el área aquí",
          })
        }
      }
    })

    // Update area
    socket.on("update_area", (data: { sessionId: string; areaId: string; updates: any }) => {
      const { sessionId, areaId, updates } = data
      const updatedArea = this.gameService.updateArea(sessionId, areaId, updates, socket.id)

      if (updatedArea) {
        // Emit area_updated to all clients
        this.io.to(sessionId).emit("area_updated", {
          areaId: areaId,
          updates: updates,
        })
        
        this.gameService.broadcastSessionState(sessionId, this.io)
      } else {
        socket.emit("update_error", {
          reason: "cannot_update",
          message: "No se puede actualizar el área",
        })
      }
    })

    // Remove area
    socket.on("remove_area", (data: { sessionId: string; areaId: string }) => {
      const { sessionId, areaId } = data
      const success = this.gameService.removeArea(sessionId, areaId, socket.id)

      if (success) {
        // Emit area_removed to all clients
        this.io.to(sessionId).emit("area_removed", {
          areaId: areaId,
        })
        
        this.gameService.broadcastSessionState(sessionId, this.io)
      } else {
        socket.emit("remove_error", {
          reason: "cannot_remove",
          message: "No se puede eliminar el área",
        })
      }
    })

    // Chat message
    socket.on("chat_message", (data: { sessionId: string; playerId: string; text: string }) => {
      const { sessionId, text } = data

      const message = this.gameService.addChatMessage(sessionId, socket.id, text)

      if (message) {
        this.io.to(sessionId).emit("chat_message_broadcast", message)
      } else {
        socket.emit("chat_error", {
          message: "No se pudo enviar el mensaje",
        })
      }
    })

    // Start mission
    socket.on("start_mission", (data: { sessionId: string }) => {
      const { sessionId } = data
      const success = this.gameService.startMission(sessionId, socket.id)

      if (success) {
        this.io.to(sessionId).emit("mission_started", {
          sessionId,
          timestamp: Date.now(),
        })
        this.gameService.broadcastSessionState(sessionId, this.io)
      } else {
        socket.emit("mission_error", {
          message: "No se puede iniciar la misión",
        })
      }
    })

    // Disconnect
    socket.on("disconnect", () => {
      const sessionId = this.gameService.findPlayerSession(socket.id)
      if (!sessionId) return

      const session = this.gameService.getSession(sessionId)
      const player = session?.players[socket.id]
      const playerName = player?.name || "Unknown"

      this.gameService.removePlayer(sessionId, socket.id)

      socket.to(sessionId).emit("player_left", {
        id: socket.id,
        name: playerName,
        playerName: playerName,
      })

      if (this.gameService.getSession(sessionId)) {
        this.gameService.broadcastSessionState(sessionId, this.io)
      }
    })
  }
}

export default GameController