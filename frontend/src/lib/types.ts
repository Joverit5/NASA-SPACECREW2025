/**
 * Type definitions for Tonoteam MVP
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

export interface ChatMessage {
  playerId: string
  playerName: string
  text: string
  timestamp: number
}
