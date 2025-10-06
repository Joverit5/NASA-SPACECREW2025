// ========== EVENT SYSTEM ==========
// Sistema de eventos integrado con el sidebar HTML

const EVENT_TYPES = {
  MECHANICAL_FAILURE: "mechanical_failure",
  ELECTRICAL_FAILURE: "electrical_failure",
  FOOD_DISTRIBUTION: "food_distribution",
  PLANET_CONDITIONS: "planet_conditions",
  COSMIC_CONDITIONS: "cosmic_conditions",
}

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
      fatigue: 2,
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
      hunger: 5,
      sanity: -2,
    },
    color: 0x6bcf7f,
    icon: "🍽️",
  },
  planet_conditions: {
    name: "Condiciones del Planeta",
    description: "Cambios en las condiciones atmosféricas del planeta",
    probability: 0.65,
    duration: 60000,
    affectedAreas: ["dock", "control"],
    effects: {
      oxygen: -2,
      hp: -2,
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
      hp: -3,
      energy: -2,
      sanity: -2,
    },
    color: 0x9b59b6,
    icon: "☄️",
  },
}

class EventSystem {
  constructor() {
    this.activeEvents = []
    this.eventHistory = []
    this.isRunning = false
    this.eventTimer = null
    this.checkInterval = 5000
    this.minTimeBetweenEvents = 20000
    this.lastEventTime = 0
    this.gameResources = {
      oxygen: 100,
      energy: 100,
      food: 100,
      morale: 100,
      temperature: 20,
      radiation: 0,
    }
    this.SESSION_ID = "default_session_id"
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log("[Event] Sistema de eventos iniciado")
    this.scheduleNextCheck()
  }

  stop() {
    this.isRunning = false
    if (this.eventTimer) {
      clearTimeout(this.eventTimer)
      this.eventTimer = null
    }
    console.log("[Event] Sistema de eventos detenido")
  }

  scheduleNextCheck() {
    if (!this.isRunning) return

    this.eventTimer = setTimeout(() => {
      this.checkForEvents()
      this.scheduleNextCheck()
    }, this.checkInterval)
  }

  checkForEvents() {
    const now = Date.now()

    if (now - this.lastEventTime < this.minTimeBetweenEvents) {
      return
    }

    if (this.activeEvents.length >= 2) {
      return
    }

    const eventType = this.selectRandomEvent()
    if (eventType) {
      this.triggerEvent(eventType)
      this.lastEventTime = now
    }
  }

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

    console.log(`[Event] Evento disparado: ${config.name}`, event)

    if (window.socket && window.socket.emit) {
      window.socket.emit("event_triggered", {
        sessionId: window.SESSION_ID || this.SESSION_ID,
        event: event,
      })
    }

    this.startEventEffects(event)
    this.showEventInSidebar(event)

    return event
  }

  selectAffectedArea(areas) {
    if (!areas || areas.length === 0) return null
    return areas[Math.floor(Math.random() * areas.length)]
  }

  startEventEffects(event) {
    const effectInterval = setInterval(() => {
      if (event.resolved || Date.now() >= event.endTime) {
        clearInterval(effectInterval)
        this.resolveEvent(event.id)
        return
      }

      this.applyEventEffects(event)
    }, 1000)

    event.effectInterval = effectInterval
  }

  applyEventEffects(event) {
    const effects = event.config.effects;
    if (!effects) return;

    for (const [resource, change] of Object.entries(effects)) {
      if (this.gameResources.hasOwnProperty(resource)) {
        this.gameResources[resource] += change;
        this.gameResources[resource] = Math.max(0, Math.min(100, this.gameResources[resource]));
      }
    }

    if (window.playerStats && typeof window.updateHUD === 'function') {
      for (const [stat, change] of Object.entries(effects)) {
        if (window.playerStats.hasOwnProperty(stat)) {
          window.playerStats[stat] += change;
          window.playerStats[stat] = Math.max(0, Math.min(100, window.playerStats[stat]));
        }
      }
      window.updateHUD();
    }
  }

  resolveEvent(eventId, manual = false) {
    const eventIndex = this.activeEvents.findIndex((e) => e.id === eventId)
    if (eventIndex === -1) return

    const event = this.activeEvents[eventIndex]
    event.resolved = true
    event.resolvedManually = manual

    if (event.effectInterval) {
      clearInterval(event.effectInterval)
    }

    this.activeEvents.splice(eventIndex, 1)

    console.log(`[Event] Evento resuelto: ${event.config.name}`, { manual })

    this.removeEventFromSidebar(eventId)

    if (window.socket && window.socket.emit) {
      window.socket.emit("event_resolved", {
        sessionId: window.SESSION_ID || this.SESSION_ID,
        eventId: eventId,
        manual: manual,
      })
    }
  }

  showEventInSidebar(event) {
    const eventsList = document.getElementById("events-list");
    if (!eventsList) return;

    // Eliminar mensaje de "sin eventos"
    const placeholder = eventsList.querySelector('div[style*="text-align: center"]');
    if (placeholder) placeholder.remove();

    const eventCard = document.createElement("div");
    eventCard.className = "event-card";
    eventCard.id = `event-${event.id}`;

    const remainingTime = Math.ceil((event.endTime - Date.now()) / 1000);

    eventCard.innerHTML = `
      <div class="event-header">${event.config.icon} ${event.config.name}</div>
      <div class="event-description">${event.config.description}</div>
      <div class="event-timer" id="timer-${event.id}">⏱️ ${remainingTime}s restantes</div>
      <button class="event-resolve-btn" onclick="window.eventSystem.resolveEvent('${event.id}', true)">
        Resolver Ahora
      </button>
    `;

    eventsList.appendChild(eventCard);

    // Actualizar timer
    const timerInterval = setInterval(() => {
      const remaining = Math.ceil((event.endTime - Date.now()) / 1000);
      const timerEl = document.getElementById(`timer-${event.id}`);
      if (timerEl && remaining > 0) {
        timerEl.textContent = `⏱️ ${remaining}s restantes`;
        if (remaining <= 10) {
          timerEl.style.color = "#ff4444";
          timerEl.style.fontWeight = "bold";
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    event.timerInterval = timerInterval;
  }

  removeEventFromSidebar(eventId) {
    const eventCard = document.getElementById(`event-${eventId}`);
    if (eventCard) {
      eventCard.style.transition = "opacity 0.3s, transform 0.3s";
      eventCard.style.opacity = "0";
      eventCard.style.transform = "translateX(-20px)";
      setTimeout(() => eventCard.remove(), 300);
    }

    // Si no quedan eventos, mostrar placeholder
    const eventsList = document.getElementById("events-list");
    if (eventsList && eventsList.children.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; color: #9aa7b2; font-size: 12px; padding: 10px;">
          Sin eventos
        </div>
      `;
    }
  }
}

window.eventSystem = new EventSystem()
window._eventsLoaded = true;

console.log("[Event] Sistema de eventos cargado");