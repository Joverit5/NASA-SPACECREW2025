import { ChatMessage } from "./chat.types";

export class ChatService {
  private sessions = new Map<string, ChatMessage[]>();

  addMessage(sessionId: string, msg: ChatMessage): void {
    const messages = this.sessions.get(sessionId) || [];
    messages.push(msg);
    if (messages.length > 100) messages.shift(); // mantener últimos 100
    this.sessions.set(sessionId, messages);
  }

  getMessages(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId) || [];
  }

  // Devuelve las sesiones activas: id y número de mensajes (o tamaño)
  getAllSessions(): Array<{ id: string; size: number }> {
    const res: Array<{ id: string; size: number }> = [];
    this.sessions.forEach((messages, id) => {
      res.push({ id, size: messages.length });
    });
    return res;
  }

  cleanupEmptySessions(io: any) {
    this.sessions.forEach((_, sessionId) => {
      const room = io.sockets.adapter.rooms.get(sessionId);
      if (!room || room.size === 0) {
        this.sessions.delete(sessionId);
      }
    });
  }
}
