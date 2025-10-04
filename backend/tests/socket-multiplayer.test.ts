import * as http from "http";
import { io as Client, Socket } from "socket.io-client";
import { createGameGateway } from "../src/game/game.gateway";

describe("Socket.IO multiplayer integration", () => {
  let httpServer: http.Server;
  let ioServer: any;
  const URL = "http://localhost:4000";
  const MAX_PLAYERS = 5;
  const clients: Socket[] = [];

  beforeAll(async () => {
    httpServer = http.createServer();
    ioServer = createGameGateway(httpServer);
    await new Promise<void>((resolve) =>
      httpServer.listen(4000, () => {
        console.log("🟢 Servidor listo en puerto 4000");
        resolve();
      })
    );
  });

  afterAll(async () => {
    // 🔴 Cerrar clientes y servidor
    clients.forEach((s) => s.disconnect());
    ioServer.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    // 🔧 Limpieza global de timers por seguridad
    jest.clearAllTimers();
  });

  it(
    "sincroniza movimientos y estadísticas de hasta 5 jugadores",
    async () => {
      const stateUpdates: any[] = [];
      let finalStateResolver: ((state: any) => void) | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let testCompleted = false; // ✅ bandera para evitar ejecuciones tardías

      // 🧩 Promesa que se resuelve o rechaza por timeout
      const finalStatePromise = new Promise<any>((resolve, reject) => {
        finalStateResolver = (state) => {
          if (!testCompleted) {
            testCompleted = true;
            clearTimeout(timeoutId!); // ✅ limpiar el timeout cuando el test termina
            resolve(state);
          }
        };

        timeoutId = setTimeout(() => {
          if (!testCompleted) {
            testCompleted = true;
            console.log(
              `❌ Timeout. Se recibieron ${stateUpdates.length} updates`
            );
            reject(new Error("Timeout: No se recibió state:update completo"));
          }
        }, 5000);
      });

      // 2️⃣ Conectar jugadores
      for (let i = 0; i < MAX_PLAYERS; i++) {
        const socket = Client(URL);
        clients.push(socket);

        await new Promise<void>((resolve) => {
          socket.on("connect", () => {
            console.log(`✅ Cliente ${i + 1} conectado: ${socket.id}`);
            resolve();
          });
        });

        // Listener en el PRIMER cliente
        if (i === 0) {
          socket.on("state:update", (state) => {
            stateUpdates.push(state);
            const playersList = Object.values(state.players);
            console.log(
              `🔄 Update #${stateUpdates.length}: ${playersList.length} jugadores`
            );

            playersList.forEach((p: any, idx) => {
              console.log(`  Jugador ${idx + 1}: x=${p.x}, y=${p.y}`);
            });

            if (playersList.length === MAX_PLAYERS) {
              const updatedCount = playersList.filter(
                (p: any) => p.x > 0 || p.y > 0
              ).length;

              console.log(`✓ ${updatedCount}/${MAX_PLAYERS} actualizados`);

              if (updatedCount >= MAX_PLAYERS - 1) {
                finalStateResolver?.(state);
              }
            }
          });
        }
      }

      console.log("🎮 Todos los jugadores conectados.");
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 3️⃣ Emitir eventos
      console.log("📤 Emitiendo movimientos y estadísticas...");
      clients.forEach((socket, i) => {
        socket.emit("player:move", { dx: i, dy: i * 2, direction: "right" });
        socket.emit("player:update-stats", {
          health: 100 - i * 10,
          oxygen: 100 - i * 5,
          hunger: 50 + i * 5,
          energy: 90 - i * 3,
          sanity: 100 - i * 2,
          fatigue: i * 4,
        });
      });

      // 4️⃣ Esperar resultado final
      console.log("⏳ Esperando estado final...");
      const finalState = await finalStatePromise;

      // 5️⃣ Validaciones
      const players = Object.values(finalState.players);
      expect(players.length).toBe(MAX_PLAYERS);

      const playersBySocketId = new Map();
      clients.forEach((socket, index) => {
        playersBySocketId.set(socket.id, index);
      });

      players.forEach((p: any) => {
        const index = playersBySocketId.get(p.id);
        console.log(
          `📊 Jugador ${index + 1} -> X:${p.x} | Y:${p.y} | HP:${p.health} | O2:${p.oxygen}`
        );

        expect(p.x).toBe(index);
        expect(p.y).toBe(index * 2);
        expect(p.health).toBe(100 - index * 10);
        expect(p.oxygen).toBe(100 - index * 5);
      });

      console.log("✅ Estado sincronizado correctamente entre todos los jugadores.");

      // ✅ Limpieza segura al final
      testCompleted = true;
      if (timeoutId) clearTimeout(timeoutId);
    },
    20000
  );
});
