import { GameState, PlayerMovePayload, PlayerState } from "../shared/types";

export class GameService {
  private state: GameState = { players: {} };

  addPlayer(id: string, data: Partial<PlayerState> = {}) {
    this.state.players[id] = {
      id,
      x: data.x ?? 0,
      y: data.y ?? 0,
      direction: data.direction ?? "idle",
      connectedAt: Date.now()
    };
  }

  updatePlayer(id: string, data: PlayerMovePayload) {
    const player = this.state.players[id];
    if (!player) return;

    player.x += data.dx;
    player.y += data.dy;
    player.direction = data.direction;
  }

  removePlayer(id: string) {
    delete this.state.players[id];
  }

  getState() {
    return this.state;
  }
}
