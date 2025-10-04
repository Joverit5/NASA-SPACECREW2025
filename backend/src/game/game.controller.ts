import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";

export class GameController {
  constructor(private io: Server, private gameService: GameService) {}

  registerHandlers(socket: Socket) {
    console.log(`Handlers registrados para: ${socket.id}`);

    this.gameService.addPlayer(socket.id);
    this.gameService.broadcastState(this.io); // emit inicial del nuevo jugador

    socket.on("player:move", (data) => {
      this.gameService.updatePlayer(socket.id, data);
      this.gameService.broadcastState(this.io);
    });

    socket.on("player:update-stats", (data) => {
      this.gameService.updatePlayerStats(socket.id, data);
      this.gameService.broadcastState(this.io);
    });

    socket.on("disconnect", () => {
      this.gameService.removePlayer(socket.id);
      this.gameService.broadcastState(this.io);
    });
  }
}
