export interface InternalPlayer {
  id: string;
  x: number;
  y: number;
  connectedAt: number;
  health: number;
  oxygen: number;
  hunger: number;
  energy: number;
  sanity: number;
  fatigue: number;
}
