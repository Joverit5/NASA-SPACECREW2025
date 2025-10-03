import { Server, Socket } from "socket.io";
import { ChatMessage } from "./chat.types";

export class ChatGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;

    // Configuración inicial
    this.io.on("connection", (socket: Socket) => {
      console.log("Nuevo cliente conectado:", socket.id);

      // Unirse a una sala
      socket.on("join_session", ({ sessionId, player }) => {
        socket.join(sessionId);
        console.log(`${player.name} (${socket.id}) se unió a la sala ${sessionId}`);
      });

      // Manejar mensaje de chat
      socket.on("chat_message", ({ sessionId, playerId, text }) => {
        const msg: ChatMessage = {
          playerId,
          text,
          time: new Date().toISOString(),
        };

        // Reenviar a todos en la sala
        this.io.to(sessionId).emit("chat_message_broadcast", msg);
      });

      // Salida/desconexión
      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });
  }
}
