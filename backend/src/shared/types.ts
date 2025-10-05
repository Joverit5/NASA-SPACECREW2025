// Representa un jugador en el juego
export interface PlayerState {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  connectedAt: number;
  health: number;
  oxygen: number;
  hunger: number;
  energy: number;
  sanity: number;
  fatigue: number;
}

export interface PlayerStatsPayload {
  health: number;
  oxygen: number;
  hunger: number;
  energy: number;
  sanity: number;
  fatigue: number;
}

// Estado completo del juego (todos los jugadores + tiempo global)
export interface GameState {
  players: Record<string, PlayerState>;
  gameTime: number; // ← Tiempo en segundos desde que inició la partida
  isRunning: boolean; // ← Indica si el timer está activo
  startedAt: number | null; // ← Timestamp de cuando inició
}

// Datos enviados por el cliente cuando se mueve
export interface PlayerMovePayload {
  dx: number;
  dy: number;
  direction: Direction;
}

// Evento temporal del juego
export interface GameEvent {
  type: string;
  data: any;
  timestamp: number; // gameTime cuando ocurrió
}

// Eventos que puede emitir o recibir el cliente
export interface ClientToServerEvents {
  "game:join": () => void;
  "player:move": (data: PlayerMovePayload) => void;
  "player:update-stats": (data: PlayerStatsPayload) => void;
}

// Direcciones posibles
export type Direction = 
  | "up" 
  | "down" 
  | "left" 
  | "right" 
  | "idle" 
  | "up-left" 
  | "up-right" 
  | "down-left" 
  | "down-right";

// Eventos que el servidor emite al cliente
export interface ServerToClientEvents {
  "state:update": (state: GameState) => void;
  "player:joined": (player: PlayerState) => void;
  "player:left": (playerId: string) => void;
  "game:event": (event: GameEvent) => void; // ← Nuevo: eventos temporales
}