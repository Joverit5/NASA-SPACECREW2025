// Representa un jugador en el juego
export interface PlayerState {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  connectedAt: number;
}

// Estado completo del juego (todos los jugadores)
export interface GameState {
  players: Record<string, PlayerState>;
}

// Datos enviados por el cliente cuando se mueve
export interface PlayerMovePayload {
  dx: number;
  dy: number;
  direction: Direction;
}

// Direcciones posibles (puedes expandirlo con diagonales si usas 8 direcciones)
export type Direction = "up" | "down" | "left" | "right" | "idle";

// Eventos que puede emitir o recibir el cliente
export interface ClientToServerEvents {
  "game:join": () => void;
  "player:move": (data: PlayerMovePayload) => void;
  // evento de interacción? 
}

// Eventos que el servidor emite al cliente
export interface ServerToClientEvents {
  "state:update": (state: GameState) => void;
  "player:joined": (player: PlayerState) => void;
  "player:left": (playerId: string) => void;
}
