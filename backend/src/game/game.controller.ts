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

    // Removido: player:update-stats (ahora solo el servidor modifica stats)
    // Las stats solo se actualizan desde eventos/misiones en el servidor

    socket.on("disconnect", () => {
      this.gameService.removePlayer(socket.id);
      this.gameService.broadcastState(this.io);
    });
  }
}