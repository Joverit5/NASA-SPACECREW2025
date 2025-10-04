import { Server, Socket } from "socket.io";
import { ChatMessage } from "./chat.types";
import { ChatService } from "./chat.service";

export class ChatGateway {
  private io: Server;
  private chatService: ChatService;

  constructor(io: Server, chatService: ChatService) {
    this.io = io;
    this.chatService = chatService;

    this.io.on("connection", (socket: Socket) => {
      console.log("Nuevo cliente conectado:", socket.id);

      socket.on("join_session", ({ sessionId, player }) => {
        socket.join(sessionId);
        console.log(`${player.name} (${socket.id}) se unió a la sala ${sessionId}`);
      });

      socket.on("chat_message", ({ sessionId, playerId, text }) => {
        const msg: ChatMessage = {
          playerId,
          text,
          time: new Date().toISOString(),
        };

        // Guardar y emitir
        this.chatService.addMessage(sessionId, msg);
        this.io.to(sessionId).emit("chat_message_broadcast", msg);
      });

      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });
  }
}
