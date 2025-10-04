import * as http from "http";
import { io as Client, Socket } from "socket.io-client";
import { createGameGateway } from "../src/game/game.gateway";

describe("Socket.IO multiplayer integration", () => {
  let httpServer: http.Server;
  let ioServer: any;
  let socket1: Socket;
  let socket2: Socket;
  const URL = "http://localhost:4000";

  beforeAll((done) => {
    httpServer = http.createServer();
    ioServer = createGameGateway(httpServer);
    httpServer.listen(4000, () => {
        console.log("Servidor listo en puerto 4000");
        done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  it("permite conectar dos jugadores y sincronizar estado", (done) => {
    socket1 = Client(URL);
    socket2 = Client(URL);

    let updateCount = 0;

    socket1.on("state:update", (state) => {
      updateCount++;
      if (updateCount === 2) {
        expect(Object.keys(state.players).length).toBe(2);
        socket1.disconnect();
        socket2.disconnect();
        done();
      }
    });

    socket1.emit("player:move", { dx: 5, dy: 0, direction: "right" });
    socket2.emit("player:move", { dx: -3, dy: 2, direction: "up" });
  });
});
