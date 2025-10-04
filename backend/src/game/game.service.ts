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
    if (!this.state.players[id]) return;
    this.state.players[id].x += data.dx;
    this.state.players[id].y += data.dy;
  }

  removePlayer(id: string) {
    delete this.state.players[id];
  }

  getState() {
    return this.state;
  }
}
