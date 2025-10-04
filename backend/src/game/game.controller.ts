import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { PlayerMovePayload } from "../shared/types";

export class GameController {
  constructor(private io: Server, private gameService: GameService) {}

  registerHandlers(socket: Socket) {
    socket.on("game:join", () => {
      this.gameService.addPlayer(socket.id);
    });

    socket.on("player:move", (data: PlayerMovePayload) => {
      this.gameService.updatePlayer(socket.id, data);
      this.io.emit("state:update", this.gameService.getState());
    });

    socket.on("disconnect", () => {
      this.gameService.removePlayer(socket.id);
      this.io.emit("state:update", this.gameService.getState());
    });
  }
}
