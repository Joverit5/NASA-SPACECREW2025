import { GameState, PlayerMovePayload } from "../shared/types";

export class GameService {
  private state: GameState = { players: {} };

  addPlayer(id: string) {
    this.state.players[id] = {
      id,
      x: 100,
      y: 100,
      direction: "idle",
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
