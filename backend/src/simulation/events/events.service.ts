import { Server } from "socket.io";
import { GameService } from "../../game/game.service";
import { EVENT_BANK, EventType, ActiveEvent, getEventProbabilities } from "./event-bank";

export class EventsService {
  private activeEvents: Map<string, ActiveEvent> = new Map();
  private eventHistory: ActiveEvent[] = [];
  private isRunning: boolean = false;
  private eventCheckTimer: NodeJS.Timeout | null = null;
  
  // Configuración
  private readonly CHECK_INTERVAL = 15000; // 15 segundos
  private readonly MIN_TIME_BETWEEN_EVENTS = 20000; // 20 segundos
  private readonly MAX_CONCURRENT_EVENTS = 2; // Máximo 2 eventos activos a la vez
  
  private lastEventTime: number = 0;

  constructor(
    private io: Server,
    private gameService: GameService
  ) {}

  // Iniciar el sistema de eventos
  start() {
    if (this.isRunning) {
      console.log("⚠️ Event system already running");
      return;
    }

    this.isRunning = true;
    console.log("🎬 Event system started");
    this.scheduleNextCheck();
  }

  // Detener el sistema de eventos
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.eventCheckTimer) {
      clearTimeout(this.eventCheckTimer);
      this.eventCheckTimer = null;
    }

    // Limpiar intervalos de efectos activos
    this.activeEvents.forEach(event => {
      if ((event as any).effectInterval) {
        clearInterval((event as any).effectInterval);
      }
    });

    console.log("🛑 Event system stopped");
  }

  // Programar próxima verificación de eventos
  private scheduleNextCheck() {
    if (!this.isRunning) return;

    this.eventCheckTimer = setTimeout(() => {
      this.checkForEvents();
      this.scheduleNextCheck();
    }, this.CHECK_INTERVAL);
  }

  // Verificar si debe ocurrir un evento
  private checkForEvents() {
    const now = Date.now();

    // Verificar tiempo mínimo entre eventos
    if (now - this.lastEventTime < this.MIN_TIME_BETWEEN_EVENTS) {
      return;
    }

    // Limitar eventos activos simultáneos
    if (this.activeEvents.size >= this.MAX_CONCURRENT_EVENTS) {
      return;
    }

    // Intentar generar un evento aleatorio
    const eventType = this.selectRandomEvent();
    if (eventType) {
      this.triggerEvent(eventType);
      this.lastEventTime = now;
    }
  }

  // Seleccionar un evento aleatorio basado en probabilidades
  private selectRandomEvent(): EventType | null {
    const roll = Math.random();
    const probabilities = getEventProbabilities();

    for (const { type, cumulativeProbability } of probabilities) {
      if (roll <= cumulativeProbability) {
        return type;
      }
    }

    return null;
  }

  // Disparar un evento
  triggerEvent(eventType: EventType): ActiveEvent {
    const config = EVENT_BANK[eventType];
    const now = Date.now();

    const event: ActiveEvent = {
      id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      config: config,
      startTime: now,
      endTime: now + config.duration,
      resolved: false,
      affectedArea: this.selectAffectedArea(config.affectedAreas),
    };

    this.activeEvents.set(event.id, event);
    this.eventHistory.push(event);

    console.log(`🎪 Event triggered: ${config.name} (${event.id})`);

    // Emitir evento a todos los clientes
    this.io.emit("event:triggered", event);

    // Iniciar efectos del evento
    this.startEventEffects(event);

    return event;
  }

  // Seleccionar área afectada aleatoriamente
  private selectAffectedArea(areas: string[]): string | null {
    if (!areas || areas.length === 0) return null;
    return areas[Math.floor(Math.random() * areas.length)];
  }

  // Iniciar efectos del evento (aplica efectos cada segundo)
  private startEventEffects(event: ActiveEvent) {
    const effectInterval = setInterval(() => {
      if (event.resolved || Date.now() >= event.endTime) {
        clearInterval(effectInterval);
        this.resolveEvent(event.id, false);
        return;
      }

      // Aplicar efectos a todos los jugadores conectados
      this.applyEventEffects(event);
    }, 40000); // Cada 40 segundos

    // Guardar referencia al intervalo
    (event as any).effectInterval = effectInterval;
  }

  // Aplicar efectos del evento a todos los jugadores
  private applyEventEffects(event: ActiveEvent) {
    const effects = event.config.effects;
    
    if (!effects || Object.keys(effects).length === 0) {
      return;
    }

    const state = this.gameService.getState();
    const playerIds = Object.keys(state.players);

    playerIds.forEach(playerId => {
      this.gameService.applyStatsEffects(playerId, effects);
    });
  }

  // Resolver un evento (manual o automático)
  resolveEvent(eventId: string, manual: boolean = false) {
    const event = this.activeEvents.get(eventId);
    if (!event) {
      console.warn(`⚠️ Event ${eventId} not found`);
      return;
    }

    event.resolved = true;
    event.resolvedManually = manual;

    // Limpiar intervalo de efectos
    if ((event as any).effectInterval) {
      clearInterval((event as any).effectInterval);
    }

    // Remover de eventos activos
    this.activeEvents.delete(eventId);

    console.log(`✅ Event resolved: ${event.config.name} (manual: ${manual})`);

    // Emitir resolución a todos los clientes
    this.io.emit("event:resolved", {
      eventId: eventId,
      manual: manual,
    });
  }

  // Obtener eventos activos
  getActiveEvents(): ActiveEvent[] {
    return Array.from(this.activeEvents.values());
  }

  // Obtener historial de eventos
  getEventHistory(): ActiveEvent[] {
    return this.eventHistory;
  }

  // Forzar trigger de un evento específico (útil para testing)
  forceEvent(eventType: EventType): ActiveEvent {
    console.log(`🔧 Forcing event: ${eventType}`);
    return this.triggerEvent(eventType);
  }
}