/**
 * Type definitions for NASA Space Crew 2025
 */

export interface Player {
  id: string
  name: string
  role?: PlayerRole
  ready: boolean
  hp: number
}

export type PlayerRole = "Engineer" | "Technician" | "Biologist" | "Medic" | "Scientist"

export interface Area {
  id: string
  type: AreaType
  x: number
  y: number
  w: number
  h: number
  cost: number
  tileCount: number
  playerId?: string
}

export type AreaType = "kitchen" | "sleep" | "recreation" | "maintenance" | "energy" | "control" | "storage" | "dock"

export interface GameSession {
  sessionId: string
  creator: string
  players: Player[]
  map: {
    width: number
    height: number
    tiles: number[][]
  }
  areas: Area[]
  params: {
    budget: number
    crew: number
    missionDays: number
  }
  resources: {
    oxygen: number
    energy: number
    food: number
    credits: number
  }
  areaLevel: number
  volumeLevel: number
  activeEvents: number[]
  status: "lobby" | "designing" | "simulating" | "completed"
}

export interface Room {
  id: string
  players: Player[]
  creatorId: string
  maxPlayers: number
}

export interface ChatMessage {
  playerId: string
  playerName: string
  text: string
  timestamp: number
}

export interface ServerToClientEvents {
  "room:joined": (data: { session: GameSession; player: Player }) => void
  "room:updated": (session: GameSession) => void
  "player:joined": (player: Player) => void
  "player:left": (playerId: string) => void
  "player:ready": (data: { playerId: string; ready: boolean }) => void
  "game:started": () => void
  "chat:message": (message: ChatMessage) => void
  error: (message: string) => void
}

export interface ClientToServerEvents {
  "room:create": (data: { playerName: string }, callback: (sessionId: string) => void) => void
  "room:join": (
    data: { sessionId: string; playerName: string },
    callback: (success: boolean, error?: string) => void,
  ) => void
  "room:leave": () => void
  "player:toggle-ready": () => void
  "game:start": () => void
  "chat:send": (message: string) => void
}
