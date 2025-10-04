import { createServer } from "http";
import { Server } from "socket.io";
/*import Client, { Socket } from "socket.io-client";*/
import Client from "socket.io-client";
import { ChatGateway } from "../src/chat/chat.gateway";
import type { Socket } from "socket.io-client";

describe("ChatGateway (Sockets)", () => {
  let io: Server, serverSocket: any, httpServer: any, httpServerAddr: any;
  let clientSocket: ReturnType<typeof Client>;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    const { ChatService } = require("../src/chat/chat.service");
    const chatService = new ChatService();
    new ChatGateway(io, chatService); // inicializar gateway real

    httpServer.listen(() => {
      httpServerAddr = httpServer.address();
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach((done) => {
    clientSocket = Client(`http://[::1]:${httpServerAddr.port}`);
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("debe recibir mensajes broadcast en la sala", (done) => {
    const sessionId = "sala-test";
    const playerId = "p1";

    clientSocket.emit("join_session", { sessionId, player: { id: playerId, name: "Isa" } });

    interface ChatMessageBroadcast {
        sessionId: string;
        playerId: string;
        text: string;
    }

    clientSocket.on("chat_message_broadcast", (msg: ChatMessageBroadcast) => {
        expect(msg.playerId).toBe(playerId);
        expect(msg.text).toBe("hola desde test");
        done();
    });

    clientSocket.emit("chat_message", { sessionId, playerId, text: "hola desde test" });
  });
});
