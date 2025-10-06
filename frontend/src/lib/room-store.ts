// In-memory store for rooms (in production, use a database)
import type { Room, Player, ChatMessage } from "./types"

const rooms = new Map<string, Room>()
const roomMessages = new Map<string, ChatMessage[]>()

export function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  console.log("[v0] Generated room ID:", result)
  return result
}

export function createRoom(playerName: string): { roomId: string; player: Player } {
  console.log("[v0] createRoom called with playerName:", playerName)

  const roomId = generateRoomId()
  const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const player: Player = {
    id: playerId,
    name: playerName,
    ready: false,
    hp: 100,
  }

  const room: Room = {
    id: roomId,
    players: [player],
    creatorId: playerId,
    maxPlayers: 5,
  }

  rooms.set(roomId, room)
  roomMessages.set(roomId, [])

  console.log("[v0] Room created:", { roomId, playerId, playerCount: room.players.length })
  return { roomId, player }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function joinRoom(roomId: string, playerName: string): { success: boolean; player?: Player; error?: string } {
  const room = rooms.get(roomId)

  if (!room) {
    return { success: false, error: "Room not found" }
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: "Room is full" }
  }

  const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const player: Player = {
    id: playerId,
    name: playerName,
    ready: false,
    hp: 100,
  }

  room.players.push(player)
  rooms.set(roomId, room)

  return { success: true, player }
}

export function togglePlayerReady(roomId: string, playerId: string): Room | undefined {
  const room = rooms.get(roomId)
  if (!room) return undefined

  const player = room.players.find((p) => p.id === playerId)
  if (player) {
    player.ready = !player.ready
    rooms.set(roomId, room)
  }

  return room
}

export function removePlayer(roomId: string, playerId: string): Room | undefined {
  const room = rooms.get(roomId)
  if (!room) return undefined

  room.players = room.players.filter((p) => p.id !== playerId)

  if (room.players.length === 0) {
    rooms.delete(roomId)
    roomMessages.delete(roomId)
    return undefined
  }

  rooms.set(roomId, room)
  return room
}

export function addMessage(roomId: string, message: ChatMessage): void {
  const messages = roomMessages.get(roomId) || []
  messages.push(message)
  roomMessages.set(roomId, messages)
}

export function getMessages(roomId: string): ChatMessage[] {
  return roomMessages.get(roomId) || []
}
