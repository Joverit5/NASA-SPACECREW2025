import { GameService } from "../src/game/game.service";
import { Direction } from "../src/shared/types";

describe("GameService", () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  it("agrega un jugador correctamente", () => {
    gameService.addPlayer("player1");
    const state = gameService.getState();
    expect(state.players["player1"]).toBeDefined();
    expect(state.players["player1"].x).toBe(100);
    expect(state.players["player1"].y).toBe(100);
  });

  it("actualiza posición del jugador", () => {
    gameService.addPlayer("player1");
    gameService.updatePlayer("player1", { dx: 5, dy: -3, direction: "right" as Direction });

    const player = gameService.getState().players["player1"];
    expect(player.x).toBe(105);
    expect(player.y).toBe(97);
    expect(player.direction).toBe("right");
  });

  it("elimina jugador correctamente", () => {
    gameService.addPlayer("p1");
    gameService.removePlayer("p1");
    expect(gameService.getState().players["p1"]).toBeUndefined();
  });
});
