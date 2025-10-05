import { Server } from "socket.io";
import { GameService } from "../game/game.service";
import { EventsService } from "./events/events.service";
import { EventsController } from "./events/events.controller";

export class SimulationGateway {
  private eventsService: EventsService;
  
  constructor(
    private io: Server,
    private gameService: GameService
  ) {
    // Inicializar servicios
    this.eventsService = new EventsService(io, gameService);
    
    console.log("🎮 Simulation gateway initialized");
  }

  // Iniciar todos los sistemas de simulación
  start() {
    console.log("🚀 Starting simulation systems...");
    
    // Iniciar sistema de eventos
    this.eventsService.start();
    
    console.log("✅ All simulation systems started");
  }

  // Detener todos los sistemas de simulación
  stop() {
    console.log("🛑 Stopping simulation systems...");
    
    this.eventsService.stop();
    
    console.log("✅ All simulation systems stopped");
  }

  // Registrar handlers de socket para un cliente
  registerClientHandlers(socket: any) {
    // Registrar controllers para eventos
    new EventsController(socket, this.eventsService);
    
    // Handler para iniciar la simulación
    socket.on("simulation:start", () => {
      console.log(`🎬 Client ${socket.id} requested simulation start`);
      this.start();
      
      // Confirmar al cliente
      socket.emit("simulation:started", { success: true });
    });
    
    // Handler para detener la simulación
    socket.on("simulation:stop", () => {
      console.log(`🛑 Client ${socket.id} requested simulation stop`);
      this.stop();
      
      // Confirmar al cliente
      socket.emit("simulation:stopped", { success: true });
    });
    
    console.log(`📡 Simulation handlers registered for ${socket.id}`);
  }

  // Getters para acceder a los servicios desde otros módulos
  getEventsService(): EventsService {
    return this.eventsService;
  }
}