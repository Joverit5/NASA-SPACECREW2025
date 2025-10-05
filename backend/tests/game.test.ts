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
    expect(state.players["player1"].x).toBe(0);
    expect(state.players["player1"].y).toBe(0);
  });

  it("actualiza posición del jugador", () => {
    gameService.addPlayer("player1");
    gameService.updatePlayer("player1", { dx: 5, dy: -3, direction: "right" as Direction });

    const player = gameService.getState().players["player1"];
    expect(player.x).toBe(5);
    expect(player.y).toBe(-3);
    expect(player.direction).toBe("right");
  });

  it("elimina jugador correctamente", () => {
    gameService.addPlayer("p1");
    gameService.removePlayer("p1");
    expect(gameService.getState().players["p1"]).toBeUndefined();
  });
});

import { PlayerMovePayload } from "../src/shared/types";

describe("GameService multiplayer", () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  it("maneja múltiples jugadores simultáneamente", () => {
    // Añadir dos jugadores
    gameService.addPlayer("1");
    gameService.addPlayer("2");

    // Simular movimiento de ambos
    const move1: PlayerMovePayload = { dx: 5, dy: 0, direction: "right" };
    const move2: PlayerMovePayload = { dx: -2, dy: 3, direction: "up" };

    gameService.updatePlayer("1", move1);
    gameService.updatePlayer("2", move2);

    const state = gameService.getState();

    // Verificar cambios individuales
    expect(state.players["1"].x).toBe(5);
    expect(state.players["1"].y).toBe(0);
    expect(state.players["1"].direction).toBe("right");

    expect(state.players["2"].x).toBe(-2);
    expect(state.players["2"].y).toBe(3);
    expect(state.players["2"].direction).toBe("up");
  });
});
