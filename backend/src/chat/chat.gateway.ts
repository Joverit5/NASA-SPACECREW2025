import type { Server, Socket } from "socket.io"
import type { ChatMessage } from "./chat.types"
import { ChatService } from "./chat.service"
import { v4 as uuidv4 } from "uuid"

export class ChatGateway {
  private io: Server
  private chatService: ChatService
  private socketPlayerMap: Map<string, { sessionId: string; playerId: string; playerName: string }> = new Map()

  constructor(io: Server, chatService?: ChatService) {
    this.io = io
    this.chatService = chatService ?? new ChatService()

    this.io.on("connection", (socket: Socket) => {
      console.log(`🛰️ Nuevo cliente conectado: ${socket.id}`)

      // 🔹 Evento: Unirse a sala
      socket.on("join_session", ({ sessionId, player }) => {
        try {
          if (!sessionId || !player?.name || typeof player.name !== "string") {
            socket.emit("chat_error", { message: "Datos de sesión inválidos" })
            socket.disconnect(true)
            return
          }

          const playerName = player.name.trim()

          if (playerName.length === 0 || playerName.length > 20) {
            socket.emit("chat_error", { message: "Nombre debe tener entre 1 y 20 caracteres" })
            socket.disconnect(true)
            return
          }

          const currentPlayerCount = this.chatService.getPlayerCount(sessionId)
          if (currentPlayerCount >= 5) {
            socket.emit("join_rejected", {
              message: "La sala está llena (máximo 5 jugadores)",
              reason: "room_full",
            })
            setTimeout(() => socket.disconnect(true), 100)
            return
          }

          if (this.chatService.isNameTaken(sessionId, playerName)) {
            socket.emit("join_rejected", {
              message: "Ese nombre ya está ocupado, intente de nuevo.",
              reason: "name_taken",
            })
            return
          }

          const playerId = player.id || uuidv4()

          this.chatService.addPlayer(sessionId, playerId, playerName)

          this.socketPlayerMap.set(socket.id, { sessionId, playerId, playerName })

          // Unirse a la sala
          socket.join(sessionId)
          console.log(`✅ ${playerName} (${playerId}) se unió a la sala ${sessionId}`)

          // Enviar historial de mensajes solo a este jugador
          const history = this.chatService.getMessages(sessionId)
          socket.emit("chat_history", history)

          socket.emit("join_success", { playerId, playerName, sessionId })

          // Notificar a los demás jugadores
          socket.to(sessionId).emit("player_joined", {
            playerId,
            name: playerName,
          })
        } catch (err) {
          console.error("❌ Error al unirse a la sala:", err)
          socket.emit("chat_error", { message: "Error al unirse a la sala" })
          socket.disconnect(true)
        }
      })

      // 💬 Evento: Enviar mensaje
      socket.on("chat_message", ({ sessionId, playerId, text }) => {
        try {
          if (!sessionId || !playerId || !text || typeof text !== "string") {
            console.warn(`⚠️ Mensaje inválido de ${socket.id}`)
            return
          }

          const cleanText = text.trim()

          if (cleanText.length === 0 || cleanText.length > 500) {
            socket.emit("chat_error", { message: "Mensaje debe tener entre 1 y 500 caracteres" })
            return
          }

          if (!this.chatService.isPlayerRegistered(sessionId, playerId)) {
            console.warn(`⚠️ Jugador no registrado intentó enviar mensaje: ${playerId}`)
            socket.emit("chat_error", { message: "No estás registrado en esta sala" })
            socket.disconnect(true)
            return
          }

          const socketInfo = this.socketPlayerMap.get(socket.id)
          if (!socketInfo || socketInfo.playerId !== playerId || socketInfo.sessionId !== sessionId) {
            console.warn(`⚠️ Inconsistencia en socket mapping: ${socket.id}`)
            socket.emit("chat_error", { message: "Sesión inválida" })
            socket.disconnect(true)
            return
          }

          const player = this.chatService.getPlayer(sessionId, playerId)

          const msg: ChatMessage = {
            playerId,
            playerName: player.name,
            text: cleanText,
            time: new Date().toISOString(),
          }

          this.chatService.addMessage(sessionId, msg)

          this.io.to(sessionId).emit("chat_message_broadcast", msg)

          console.log(`💬 [${sessionId}] ${player.name}: ${cleanText}`)
        } catch (err) {
          console.error("❌ Error al enviar mensaje:", err)
          socket.emit("chat_error", { message: "Error al enviar mensaje" })
        }
      })

      // 🔴 Evento: Desconexión
      socket.on("disconnect", () => {
        const info = this.socketPlayerMap.get(socket.id)
        if (info) {
          console.log(`🚪 Cliente desconectado: ${socket.id} (${info.playerName})`)

          this.chatService.removePlayer(info.sessionId, info.playerId)

          this.io.to(info.sessionId).emit("player_left", {
            playerId: info.playerId,
            name: info.playerName,
          })

          this.socketPlayerMap.delete(socket.id)
        } else {
          console.log(`🚪 Cliente desconectado: ${socket.id}`)
        }
      })
    })

    // 🧹 Limpieza automática cada minuto
    setInterval(() => {
      this.chatService.cleanupEmptySessions(this.io)
    }, 60_000)
  }
}
