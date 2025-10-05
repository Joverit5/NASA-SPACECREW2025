import clientIo from "socket.io-client";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types";

// 🔹 Cliente
export function createClientSocket(url: string): ReturnType<typeof clientIo> {
  return clientIo(url, { transports: ["websocket"] });
}

// 🔹 Servidor
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
