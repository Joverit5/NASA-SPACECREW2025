import { Server } from "socket.io";
import * as http from "http";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";

export function createGameGateway(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const gameService = new GameService();

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);
    const controller = new GameController(io, gameService);
    controller.registerHandlers(socket);
  });

  return io;
}
