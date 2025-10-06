import type { Room, Player, ChatMessage } from "@/lib/types"
import { promises as fs } from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "rooms.json")

interface RoomData {
  rooms: Record<string, Room>
  messages: Record<string, ChatMessage[]>
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE)
  } catch {
    const dataDir = path.dirname(DATA_FILE)
    await fs.mkdir(dataDir, { recursive: true })
    const initialData: RoomData = { rooms: {}, messages: {} }
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2))
  }
}

async function readData(): Promise<RoomData> {
  await ensureDataFile()
  const content = await fs.readFile(DATA_FILE, "utf-8")
  return JSON.parse(content)
}

async function writeData(data: RoomData): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  console.log("[v0] Generated room ID:", result)
  return result
}

export async function createRoom(playerName: string): Promise<{ roomId: string; player: Player }> {
  console.log("[v0] createRoom called with playerName:", playerName)

  const data = await readData()
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

  data.rooms[roomId] = room
  data.messages[roomId] = []
  await writeData(data)

  console.log("[v0] Room created and saved to JSON:", { roomId, playerId, playerCount: room.players.length })
  return { roomId, player }
}

export async function getRoom(roomId: string): Promise<Room | undefined> {
  const data = await readData()
  return data.rooms[roomId]
}

export async function joinRoom(
  roomId: string,
  playerName: string,
): Promise<{ success: boolean; player?: Player; error?: string }> {
  console.log("[v0] joinRoom called with roomId:", roomId, "playerName:", playerName)

  const data = await readData()
  console.log("[v0] Available rooms:", Object.keys(data.rooms))

  const room = data.rooms[roomId]

  if (!room) {
    console.log("[v0] Room not found:", roomId)
    return { success: false, error: "Room not found" }
  }

  if (room.players.length >= room.maxPlayers) {
    console.log("[v0] Room is full:", roomId, "players:", room.players.length)
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
  data.rooms[roomId] = room
  await writeData(data)

  console.log("[v0] Player joined successfully:", playerId, "Room now has", room.players.length, "players")
  return { success: true, player }
}

export async function togglePlayerReady(roomId: string, playerId: string): Promise<Room | undefined> {
  const data = await readData()
  const room = data.rooms[roomId]
  if (!room) return undefined

  const player = room.players.find((p) => p.id === playerId)
  if (player) {
    player.ready = !player.ready
    data.rooms[roomId] = room
    await writeData(data)
  }

  return room
}

export async function removePlayer(roomId: string, playerId: string): Promise<Room | undefined> {
  const data = await readData()
  const room = data.rooms[roomId]
  if (!room) return undefined

  room.players = room.players.filter((p) => p.id !== playerId)

  if (room.players.length === 0) {
    delete data.rooms[roomId]
    delete data.messages[roomId]
    await writeData(data)
    return undefined
  }

  data.rooms[roomId] = room
  await writeData(data)
  return room
}

export async function addMessage(roomId: string, message: ChatMessage): Promise<void> {
  const data = await readData()
  if (!data.messages[roomId]) {
    data.messages[roomId] = []
  }
  data.messages[roomId].push(message)
  await writeData(data)
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  const data = await readData()
  return data.messages[roomId] || []
}
