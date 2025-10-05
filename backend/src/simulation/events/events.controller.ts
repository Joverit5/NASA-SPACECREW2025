import { Socket } from "socket.io";
import { EventsService } from "./events.service";
import { EventType } from "./event-bank";

export class EventsController {
  constructor(
    private socket: Socket,
    private eventsService: EventsService
  ) {
    this.registerHandlers();
  }

  private registerHandlers() {
    // Cliente solicita resolver un evento manualmente
    this.socket.on("event:resolve", (data: { eventId: string }) => {
      console.log(`📨 event:resolve received from ${this.socket.id}:`, data.eventId);
      
      if (!data.eventId) {
        console.warn("⚠️ event:resolve missing eventId");
        return;
      }

      this.eventsService.resolveEvent(data.eventId, true);
    });

    // Cliente solicita lista de eventos activos
    this.socket.on("event:get_active", () => {
      const activeEvents = this.eventsService.getActiveEvents();
      this.socket.emit("event:active_list", activeEvents);
    });

    // Cliente solicita historial de eventos
    this.socket.on("event:get_history", () => {
      const history = this.eventsService.getEventHistory();
      this.socket.emit("event:history_list", history);
    });

    // Debug: forzar un evento específico (solo en desarrollo)
    this.socket.on("event:force", (data: { eventType: EventType }) => {
      if (process.env.NODE_ENV === "production") {
        console.warn("⚠️ event:force not allowed in production");
        return;
      }

      console.log(`🔧 Forcing event: ${data.eventType}`);
      this.eventsService.forceEvent(data.eventType);
    });
  }
}