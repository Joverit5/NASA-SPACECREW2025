import { io, Socket } from "socket.io-client";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types";

// 🔹 Cliente
export function createClientSocket(url: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(url, { transports: ["websocket"] });
}

// 🔹 Servidor
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
