// Definiciones de eventos del sistema de simulación

export enum EventType {
  MECHANICAL_FAILURE = "mechanical_failure",
  ELECTRICAL_FAILURE = "electrical_failure",
  FOOD_DISTRIBUTION = "food_distribution",
  PLANET_CONDITIONS = "planet_conditions",
  COSMIC_CONDITIONS = "cosmic_conditions",
}

export interface EventConfig {
  name: string;
  description: string;
  probability: number; // 0-1
  duration: number; // milliseconds
  affectedAreas: string[];
  effects: {
    health?: number;
    oxygen?: number;
    hunger?: number;
    energy?: number;
    sanity?: number;
    fatigue?: number;
  };
  color: number; // hex color
  icon: string;
  requiresPlayerAction?: boolean;
}

export interface ActiveEvent {
  id: string;
  type: EventType;
  config: EventConfig;
  startTime: number;
  endTime: number;
  resolved: boolean;
  resolvedManually?: boolean;
  affectedArea: string | null;
}

// Banco de configuraciones de eventos
export const EVENT_BANK: Record<EventType, EventConfig> = {
  [EventType.MECHANICAL_FAILURE]: {
    name: "Falla Mecánica",
    description: "Se ha detectado una falla en los sistemas mecánicos",
    probability: 0.15,
    duration: 60000, // 60 segundos
    affectedAreas: ["Maintenance", "Dock", "Storage"],
    effects: {
      oxygen: -2,
      energy: -2,
      fatigue: 2,
    },
    color: 0xff6b6b,
    icon: "⚙️",
  },
  
  [EventType.ELECTRICAL_FAILURE]: {
    name: "Falla Eléctrica",
    description: "Cortocircuito detectado en el sistema eléctrico",
    probability: 0.35,
    duration: 50000,
    affectedAreas: ["Energy", "Control"],
    effects: {
      energy: -4,
      oxygen: -1,
      fatigue: 1,
    },
    color: 0xffd93d,
    icon: "⚡",
  },
  
  [EventType.FOOD_DISTRIBUTION]: {
    name: "Distribución de Alimentos",
    description: "Es hora de distribuir los alimentos a la tripulación",
    probability: 0.20,
    duration: 70000,
    affectedAreas: ["Kitchen", "Storage"],
    effects: {
      hunger: 5,
      sanity: -2,
    },
    color: 0x6bcf7f,
    icon: "🍽️",
    requiresPlayerAction: true,
  },
  
  [EventType.PLANET_CONDITIONS]: {
    name: "Condiciones del Planeta",
    description: "Cambios en las condiciones atmosféricas del planeta",
    probability: 0.21,
    duration: 60000,
    affectedAreas: ["Dock", "Control"],
    effects: {
      oxygen: -2,
      health: -2,
      sanity: -1,
    },
    color: 0x8b4513,
    icon: "🌍",
  },
  
  [EventType.COSMIC_CONDITIONS]: {
    name: "Condiciones Cósmicas",
    description: "Radiación cósmica detectada en el área",
    probability: 0.17,
    duration: 75000,
    affectedAreas: ["Control", "Energy"],
    effects: {
      health: -3,
      energy: -2,
      sanity: -2,
    },
    color: 0x9b59b6,
    icon: "☄️",
  },
};

// Probabilidades acumulativas para selección aleatoria
export function getEventProbabilities(): { type: EventType; cumulativeProbability: number }[] {
  let cumulative = 0;
  const result: { type: EventType; cumulativeProbability: number }[] = [];
  
  for (const [type, config] of Object.entries(EVENT_BANK)) {
    cumulative += config.probability;
    result.push({
      type: type as EventType,
      cumulativeProbability: cumulative,
    });
  }
  
  return result;
}