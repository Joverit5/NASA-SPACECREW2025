import { Server, Socket } from "socket.io";
import { ChatMessage } from "./chat.types";
import { ChatService } from "./chat.service";

export class ChatGateway {
  private io: Server;
  private chatService: ChatService;

  // Nuevo mapa para relacionar socket.id -> { sessionId, playerName }
  private socketPlayerMap: Map<string, { sessionId: string; playerName: string }> = new Map();

  constructor(io: Server, chatService?: ChatService) {
    this.io = io;
    this.chatService = chatService ?? new ChatService();

    this.io.on("connection", (socket: Socket) => {
      console.log(`🛰️ Nuevo cliente conectado: ${socket.id}`);

      // 🟢 Evento: Unirse a sala
      socket.on("join_session", ({ sessionId, player }) => {
        try {
          if (!sessionId || !player?.id || !player?.name) {
            socket.emit("chat_error", { message: "Datos de sesión inválidos" });
            return;
          }

          // Guardar jugador en ChatService
          this.chatService.addPlayer(sessionId, player.id, player.name);

          // Guardar relación socket -> playerName + sessionId
          this.socketPlayerMap.set(socket.id, { sessionId, playerName: player.name });

          socket.join(sessionId);
          console.log(`${player.name} (${socket.id}) se unió a la sala ${sessionId}`);

          // Enviar historial de mensajes a quien se une
          const history = this.chatService.getMessages(sessionId);
          socket.emit("chat_history", history);

          // Notificar a otros jugadores en la sala
          socket.to(sessionId).emit("player_joined", {
            playerId: player.id,
            name: player.name,
          });
        } catch (err) {
          console.error("❌ Error al unirse a la sala:", err);
          socket.emit("chat_error", { message: "Error al unirse a la sala" });
        }
      });

      // 💬 Evento: Enviar mensaje
      socket.on("chat_message", ({ sessionId, playerId, text }) => {
        try {
          if (!sessionId || !playerId || !text) return;

          const cleanText = text.trim();
          if (cleanText.length === 0 || cleanText.length > 500) return;

          const player = this.chatService.getPlayer(sessionId, playerId);
          const playerName = player.name;

          const msg: ChatMessage = {
            playerId,
            playerName,
            text: cleanText,
            time: new Date().toISOString(),
          };

          this.chatService.addMessage(sessionId, msg);

          this.io.to(sessionId).emit("chat_message_broadcast", msg);
        } catch (err) {
          console.error("❌ Error al enviar mensaje:", err);
          socket.emit("chat_error", { message: "Error al enviar mensaje" });
        }
      });

      // 🔴 Evento: Desconexión
      socket.on("disconnect", () => {
        const info = this.socketPlayerMap.get(socket.id);
        if (info) {
          console.log(`🚪 Cliente desconectado: ${socket.id} (${info.playerName})`);
          this.socketPlayerMap.delete(socket.id);
        } else {
          console.log(`🚪 Cliente desconectado: ${socket.id}`);
        }
      });
    });

    // 🧹 Limpieza automática cada minuto
    setInterval(() => {
      this.chatService.cleanupEmptySessions(this.io);
    }, 60_000);
  }
}
