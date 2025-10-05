import { Server } from "socket.io";
import { GameState, PlayerMovePayload, PlayerState, PlayerStatsPayload } from "../shared/types";

export class GameService {
  private state: GameState = { players: {} };
  private broadcastTimer: NodeJS.Timeout | null = null;
  private pendingBroadcast = false;

  addPlayer(id: string, data: Partial<PlayerState> = {}) {
    this.state.players[id] = {
      id,
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
  }

  updatePlayer(id: string, data: PlayerMovePayload) {
    const player = this.state.players[id];
    if (!player) return;
    
    let { dx, dy } = data;
    
    // Normalizar movimiento diagonal
    if (dx !== 0 && dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      dx = dx / magnitude;
      dy = dy / magnitude;
    }
    
    player.x += dx;
    player.y += dy;
    player.direction = data.direction;
  }

  updatePlayerStats(id: string, data: PlayerStatsPayload) {
    const player = this.state.players[id];
    if (!player) return;

    player.health = this.clamp(data.health, 0, 100);
    player.oxygen = this.clamp(data.oxygen, 0, 100);
    player.hunger = this.clamp(data.hunger, 0, 100);
    player.energy = this.clamp(data.energy, 0, 100);
    player.sanity = this.clamp(data.sanity, 0, 100);
    player.fatigue = this.clamp(data.fatigue, 0, 100);
  }

  removePlayer(id: string) {
    delete this.state.players[id];
  }

  getState() {
    return this.state;
  }

  /**
   * Emite el estado del juego con throttling inteligente.
   * En lugar de ignorar emisiones, las acumula y emite cuando el timer expire.
   */
  broadcastState(io: Server) {
    this.pendingBroadcast = true;

    // Si ya hay un timer corriendo, no hacer nada (se emitirá cuando expire)
    if (this.broadcastTimer) {
      return;
    }

    // Programar la emisión
    this.broadcastTimer = setTimeout(() => {
      if (this.pendingBroadcast) {
        io.emit("state:update", this.state);
        this.pendingBroadcast = false;
      }
      this.broadcastTimer = null;
    }, 50); // Emite máximo cada 50ms
  }

  /**
   * Emite el estado inmediatamente sin throttling.
   * Útil para tests o eventos críticos.
   */
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
}