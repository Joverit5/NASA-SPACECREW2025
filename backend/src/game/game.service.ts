import type { Server } from "socket.io"
import type {
  PlayerMovePayload,
  PlayerState,
  PlayerStatsPayload,
  SessionData,
  CrewRole,
  AreaData,
  ChatMessage,
} from "./game.types"

const CREW_ROLES: CrewRole[] = [
  { name: "biologist", displayName: "Biologist", spritePath: "/assets/crew/crew_assets/crew_biologist/" },
  { name: "engineer", displayName: "Engineer", spritePath: "/assets/crew/crew_assets/crew_engineer/" },
  { name: "medic", displayName: "Medic", spritePath: "/assets/crew/crew_assets/crew_medic/" },
  { name: "scientist", displayName: "Scientist", spritePath: "/assets/crew/crew_assets/crew_scientist/" },
  { name: "technician", displayName: "Technician", spritePath: "/assets/crew/crew_assets/crew_technician/" },
]

export class GameService {
  private sessions: Map<string, SessionData> = new Map()
  private gameTimers: Map<string, NodeJS.Timeout> = new Map()
  private eventCheckIntervals: Map<string, NodeJS.Timeout> = new Map()
  private ioInstance: Server | null = null

  setIoInstance(io: Server) {
    this.ioInstance = io
  }

  createSession(sessionId: string, hostId: string, maxPlayers = 5): SessionData {
    const session: SessionData = {
      sessionId,
      hostId,
      players: {},
      areas: [],
      map: {
        tiles: Array.from({ length: 20 }, () => Array(20).fill(0)),
      },
      chatHistory: [],
      missionStarted: false,
      createdAt: Date.now(),
      maxPlayers,
    }

    this.sessions.set(sessionId, session)
    console.log(`✅ Session created: ${sessionId} (host: ${hostId})`)
    return session
  }

  getSession(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null
  }

  deleteSession(sessionId: string) {
    this.stopGameTimer(sessionId)
    this.sessions.delete(sessionId)
    console.log(`🗑️ Session deleted: ${sessionId}`)
  }

  private assignRole(sessionId: string): CrewRole {
    const session = this.sessions.get(sessionId)
    if (!session) return CREW_ROLES[0]

    const usedRoles = new Set(Object.values(session.players).map((p) => p.role.name))
    const availableRoles = CREW_ROLES.filter((r) => !usedRoles.has(r.name))

    if (availableRoles.length === 0) {
      return CREW_ROLES[Math.floor(Math.random() * CREW_ROLES.length)]
    }

    return availableRoles[Math.floor(Math.random() * availableRoles.length)]
  }

  addPlayer(sessionId: string, playerId: string, playerName: string): PlayerState | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.warn(`⚠️ Cannot add player: session ${sessionId} not found`)
      return null
    }

    if (Object.keys(session.players).length >= session.maxPlayers) {
      console.warn(`⚠️ Cannot add player: session ${sessionId} is full`)
      return null
    }

    const nameTaken = Object.values(session.players).some((p) => p.name === playerName)
    if (nameTaken) {
      console.warn(`⚠️ Cannot add player: name ${playerName} already taken`)
      return null
    }

    const isHost = Object.keys(session.players).length === 0
    const role = this.assignRole(sessionId)

    const player: PlayerState = {
      id: playerId,
      name: playerName,
      x: 400,
      y: 300,
      direction: "idle",
      connectedAt: Date.now(),
      health: 100,
      oxygen: 100,
      hunger: 100,
      energy: 100,
      sanity: 100,
      fatigue: 0,
      role,
      spritePath: role.spritePath,
      textureKey: `${role.name}_walk_south_0`,
      animation: "walk_south",
      isHost,
    }

    session.players[playerId] = player

    if (isHost) {
      session.hostId = playerId
    }

    console.log(
      `👤 Player added: ${playerName} (${role.displayName}) to session ${sessionId} ${isHost ? "[HOST]" : ""}`,
    )

    return player
  }

  updatePlayer(sessionId: string, playerId: string, data: PlayerMovePayload) {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const player = session.players[playerId]
    if (!player) return false

    player.x += data.dx
    player.y += data.dy
    player.direction = data.direction

    return true
  }

  updatePlayerStats(sessionId: string, playerId: string, data: Partial<PlayerStatsPayload>) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const player = session.players[playerId]
    if (!player) return

    if (data.health !== undefined) player.health = this.clamp(data.health, 0, 100)
    if (data.oxygen !== undefined) player.oxygen = this.clamp(data.oxygen, 0, 100)
    if (data.hunger !== undefined) player.hunger = this.clamp(data.hunger, 0, 100)
    if (data.energy !== undefined) player.energy = this.clamp(data.energy, 0, 100)
    if (data.sanity !== undefined) player.sanity = this.clamp(data.sanity, 0, 100)
    if (data.fatigue !== undefined) player.fatigue = this.clamp(data.fatigue, 0, 100)
  }

  removePlayer(sessionId: string, playerId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const player = session.players[playerId]
    if (!player) return

    const playerName = player.name
    delete session.players[playerId]

    console.log(`👋 Player removed: ${playerName} from session ${sessionId}`)

    if (session.hostId === playerId) {
      const remainingPlayers = Object.values(session.players)
      if (remainingPlayers.length > 0) {
        const newHost = remainingPlayers[0]
        newHost.isHost = true
        session.hostId = newHost.id
        console.log(`👑 New host assigned: ${newHost.name}`)
      } else {
        this.deleteSession(sessionId)
      }
    }
  }

  placeArea(sessionId: string, area: Partial<AreaData>, playerId: string): AreaData | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const player = session.players[playerId]
    if (!player || !player.isHost) {
      console.warn(`⚠️ Only host can place areas`)
      return null
    }

    // Generate ID if not provided
    const areaId = area.id || `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullArea: AreaData = {
      id: areaId,
      type: area.type || "unknown",
      x: area.x || 0,
      y: area.y || 0,
      w: area.w || 1,
      h: area.h || 1,
      rotation: area.rotation || 0,
      missions: area.missions || 0,
      playerId: playerId,
    }

    if (!this.canPlaceArea(session, fullArea)) {
      console.warn(`⚠️ Cannot place area: collision or out of bounds`)
      return null
    }

    session.areas.push(fullArea)
    this.updateMapTiles(session, fullArea, fullArea.id)

    console.log(`🗺️ Area placed: ${fullArea.type} at (${fullArea.x}, ${fullArea.y})`)
    return fullArea
  }

  updateArea(sessionId: string, areaId: string, updates: Partial<AreaData>, playerId: string): AreaData | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const player = session.players[playerId]
    if (!player || !player.isHost) {
      console.warn(`⚠️ Only host can update areas`)
      return null
    }

    const index = session.areas.findIndex((a) => a.id === areaId)
    if (index === -1) return null

    const oldArea = session.areas[index]
    this.updateMapTiles(session, oldArea, 0)

    const updatedArea: AreaData = {
      ...oldArea,
      ...updates,
      id: areaId, // Preserve ID
    }

    if (!this.canPlaceArea(session, updatedArea, areaId)) {
      this.updateMapTiles(session, oldArea, oldArea.id)
      return null
    }

    session.areas[index] = updatedArea
    this.updateMapTiles(session, updatedArea, updatedArea.id)

    console.log(`🔄 Area updated: ${areaId}`)
    return updatedArea
  }

  removeArea(sessionId: string, areaId: string, playerId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const player = session.players[playerId]
    if (!player || !player.isHost) {
      console.warn(`⚠️ Only host can remove areas`)
      return false
    }

    const index = session.areas.findIndex((a) => a.id === areaId)
    if (index === -1) return false

    const area = session.areas[index]
    this.updateMapTiles(session, area, 0)
    session.areas.splice(index, 1)

    console.log(`🗑️ Area removed: ${areaId}`)
    return true
  }

  private canPlaceArea(session: SessionData, area: AreaData, ignoreAreaId?: string): boolean {
    const { x, y, w, h } = area

    if (x < 0 || y < 0 || x + w > 20 || y + h > 20) return false

    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cell = session.map.tiles[y + j][x + i]
        if (cell !== 0 && String(cell) !== String(ignoreAreaId || "")) {
          return false
        }
      }
    }

    return true
  }

  private updateMapTiles(session: SessionData, area: AreaData, value: number | string) {
    const { x, y, w, h } = area

    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (y + j < 20 && x + i < 20) {
          session.map.tiles[y + j][x + i] = value
        }
      }
    }
  }

  addChatMessage(sessionId: string, playerId: string, text: string): ChatMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const player = session.players[playerId]
    if (!player) return null

    if (!text || text.trim().length === 0 || text.length > 500) return null

    const message: ChatMessage = {
      playerId,
      playerName: player.name,
      text: text.trim(),
      timestamp: Date.now(),
    }

    session.chatHistory.push(message)

    if (session.chatHistory.length > 100) {
      session.chatHistory = session.chatHistory.slice(-100)
    }

    return message
  }

  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId)
    return session ? session.chatHistory : []
  }

  startMission(sessionId: string, playerId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const player = session.players[playerId]
    if (!player || !player.isHost) {
      console.warn(`⚠️ Only host can start mission`)
      return false
    }

    if (session.missionStarted) {
      console.warn(`⚠️ Mission already started`)
      return false
    }

    session.missionStarted = true
    console.log(`🚀 Mission started in session ${sessionId}`)

    if (this.ioInstance) {
      this.startGameTimer(sessionId, this.ioInstance)
    }

    return true
  }

  startGameTimer(sessionId: string, io: Server) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (this.gameTimers.has(sessionId)) return

    console.log(`⏰ Timer started for session ${sessionId}`)

    let gameTime = 0
    const startedAt = Date.now()

    const timer = setInterval(() => {
      try {
        gameTime = Math.floor((Date.now() - startedAt) / 1000)
        this.checkTimeBasedEvents(sessionId, gameTime, io)
      } catch (error) {
        console.error(`❌ Error in gameTimer for ${sessionId}:`, error)
      }
    }, 1000)

    this.gameTimers.set(sessionId, timer)

    const eventInterval = setInterval(() => {
      try {
        this.broadcastSessionState(sessionId, io)
      } catch (error) {
        console.error(`❌ Error in eventCheckInterval for ${sessionId}:`, error)
      }
    }, 5000)

    this.eventCheckIntervals.set(sessionId, eventInterval)
  }

  stopGameTimer(sessionId: string) {
    const timer = this.gameTimers.get(sessionId)
    if (timer) {
      clearInterval(timer)
      this.gameTimers.delete(sessionId)
    }

    const eventInterval = this.eventCheckIntervals.get(sessionId)
    if (eventInterval) {
      clearInterval(eventInterval)
      this.eventCheckIntervals.delete(sessionId)
    }

    console.log(`⏰ Timer stopped for session ${sessionId}`)
  }

  private checkTimeBasedEvents(sessionId: string, time: number, io: Server) {
    if (time > 0 && time % 30 === 0) {
      this.triggerEvent(sessionId, io, "periodic_checkpoint", { time })
    }

    if (time % 60 === 0 && time > 0) {
      this.degradePlayerStats(sessionId, io)
    }
  }

  private triggerEvent(sessionId: string, io: Server, eventType: string, data: any) {
    console.log(`🎪 Event in ${sessionId}: ${eventType}`)
    io.to(sessionId).emit("game:event", {
      type: eventType,
      data,
      timestamp: Date.now(),
    })
  }

  private degradePlayerStats(sessionId: string, io: Server) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    Object.values(session.players).forEach((player) => {
      player.hunger = this.clamp(player.hunger - 5, 0, 100)
      player.energy = this.clamp(player.energy - 3, 0, 100)
      player.oxygen = this.clamp(player.oxygen - 2, 0, 100)
    })

    console.log(`📉 Stats degraded in session ${sessionId}`)
    this.broadcastSessionState(sessionId, io)
  }

  broadcastSessionState(sessionId: string, io: Server) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    io.to(sessionId).emit("session_state", {
      sessionId: session.sessionId,
      hostId: session.hostId,
      players: Object.values(session.players),
      areas: session.areas,
      map: session.map,
      missionStarted: session.missionStarted,
    })
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }

  // Helper to find which session a player is in
  findPlayerSession(playerId: string): string | null {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.players[playerId]) {
        return sessionId
      }
    }
    return null
  }
}

export default GameService