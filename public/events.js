// ========== EVENT SYSTEM ==========
// Sistema de eventos aleatorios para la simulación

// Tipos de eventos disponibles
const EVENT_TYPES = {
  MECHANICAL_FAILURE: "mechanical_failure",
  ELECTRICAL_FAILURE: "electrical_failure",
  FOOD_DISTRIBUTION: "food_distribution",
  PLANET_CONDITIONS: "planet_conditions",
  COSMIC_CONDITIONS: "cosmic_conditions",
}

// Configuración de eventos
const EVENT_CONFIG = {
  mechanical_failure: {
    name: "Falla Mecánica",
    description: "Se ha detectado una falla en los sistemas mecánicos",
    probability: 0.95,
    duration: 60000,
    affectedAreas: ["maintenance", "dock", "storage"],
    effects: {
      oxygen: -2,
      energy: -2,
      fatigue: 2, // Reparar cansa
    },
    color: 0xff6b6b,
    icon: "⚙️",
  },
  electrical_failure: {
    name: "Falla Eléctrica",
    description: "Cortocircuito detectado en el sistema eléctrico",
    probability: 0.95,
    duration: 50000,
    affectedAreas: ["energy", "control"],
    effects: {
      energy: -4,
      oxygen: -1,
      fatigue: 1,
    },
    color: 0xffd93d,
    icon: "⚡",
  },
  food_distribution: {
    name: "Distribución de Alimentos",
    description: "Es hora de distribuir los alimentos a la tripulación",
    probability: 0.86,
    duration: 70000,
    affectedAreas: ["kitchen", "storage"],
    effects: {
      hunger: 5, // Menos comida = más hambre
      sanity: -2, // Menos comida afecta ánimo
    },
    color: 0x6bcf7f,
    icon: "🍽️",
    requiresPlayerAction: true,
  },
  planet_conditions: {
    name: "Condiciones del Planeta",
    description: "Cambios en las condiciones atmosféricas del planeta",
    probability: 0.65,
    duration: 60000,
    affectedAreas: ["dock", "control"],
    effects: {
      oxygen: -2,
      hp: -2, // Temperatura extrema afecta salud
      sanity: -1,
    },
    color: 0x8b4513,
    icon: "🌍",
  },
  cosmic_conditions: {
    name: "Condiciones Cósmicas",
    description: "Radiación cósmica detectada en el área",
    probability: 0.67,
    duration: 75000,
    affectedAreas: ["control", "energy"],
    effects: {
      hp: -3, // Radiación afecta salud
      energy: -2,
      sanity: -2,
    },
    color: 0x9b59b6,
    icon: "☄️",
  },
}

// Estado del sistema de eventos
class EventSystem {
  constructor() {
    this.activeEvents = []
    this.eventHistory = []
    this.isRunning = false
    this.eventTimer = null
    this.checkInterval = 5000 // Verificar cada 15 segundos
    this.minTimeBetweenEvents = 20000 // Mínimo 20 segundos entre eventos
    this.lastEventTime = 0
    this.gameResources = {
      oxygen: 100,
      energy: 100,
      food: 100,
      morale: 100,
      temperature: 20,
      radiation: 0,
    }
    this.SESSION_ID = "default_session_id" // Declare SESSION_ID here
  }

  // Iniciar el sistema de eventos
  start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log("[v0] Event system started")
    this.scheduleNextCheck()
  }

  // Detener el sistema de eventos
  stop() {
    this.isRunning = false
    if (this.eventTimer) {
      clearTimeout(this.eventTimer)
      this.eventTimer = null
    }
    console.log("[v0] Event system stopped")
  }

  // Programar la próxima verificación de eventos
  scheduleNextCheck() {
    if (!this.isRunning) return

    this.eventTimer = setTimeout(() => {
      this.checkForEvents()
      this.scheduleNextCheck()
    }, this.checkInterval)
  }

  // Verificar si debe ocurrir un evento
  checkForEvents() {
    const now = Date.now()

    // Verificar tiempo mínimo entre eventos
    if (now - this.lastEventTime < this.minTimeBetweenEvents) {
      return
    }

    // Limitar eventos activos simultáneos
    if (this.activeEvents.length >= 2) {
      return
    }

    // Intentar generar un evento aleatorio
    const eventType = this.selectRandomEvent()
    if (eventType) {
      this.triggerEvent(eventType)
      this.lastEventTime = now
    }
  }

  // Seleccionar un evento aleatorio basado en probabilidades
  selectRandomEvent() {
    const roll = Math.random()
    let cumulativeProbability = 0

    for (const [type, config] of Object.entries(EVENT_CONFIG)) {
      cumulativeProbability += config.probability
      if (roll <= cumulativeProbability) {
        return type
      }
    }

    return null
  }

  // Disparar un evento
  triggerEvent(eventType) {
    const config = EVENT_CONFIG[eventType]
    if (!config) return

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      config: config,
      startTime: Date.now(),
      endTime: Date.now() + config.duration,
      resolved: false,
      affectedArea: this.selectAffectedArea(config.affectedAreas),
    }

    this.activeEvents.push(event)
    this.eventHistory.push(event)

    console.log(`[v0] Event triggered: ${config.name}`, event)

    // Emitir evento al servidor si está disponible
    if (window.socket && window.socket.emit) {
      window.socket.emit("event_triggered", {
        sessionId: window.SESSION_ID || this.SESSION_ID,
        event: event,
      })
    }

    // Iniciar efectos del evento
    this.startEventEffects(event)

    // Mostrar notificación
    this.showEventNotification(event)

    this.triggerGameCanvasEffect(event)

    return event
  }

  // Seleccionar área afectada aleatoriamente
  selectAffectedArea(areas) {
    if (!areas || areas.length === 0) return null
    return areas[Math.floor(Math.random() * areas.length)]
  }

  // Iniciar efectos del evento
  startEventEffects(event) {
    const effectInterval = setInterval(() => {
      if (event.resolved || Date.now() >= event.endTime) {
        clearInterval(effectInterval)
        this.resolveEvent(event.id)
        return
      }

      // Aplicar efectos cada segundo
      this.applyEventEffects(event)
    }, 1000)

    event.effectInterval = effectInterval
  }

  // Aplicar efectos del evento a los recursos y a las variables del jugador (HUD)
  applyEventEffects(event) {
    const effects = event.config.effects;
    if (!effects) return;

    // Actualizar recursos internos (legacy, si se usan en algún lado)
    for (const [resource, change] of Object.entries(effects)) {
      if (this.gameResources.hasOwnProperty(resource)) {
        this.gameResources[resource] += change;
        this.gameResources[resource] = Math.max(0, Math.min(100, this.gameResources[resource]));
      }
    }

    // Actualizar variables del HUD del jugador si existen en window.playerStats
    if (window.playerStats && typeof window.updateHUD === 'function') {
      for (const [stat, change] of Object.entries(effects)) {
        // Solo afectar stats válidos
        if (window.playerStats.hasOwnProperty(stat)) {
          window.playerStats[stat] += change;
          window.playerStats[stat] = Math.max(0, Math.min(100, window.playerStats[stat]));
        }
      }
      window.updateHUD();
    }
    // Si no existe, solo actualiza recursos internos
    this.updateResourcesUI();
  }

  // Resolver un evento (manual o automático)
  resolveEvent(eventId, manual = false) {
    const eventIndex = this.activeEvents.findIndex((e) => e.id === eventId)
    if (eventIndex === -1) return

    const event = this.activeEvents[eventIndex]
    event.resolved = true
    event.resolvedManually = manual

    // Limpiar intervalo de efectos
    if (event.effectInterval) {
      clearInterval(event.effectInterval)
    }

    // Remover de eventos activos
    this.activeEvents.splice(eventIndex, 1)

    console.log(`[v0] Event resolved: ${event.config.name}`, { manual })

    // Ocultar notificación
    this.hideEventNotification(eventId)

    this.showResolveEffect(event, manual)

    // Emitir resolución al servidor
    if (window.socket && window.socket.emit) {
      window.socket.emit("event_resolved", {
        sessionId: window.SESSION_ID || this.SESSION_ID,
        eventId: eventId,
        manual: manual,
      })
    }
  }

  triggerGameCanvasEffect(event) {
    // Crear overlay de alerta en el canvas
    const gameCanvas = document.getElementById("game")
    if (!gameCanvas) return

    const overlay = document.createElement("div")
    overlay.className = "event-canvas-overlay"
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: eventPulse 2s ease-out;
    `

    const alertBanner = document.createElement("div")
    alertBanner.style.cssText = `
      background: linear-gradient(135deg, #${event.config.color.toString(16)} 0%, #${(event.config.color - 0x303030).toString(16)} 100%);
      padding: 20px 40px;
      border-radius: 12px;
      border: 3px solid #${event.config.color.toString(16)};
      box-shadow: 0 0 30px rgba(${(event.config.color >> 16) & 255}, ${(event.config.color >> 8) & 255}, ${event.config.color & 255}, 0.6);
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      animation: eventBannerSlide 0.5s ease-out;
    `
    alertBanner.innerHTML = `
      <div style="font-size: 36px; margin-bottom: 8px;">${event.config.icon}</div>
      <div>${event.config.name}</div>
    `

    overlay.appendChild(alertBanner)
    gameCanvas.parentElement.style.position = "relative"
    gameCanvas.parentElement.appendChild(overlay)

    // Remover después de la animación
    setTimeout(() => {
      overlay.style.animation = "eventFadeOut 0.5s ease-out"
      setTimeout(() => overlay.remove(), 500)
    }, 2000)
  }

  showResolveEffect(event, manual) {
    const gameCanvas = document.getElementById("game")
    if (!gameCanvas) return

    const successOverlay = document.createElement("div")
    successOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1001;
      animation: successPop 0.6s ease-out;
    `

    const successIcon = document.createElement("div")
    successIcon.style.cssText = `
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      padding: 30px;
      border-radius: 50%;
      border: 4px solid #4CAF50;
      box-shadow: 0 0 40px rgba(76, 175, 80, 0.8);
      color: white;
      font-size: 48px;
      text-align: center;
    `
    successIcon.textContent = manual ? "✓" : "⏱️"

    successOverlay.appendChild(successIcon)
    gameCanvas.parentElement.appendChild(successOverlay)

    setTimeout(() => successOverlay.remove(), 600)
  }

  // Mostrar evento como banner integrado en la parte superior del canvas
  showEventNotification(event) {
    const gameCanvas = document.getElementById("game");
    if (!gameCanvas) return;

    // Eliminar cualquier banner anterior
    let oldBanner = document.getElementById("event-banner");
    if (oldBanner) oldBanner.remove();

    // Crear banner
    const banner = document.createElement("div");
    banner.id = "event-banner";
    banner.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 520px;
      max-width: 90vw;
      background: linear-gradient(90deg, #${event.config.color.toString(16)} 0%, #222 100%);
      color: #fff;
      border-radius: 0 0 18px 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 2000;
      padding: 22px 32px 18px 32px;
      display: flex;
      align-items: flex-start;
      gap: 18px;
      font-family: inherit;
      animation: eventBannerDrop 0.7s cubic-bezier(.7,1.7,.5,1) both;
      border-bottom: 4px solid #${event.config.color.toString(16)};
    `;
    banner.innerHTML = `
      <div style="font-size: 48px;">${event.config.icon}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 6px; text-shadow: 0 2px 8px #000a;">${event.config.name}</div>
        <div style="font-size: 15px; opacity: 0.96; margin-bottom: 8px;">${event.config.description}</div>
        <div style="font-size: 13px; opacity: 0.85; margin-bottom: 10px;">
          📍 <b>${event.affectedArea || "General"}</b> &nbsp;|&nbsp; ⏱️ <b><span class="time-remaining">${Math.ceil((event.endTime - Date.now()) / 1000)}s</span></b>
        </div>
        <button id="resolve-event-btn" style="
          background: #fff;
          color: #${event.config.color.toString(16)};
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: bold;
          padding: 10px 24px;
          margin-top: 2px;
          cursor: pointer;
          box-shadow: 0 2px 8px #0002;
          transition: all 0.18s;
        ">Resolver evento</button>
      </div>
    `;

    // Insertar banner en el DOM
    gameCanvas.parentElement.style.position = "relative";
    gameCanvas.parentElement.appendChild(banner);

    // Botón de resolver
    banner.querySelector('#resolve-event-btn').onclick = () => {
      window.eventSystem.resolveEvent(event.id, true);
    };

    // Actualizar temporizador
    const timerEl = banner.querySelector('.time-remaining');
    const timerInterval = setInterval(() => {
      const remaining = Math.ceil((event.endTime - Date.now()) / 1000);
      if (timerEl && remaining > 0) {
        timerEl.textContent = `${remaining}s`;
        if (remaining <= 10) {
          timerEl.style.color = "#ff4444";
          timerEl.style.fontWeight = "bold";
          timerEl.style.animation = "pulse 0.5s infinite";
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  // Ocultar banner de evento
  hideEventNotification(eventId) {
    const banner = document.getElementById("event-banner");
    if (banner) {
      banner.style.animation = "eventBannerUp 0.5s cubic-bezier(.7,1.7,.5,1) both";
      setTimeout(() => banner.remove(), 400);
    }
  }
}

  
// Animación para el banner (inyectada globalmente)
var eventBannerStyle = document.createElement('style');
eventBannerStyle.textContent = "\n@keyframes eventBannerDrop {\n  0% { transform: translateX(-50%) translateY(-80px); opacity: 0; }\n  100% { transform: translateX(-50%) translateY(0); opacity: 1; }\n}\n@keyframes eventBannerUp {\n  0% { transform: translateX(-50%) translateY(0); opacity: 1; }\n  100% { transform: translateX(-50%) translateY(-80px); opacity: 0; }\n}\n";
document.head.appendChild(eventBannerStyle);

// Crear instancia global del sistema de eventos
window.eventSystem = new EventSystem()

// Agregar estilos CSS para animaciones
const style = document.createElement("style")
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .event-notification:hover {
    transform: scale(1.02);
    transition: transform 0.2s ease;
  }

  @keyframes eventPulse {
    0% {
      background: rgba(255, 0, 0, 0.3);
    }
    50% {
      background: rgba(255, 0, 0, 0.1);
    }
    100% {
      background: rgba(255, 0, 0, 0);
    }
  }

  @keyframes eventBannerSlide {
    0% {
      transform: translateY(-100px) scale(0.8);
      opacity: 0;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  @keyframes eventFadeOut {
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }

  @keyframes successPop {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .resolve-button:active {
    transform: scale(0.95) !important;
  }
`
document.head.appendChild(style)

console.log("[v0] Event system loaded")
