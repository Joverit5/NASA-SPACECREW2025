// src/chat/chat.service.ts
import { ChatMessage } from "./chat.types";

export class ChatService {
  private sessions: Map<string, ChatMessage[]> = new Map();

  getMessages(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId) || [];
  }

  addMessage(sessionId: string, msg: ChatMessage): void {
    const messages = this.sessions.get(sessionId) || [];
    messages.push(msg);
    this.sessions.set(sessionId, messages);
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}
