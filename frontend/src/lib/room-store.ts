import type { Room, Player, ChatMessage } from "./types"

interface RoomData {
  rooms: Record<string, Room>
  messages: Record<string, ChatMessage[]>
}

declare global {
  var roomStore: RoomData | undefined
  var roomStoreInitialized: boolean | undefined
}

function getGlobalStore(): RoomData {
  if (!globalThis.roomStore) {
    globalThis.roomStore = {
      rooms: {},
      messages: {},
    }
  }
  return globalThis.roomStore
}

async function initializeData() {
  if (globalThis.roomStoreInitialized) {
    return
  }

  try {
    const initialData = await import("../data/rooms.json")
    const loadedRooms = initialData.default?.rooms || initialData.rooms || {}
    const loadedMessages = initialData.default?.messages || initialData.messages || {}

    const store = getGlobalStore()
    Object.assign(store.rooms, loadedRooms)
    Object.assign(store.messages, loadedMessages)

    globalThis.roomStoreInitialized = true
  } catch (error) {
    console.error("Error loading initial data:", error)
    globalThis.roomStoreInitialized = true
  }
}

// Inicializar inmediatamente
initializeData()

async function readData(): Promise<RoomData> {
  if (!globalThis.roomStoreInitialized) {
    await initializeData()
  }
  return getGlobalStore()
}

async function writeData(_data: RoomData): Promise<void> {
  // No hacer nada, los cambios ya están en globalThis.roomStore
}

export function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createRoom(playerName: string): Promise<{ roomId: string; player: Player }> {
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
  const data = await readData()
  const room = data.rooms[roomId]

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
  await writeData(data)

  return { success: true, player }
}

export async function togglePlayerReady(roomId: string, playerId: string): Promise<Room | undefined> {
  const data = await readData()
  const room = data.rooms[roomId]
  if (!room) return undefined

  const player = room.players.find((p) => p.id === playerId)
  if (player) {
    player.ready = !player.ready
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

  await writeData(data)
  return room
}

export async function addMessage(roomId: string, message: ChatMessage): Promise<void> {
  const data = await readData()
  if (!data.messages[roomId]) {
    data.messages[roomId] = []
  }
  data.messages[roomId].push(message)
  console.log("[v0] Message added to room", roomId, "Total messages:", data.messages[roomId].length)
  console.log("[v0] Message content:", message)
  await writeData(data)
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  const data = await readData()
  const messages = data.messages[roomId] || []
  console.log("[v0] Getting messages for room", roomId, "Found:", messages.length)
  return messages
}
