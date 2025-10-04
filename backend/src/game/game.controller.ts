import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { PlayerMovePayload } from "../shared/types";

export class GameController {
  constructor(private io: Server, private gameService: GameService) {}

  registerHandlers(socket: Socket) {
    console.log(`Handlers registrados para: ${socket.id}`);

    this.gameService.addPlayer(socket.id);

    socket.on("player:move", (data) => {
      this.gameService.updatePlayer(socket.id, data);
      const state = this.gameService.getState();
      this.io.emit("state:update", state);
    });

    socket.on("disconnect", () => {
      this.gameService.removePlayer(socket.id);
      const state = this.gameService.getState();
      this.io.emit("state:update", state);
    });
  }
}