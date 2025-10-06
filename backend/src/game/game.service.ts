import { Server } from "socket.io";
import { GameState, PlayerMovePayload, PlayerState, PlayerStatsPayload } from "../shared/types";

export class GameService {
  private state: GameState = { 
    players: {},
    gameTime: 0,
    isRunning: false,
    startedAt: null,
  };
  private broadcastTimer: NodeJS.Timeout | null = null;
  private pendingBroadcast = false;
  private gameTimer: NodeJS.Timeout | null = null;
  private eventCheckInterval: NodeJS.Timeout | null = null;

  // 🎮 Sistema de Tiempo Global
  startGameTimer(io: Server) {
    if (this.state.isRunning) return; // Ya está corriendo

    this.state.isRunning = true;
    this.state.startedAt = Date.now();
    this.state.gameTime = 0;

    console.log("⏰ Timer global iniciado");

    // Actualizar el tiempo cada segundo
    this.gameTimer = setInterval(() => {
      try {
        this.state.gameTime = Math.floor((Date.now() - this.state.startedAt!) / 1000);
        this.checkTimeBasedEvents(io);
      } catch (error) {
        console.error("❌ Error en gameTimer:", error);
      }
    }, 1000);

    // Broadcast del estado cada 5 segundos para sincronizar tiempo
    this.eventCheckInterval = setInterval(() => {
      try {
        this.broadcastStateImmediate(io);
      } catch (error) {
        console.error("❌ Error en eventCheckInterval:", error);
      }
    }, 5000);
  }

  stopGameTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.eventCheckInterval) {
      clearInterval(this.eventCheckInterval);
      this.eventCheckInterval = null;
    }
    this.state.isRunning = false;
    console.log(`⏰ Timer detenido. Tiempo total: ${this.state.gameTime}s`);
  }

  getGameTime(): number {
    return this.state.gameTime;
  }

  // 🎯 Sistema de Eventos basados en Tiempo
  private checkTimeBasedEvents(io: Server) {
    const time = this.state.gameTime;

    // Ejemplo: Eventos cada 30 segundos
    if (time > 0 && time % 30 === 0) {
      this.triggerEvent(io, "periodic_checkpoint", { time });
    }

    // Ejemplo: Evento específico a los 2 minutos
    if (time === 120) {
      this.triggerEvent(io, "storm_incoming", { 
        message: "⚠️ Se aproxima una tormenta",
        severity: "high" 
      });
    }

    // Ejemplo: Degradación de stats cada 60 segundos
    if (time % 60 === 0 && time > 0) {
      this.degradePlayerStats(io);
    }

    // Ejemplo: Evento de recursos cada 5 minutos
    if (time % 300 === 0 && time > 0) {
      this.triggerEvent(io, "resource_spawn", {
        type: "food",
        amount: 5
      });
    }
  }

  private triggerEvent(io: Server, eventType: string, data: any) {
    console.log(`🎪 Evento disparado: ${eventType} en t=${this.state.gameTime}s`);
    io.emit("game:event", {
      type: eventType,
      data,
      timestamp: this.state.gameTime,
    });
  }

  // Ejemplo: Degradar stats de jugadores con el tiempo
  private degradePlayerStats(io: Server) {
    Object.values(this.state.players).forEach((player) => {
      player.hunger = this.clamp(player.hunger - 5, 0, 100);
      player.energy = this.clamp(player.energy - 3, 0, 100);
      player.oxygen = this.clamp(player.oxygen - 2, 0, 100);
    });
    console.log("📉 Stats degradadas por el tiempo");
    this.broadcastStateImmediate(io);
  }

  // 🔧 Métodos existentes (sin cambios)
  addPlayer(id: string, data: Partial<PlayerState> = {}) {
    this.state.players[id] = {
      id,
      name: data.name || `Player_${id.substring(0, 5)}`,
      x: data.x ?? 0,
      y: data.y ?? 0,
      direction: data.direction ?? "idle",
      connectedAt: Date.now(),
      health: data.health ?? 100,
      oxygen: data.oxygen ?? 100,
      hunger: data.hunger ?? 100,
      energy: data.energy ?? 100,
      sanity: data.sanity ?? 100,
      fatigue: data.fatigue ?? 0,
    };

    // Iniciar el timer cuando se conecta el primer jugador
    if (Object.keys(this.state.players).length === 1 && this.ioInstance) {
      this.startGameTimer(this.ioInstance);
    }
  }

  updatePlayer(id: string, data: PlayerMovePayload) {
    const player = this.state.players[id];
    if (!player) return;
    player.x += data.dx;
    player.y += data.dy;
    player.direction = data.direction;
  }

  // Nuevo: Actualizar stat individual de un jugador
  updatePlayerStat(playerId: string, stat: keyof PlayerStatsPayload, delta: number) {
    const player = this.state.players[playerId];
    if (!player) return;

    const oldValue = player[stat];
    player[stat] = this.clamp(player[stat] + delta, 0, 100);
    
    console.log(`📊 Stat update: ${playerId} ${stat} ${oldValue} -> ${player[stat]} (delta: ${delta})`);
  }

  // Nuevo: Actualizar múltiples stats de un jugador
  updatePlayerStats(id: string, data: Partial<PlayerStatsPayload>) {
    const player = this.state.players[id];
    if (!player) return;

    if (data.health !== undefined) player.health = this.clamp(data.health, 0, 100);
    if (data.oxygen !== undefined) player.oxygen = this.clamp(data.oxygen, 0, 100);
    if (data.hunger !== undefined) player.hunger = this.clamp(data.hunger, 0, 100);
    if (data.energy !== undefined) player.energy = this.clamp(data.energy, 0, 100);
    if (data.sanity !== undefined) player.sanity = this.clamp(data.sanity, 0, 100);
    if (data.fatigue !== undefined) player.fatigue = this.clamp(data.fatigue, 0, 100);
  }

  // Nuevo: Obtener stats de un jugador
  getPlayerStats(playerId: string): PlayerStatsPayload | null {
    const player = this.state.players[playerId];
    if (!player) return null;

    return {
      health: player.health,
      oxygen: player.oxygen,
      hunger: player.hunger,
      energy: player.energy,
      sanity: player.sanity,
      fatigue: player.fatigue,
    };
  }

  // Nuevo: Aplicar efectos de eventos/misiones a stats
  applyStatsEffects(playerId: string, effects: Partial<Record<keyof PlayerStatsPayload, number>>) {
    const player = this.state.players[playerId];
    if (!player) {
      console.warn(`⚠️ Cannot apply effects: player ${playerId} not found`);
      return;
    }

    console.log(`🎯 Applying effects to ${playerId}:`, effects);

    for (const [stat, delta] of Object.entries(effects)) {
      if (delta && typeof player[stat as keyof PlayerStatsPayload] === 'number') {
        this.updatePlayerStat(playerId, stat as keyof PlayerStatsPayload, delta);
      }
    }

    // Broadcast cambios inmediatamente
    if (this.ioInstance) {
      this.broadcastStateImmediate(this.ioInstance);
    }
  }

  removePlayer(id: string) {
    delete this.state.players[id];
    
    // Detener el timer si no quedan jugadores
    if (Object.keys(this.state.players).length === 0) {
      this.stopGameTimer();
    }
  }

  getState() {
    return this.state;
  }

  // Nuevo: Obtener un jugador específico
  getPlayer(playerId: string): PlayerState | null {
    return this.state.players[playerId] || null;
  }

  broadcastState(io: Server) {
    this.pendingBroadcast = true;

    if (this.broadcastTimer) {
      return;
    }

    this.broadcastTimer = setTimeout(() => {
      if (this.pendingBroadcast) {
        io.emit("state:update", this.state);
        this.pendingBroadcast = false;
      }
      this.broadcastTimer = null;
    }, 50);
  }

  broadcastStateImmediate(io: Server) {
    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    io.emit("state:update", this.state);
    this.pendingBroadcast = false;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  // Helper para acceder al io (necesitas inyectarlo o guardarlo)
  private ioInstance: Server | null = null;
  
  setIoInstance(io: Server) {
    this.ioInstance = io;
  }

  private getIoInstance(): Server {
    if (!this.ioInstance) {
      throw new Error("IO instance not set. Call setIoInstance first.");
    }
    return this.ioInstance;
  }
}