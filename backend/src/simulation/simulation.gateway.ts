import { Server, Socket } from "socket.io";
import { GameService } from "../game/game.service";
import { EventsService } from "./events/events.service";
import { EventsController } from "./events/events.controller";
import { MissionsService } from "./missions/missions.service";
import { MissionsController } from "./missions/missions.controller";

export class SimulationGateway {
  private eventsService: EventsService;
  private missionsService: MissionsService;
  
  constructor(
    private io: Server,
    private gameService: GameService
  ) {
    // Inicializar servicios
    this.eventsService = new EventsService(io, gameService);
    this.missionsService = new MissionsService(io, gameService);
    
    console.log("🎮 Simulation gateway initialized");
  }

  // Iniciar todos los sistemas de simulación
  start() {
    console.log("🚀 Starting simulation systems...");
    
    // Iniciar sistema de eventos
    this.eventsService.start();
    
    // Iniciar sistema de misiones
    this.missionsService.start();
    
    console.log("✅ All simulation systems started");
  }

  // Detener todos los sistemas de simulación
  stop() {
    console.log("🛑 Stopping simulation systems...");
    
    this.eventsService.stop();
    this.missionsService.stop();
    
    console.log("✅ All simulation systems stopped");
  }

  // Registrar handlers de socket para un cliente
  registerClientHandlers(socket: Socket) {
    // Registrar controllers para eventos
    new EventsController(socket, this.eventsService);
    
    // Registrar controllers para misiones
    new MissionsController(socket, this.missionsService);
    
    // Handler para iniciar la simulación
    socket.on("simulation:start", (data?: { 
      sessionId?: string;
      playerRoles?: string[];
      placedAreas?: string[];
    }) => {
      console.log(`🎬 Client ${socket.id} requested simulation start`);
      this.start();
      
      // Si se proporcionan datos de inicialización, asignar misiones
      if (data && data.playerRoles && data.placedAreas) {
        console.log("📋 Initializing missions with data:", {
          sessionId: data.sessionId,
          playerCount: data.playerRoles.length,
          areasCount: data.placedAreas.length
        });
        
        const missions = this.missionsService.assignMissions(
          data.sessionId || "default_session",
          data.playerRoles,
          data.placedAreas
        );
        
        console.log(`✅ Assigned ${missions.length} missions`);
      } else {
        console.warn("⚠️ simulation:start called without initialization data");
      }
      
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
    
    // Handler para inicializar misiones (puede llamarse después de start)
    socket.on("missions:initialize", (data: {
      sessionId: string;
      playerRoles: string[];
      placedAreas: string[];
    }) => {
      console.log(`📋 Client ${socket.id} requested mission initialization`);
      console.log("   Data:", data);
      
      if (!data.playerRoles || !data.placedAreas) {
        console.warn("⚠️ missions:initialize missing required data");
        socket.emit("missions:initialize_failed", {
          reason: "Missing playerRoles or placedAreas"
        });
        return;
      }
      
      const missions = this.missionsService.assignMissions(
        data.sessionId,
        data.playerRoles,
        data.placedAreas
      );
      
      console.log(`✅ Initialized ${missions.length} missions`);
      
      socket.emit("missions:initialized", {
        success: true,
        count: missions.length
      });
    });
    
    // Handler para obtener estado completo de la simulación
    socket.on("simulation:get_state", () => {
      const activeEvents = this.eventsService.getActiveEvents();
      const activeMissions = this.missionsService.getActiveMissions();
      
      socket.emit("simulation:state", {
        events: {
          active: activeEvents,
          history: this.eventsService.getEventHistory()
        },
        missions: {
          active: activeMissions,
          history: this.missionsService.getMissionHistory()
        }
      });
    });
    
    console.log(`📡 Simulation handlers registered for ${socket.id}`);
  }

  // Getters para acceder a los servicios desde otros módulos
  getEventsService(): EventsService {
    return this.eventsService;
  }

  getMissionsService(): MissionsService {
    return this.missionsService;
  }
}