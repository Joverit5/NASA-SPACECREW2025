export interface PlayerState {
  id: string
  name: string
  x: number
  y: number
  direction: string
  connectedAt: number
  health: number
  oxygen: number
  hunger: number
  energy: number
  sanity: number
  fatigue: number
  role: CrewRole
  spritePath: string
  textureKey?: string
  animation?: string
  isHost: boolean
}

export interface CrewRole {
  name: string // 'biologist', 'engineer', 'medic', 'scientist', 'technician'
  displayName: string
  spritePath: string
}

export interface AreaData {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  missions?: number
  playerId?: string
}

export interface ChatMessage {
  playerId: string
  playerName: string
  text: string
  timestamp: number
}

export interface GameState {
  players: Record<string, PlayerState>
  gameTime: number
  isRunning: boolean
  startedAt: number | null
  sessionId?: string
  hostId?: string
  missionStarted?: boolean
  areas?: AreaData[]
  map?: {
    tiles: (number | string)[][]
  }
}

export interface SessionData {
  sessionId: string
  hostId: string
  players: Record<string, PlayerState>
  areas: AreaData[]
  map: {
    tiles: (number | string)[][]
  }
  chatHistory: ChatMessage[]
  missionStarted: boolean
  createdAt: number
  maxPlayers: number
}

export interface PlayerMovePayload {
  dx: number
  dy: number
  direction: string
}

export interface PlayerStatsPayload {
  health: number
  oxygen: number
  hunger: number
  energy: number
  sanity: number
  fatigue: number
}

export interface SessionStatePayload {
  sessionId: string
  hostId: string
  players: PlayerState[]
  areas: AreaData[]
  map: {
    tiles: (number | string)[][]
  }
  missionStarted: boolean
}