import type { ChatMessage } from "./chat.types"

interface Session {
  messages: ChatMessage[]
  players: Record<string, string> // playerId -> name
}

export class ChatService {
  private sessions: Record<string, Session> = {} // Unifica sesiones y jugadores

  isPlayerRegistered(sessionId: string, playerId: string): boolean {
    return !!this.sessions[sessionId]?.players[playerId]
  }

  isNameTaken(sessionId: string, name: string): boolean {
    const session = this.sessions[sessionId]
    if (!session) return false
    return Object.values(session.players).some((playerName) => playerName === name)
  }

  getPlayerCount(sessionId: string): number {
    return Object.keys(this.sessions[sessionId]?.players || {}).length
  }

  // Agregar un jugador a la sesión
  addPlayer(sessionId: string, playerId: string, name: string) {
    if (!this.sessions[sessionId]) this.sessions[sessionId] = { messages: [], players: {} }
    this.sessions[sessionId].players[playerId] = name
  }

  removePlayer(sessionId: string, playerId: string) {
    if (this.sessions[sessionId]?.players[playerId]) {
      delete this.sessions[sessionId].players[playerId]
    }
  }

  // Obtener info de un jugador
  getPlayer(sessionId: string, playerId: string) {
    return { name: this.sessions[sessionId]?.players[playerId] || "Jugador" }
  }

  // Devuelve un array de todos los jugadores {id, name} en la sesión
  getPlayers(sessionId: string): Array<{ id: string; name: string }> {
    const session = this.sessions[sessionId]
    if (!session) return []
    return Object.entries(session.players).map(([id, name]) => ({ id, name }))
  }

  // Agregar mensaje a la sesión
  addMessage(sessionId: string, msg: ChatMessage): void {
    if (!this.sessions[sessionId]) this.sessions[sessionId] = { messages: [], players: {} }
    const messages = this.sessions[sessionId].messages
    messages.push(msg)
    if (messages.length > 100) messages.shift() // mantener últimos 100
  }

  // Obtener historial de mensajes
  getMessages(sessionId: string): ChatMessage[] {
    return this.sessions[sessionId]?.messages || []
  }

  // Devuelve sesiones activas
  getAllSessions(): Array<{ id: string; size: number }> {
    const res: Array<{ id: string; size: number }> = []
    for (const id in this.sessions) {
      res.push({ id, size: this.sessions[id].messages.length })
    }
    return res
  }

  // Limpieza de sesiones vacías
  cleanupEmptySessions(io: any) {
    for (const sessionId in this.sessions) {
      const room = io.sockets.adapter.rooms.get(sessionId)
      if (!room || room.size === 0) {
        delete this.sessions[sessionId]
      }
    }
  }
}
