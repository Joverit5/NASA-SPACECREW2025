import { Server, Socket } from "socket.io";
import { ChatMessage } from "./chat.types";
import { ChatService } from "./chat.service";

export class ChatGateway {
  private io: Server;
  private chatService: ChatService;

  // allow injecting a ChatService (useful for tests and shared instances)
  constructor(io: Server, chatService?: ChatService) {
    this.io = io;
    this.chatService = chatService ?? new ChatService();

    this.io.on("connection", (socket: Socket) => {
      console.log("🛰️ Nuevo cliente conectado:", socket.id);

      // 🟢 Evento: Unirse a sala
      socket.on("join_session", ({ sessionId, player }) => {
        try {
          if (!sessionId || !player?.id || !player?.name) {
            socket.emit("chat_error", { message: "Datos de sesión inválidos" });
            return;
          }

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

          const msg: ChatMessage = {
            playerId,
            text: cleanText,
            time: new Date().toISOString(),
          };

          // Guardar en memoria
          this.chatService.addMessage(sessionId, msg);

          // Enviar a todos los jugadores en la sala
          this.io.to(sessionId).emit("chat_message_broadcast", msg);
        } catch (err) {
          console.error("❌ Error al enviar mensaje:", err);
          socket.emit("chat_error", { message: "Error al enviar mensaje" });
        }
      });

      // 🔴 Evento: Desconexión
      socket.on("disconnect", () => {
        console.log("🚪 Cliente desconectado:", socket.id);
      });
    });

    // 🧹 Limpieza automática cada minuto
    setInterval(() => {
      this.chatService.cleanupEmptySessions(this.io);
    }, 60_000);
  }
}
