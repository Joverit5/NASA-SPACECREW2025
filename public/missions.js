// ========== MISSION SYSTEM ==========
// Sistema de misiones para la simulación espacial

// Banco completo de misiones organizadas por área
const MISSION_BANK = {
  Oxygen: [
    {
      id: "oxygen_1",
      name: "Reparar el purificador de aire",
      description: "El purificador de aire necesita mantenimiento urgente",
      type: "cooperative",
      minPlayers: 2,
      area: "Oxygen",
      duration: 30000, // 30 segundos
      effects: { oxygen: 10, energy: -10, fatigue: 10 },
      roles: ["engineer", "medic"],
    },
    {
      id: "oxygen_2",
      name: "Desinfectar el tanque de agua",
      description: "El tanque de agua requiere limpieza profunda",
      type: "cleaning",
      minPlayers: 1,
      area: "Oxygen",
      duration: 25000,
      effects: { hp: 5, energy: -5, sanity: 5 },
      roles: ["medic", "biologist"],
    },
    {
      id: "oxygen_3",
      name: "Redistribuir el flujo de oxígeno",
      description: "Ajustar las válvulas para optimizar la distribución",
      type: "puzzle",
      minPlayers: 1,
      area: "Oxygen",
      duration: 20000,
      effects: { oxygen: 20, energy: -15, fatigue: 5 },
      roles: ["engineer"],
    },
  ],
  Kitchen: [
    {
      id: "kitchen_1",
      name: "Recolectar los cultivos maduros",
      description: "Los cultivos están listos para la cosecha",
      type: "harvest",
      minPlayers: 1,
      area: "Kitchen",
      duration: 20000,
      effects: { hunger: 15, energy: -10 },
      roles: ["biologist"],
    },
    {
      id: "kitchen_2",
      name: "Preparar raciones nutritivas",
      description: "Cocinar alimentos para la tripulación",
      type: "crafting",
      minPlayers: 1,
      area: "Kitchen",
      duration: 25000,
      effects: { hunger: 25, fatigue: 5 },
      roles: ["biologist", "medic"],
    },
    {
      id: "kitchen_3",
      name: "Control de plagas en la granja",
      description: "Eliminar plagas que amenazan los cultivos",
      type: "minigame",
      minPlayers: 1,
      area: "Kitchen",
      duration: 30000,
      effects: { sanity: -5, hunger: 10, energy: -10 },
      roles: ["biologist"],
    },
  ],
  Energy: [
    {
      id: "energy_1",
      name: "Reiniciar el generador manualmente",
      description: "El generador necesita un reinicio de emergencia",
      type: "sequence",
      minPlayers: 1,
      area: "Energy",
      duration: 20000,
      effects: { energy: 20, fatigue: 10 },
      roles: ["engineer"],
    },
    {
      id: "energy_2",
      name: "Reemplazar baterías fundidas",
      description: "Las baterías están dañadas y deben ser reemplazadas",
      type: "cooperative",
      minPlayers: 2,
      area: "Energy",
      duration: 35000,
      effects: { energy: -15, fatigue: 15, hp: 5 },
      roles: ["engineer"],
    },
    {
      id: "energy_3",
      name: "Ajustar el balance energético",
      description: "Optimizar la distribución de energía entre módulos",
      type: "puzzle",
      minPlayers: 1,
      area: "Energy",
      duration: 25000,
      effects: { sanity: 10, fatigue: 5 },
      roles: ["engineer", "scientist"],
    },
  ],
  Maintenance: [
    {
      id: "maintenance_1",
      name: "Reparar un dron averiado",
      description: "El dron de mantenimiento necesita reparación",
      type: "assembly",
      minPlayers: 1,
      area: "Maintenance",
      duration: 30000,
      effects: { energy: 10, sanity: 5, fatigue: 10 },
      roles: ["engineer"],
    },
    {
      id: "maintenance_2",
      name: "Lubricar los mecanismos del módulo",
      description: "Los mecanismos necesitan lubricación preventiva",
      type: "inspection",
      minPlayers: 1,
      area: "Maintenance",
      duration: 15000,
      effects: { energy: 5, fatigue: 5 },
      roles: ["engineer"],
    },
    {
      id: "maintenance_3",
      name: "Desbloquear puerta sellada",
      description: "Una puerta está bloqueada y debe ser abierta",
      type: "cooperative",
      minPlayers: 2,
      area: "Maintenance",
      duration: 25000,
      effects: { energy: -10, sanity: -5, fatigue: 15 },
      roles: ["engineer"],
    },
  ],
  Lab: [
    {
      id: "lab_1",
      name: "Analizar muestras contaminadas",
      description: "Examinar muestras para detectar contaminación",
      type: "puzzle",
      minPlayers: 1,
      area: "Lab",
      duration: 30000,
      effects: { sanity: 10, energy: -10 },
      roles: ["scientist", "biologist"],
    },
    {
      id: "lab_2",
      name: "Crear antídoto experimental",
      description: "Sintetizar un antídoto para una posible enfermedad",
      type: "crafting_risk",
      minPlayers: 1,
      area: "Lab",
      duration: 40000,
      effects: { hp: 15, energy: -15 },
      roles: ["medic", "scientist"],
    },
    {
      id: "lab_3",
      name: "Recalibrar sensores biológicos",
      description: "Ajustar los sensores para lecturas precisas",
      type: "precision",
      minPlayers: 1,
      area: "Lab",
      duration: 20000,
      effects: { energy: 5, sanity: 5, fatigue: 5 },
      roles: ["scientist"],
    },
  ],
  Psychology: [
    {
      id: "psychology_1",
      name: "Sesión grupal de relajación",
      description: "Realizar una sesión de relajación para la tripulación",
      type: "cooperative",
      minPlayers: 2,
      area: "Psychology",
      duration: 35000,
      effects: { sanity: 20, energy: 10, fatigue: -20 },
      roles: ["medic"],
    },
    {
      id: "psychology_2",
      name: "Juego de realidad virtual",
      description: "Usar el simulador VR para entretenimiento",
      type: "individual",
      minPlayers: 1,
      area: "Psychology",
      duration: 20000,
      effects: { sanity: 10, energy: -5 },
      roles: [],
    },
    {
      id: "psychology_3",
      name: "Diario personal o meditación",
      description: "Tiempo de reflexión personal",
      type: "passive",
      minPlayers: 1,
      area: "Psychology",
      duration: 25000,
      effects: { sanity: 15, fatigue: -10 },
      roles: [],
    },
  ],
  Sleep: [
    {
      id: "sleep_1",
      name: "Dormir turno completo",
      description: "Descansar durante un ciclo completo de sueño",
      type: "rest",
      minPlayers: 1,
      area: "Sleep",
      duration: 45000,
      effects: { energy: 40, fatigue: -40, hunger: -10 },
      roles: [],
    },
    {
      id: "sleep_2",
      name: "Siesta rápida",
      description: "Tomar un descanso breve",
      type: "rest",
      minPlayers: 1,
      area: "Sleep",
      duration: 20000,
      effects: { energy: 15, fatigue: -20 },
      roles: [],
    },
    {
      id: "sleep_3",
      name: "Reparar literas dañadas",
      description: "Arreglar las camas para mejor descanso",
      type: "repair",
      minPlayers: 1,
      area: "Sleep",
      duration: 25000,
      effects: { energy: -10, fatigue: 10 },
      roles: ["engineer"],
    },
  ],
  Medbay: [
    {
      id: "medbay_1",
      name: "Curar heridas leves",
      description: "Aplicar primeros auxilios a heridas menores",
      type: "healing",
      minPlayers: 1,
      area: "Medbay",
      duration: 15000,
      effects: { hp: 15, energy: -5 },
      roles: ["medic"],
    },
    {
      id: "medbay_2",
      name: "Atender crisis médica",
      description: "Responder a una emergencia médica",
      type: "qte",
      minPlayers: 1,
      area: "Medbay",
      duration: 30000,
      effects: { hp: 25, energy: -15, fatigue: 10 },
      roles: ["medic"],
    },
    {
      id: "medbay_3",
      name: "Sintetizar medicina básica",
      description: "Crear suministros médicos esenciales",
      type: "crafting",
      minPlayers: 1,
      area: "Medbay",
      duration: 25000,
      effects: { hp: 10, sanity: 5 },
      roles: ["medic", "scientist"],
    },
  ],
  Dock: [
    {
      id: "dock_1",
      name: "Revisar integridad de la esclusa",
      description: "Inspeccionar la esclusa de aire",
      type: "inspection",
      minPlayers: 1,
      area: "Dock",
      duration: 25000,
      effects: { oxygen: 5, fatigue: 10 },
      roles: ["engineer"],
    },
    {
      id: "dock_2",
      name: "Cargar suministros desde cápsula",
      description: "Transportar suministros desde la cápsula de carga",
      type: "cooperative",
      minPlayers: 2,
      area: "Dock",
      duration: 30000,
      effects: { hunger: 10, energy: 10, fatigue: 15 },
      roles: [],
    },
    {
      id: "dock_3",
      name: "Reparar vehículo auxiliar",
      description: "Arreglar el vehículo de exploración",
      type: "assembly",
      minPlayers: 1,
      area: "Dock",
      duration: 35000,
      effects: { energy: -20, sanity: 5 },
      roles: ["engineer"],
    },
  ],
  Control: [
    {
      id: "control_1",
      name: "Restaurar comunicaciones",
      description: "Reparar el sistema de comunicaciones",
      type: "minigame",
      minPlayers: 1,
      area: "Control",
      duration: 25000,
      effects: { sanity: 10, fatigue: 5 },
      roles: ["engineer", "scientist"],
    },
    {
      id: "control_2",
      name: "Analizar el estado del sistema",
      description: "Revisar todos los sistemas de la estación",
      type: "monitoring",
      minPlayers: 1,
      area: "Control",
      duration: 20000,
      effects: { energy: 5, sanity: 5 },
      roles: ["scientist"],
    },
    {
      id: "control_3",
      name: "Enviar señal de auxilio",
      description: "Transmitir una señal de emergencia",
      type: "global",
      minPlayers: 1,
      area: "Control",
      duration: 30000,
      effects: { sanity: 15, energy: -10 },
      roles: [],
    },
  ],
  Storage: [
    {
      id: "storage_1",
      name: "Inventariar recursos",
      description: "Organizar y contar todos los recursos",
      type: "organization",
      minPlayers: 1,
      area: "Storage",
      duration: 20000,
      effects: { sanity: 5, energy: -5 },
      roles: [],
    },
    {
      id: "storage_2",
      name: "Transportar suministros críticos",
      description: "Mover suministros esenciales a otros módulos",
      type: "cooperative",
      minPlayers: 2,
      area: "Storage",
      duration: 25000,
      effects: { fatigue: 15, energy: -15 },
      roles: [],
    },
    {
      id: "storage_3",
      name: "Reforzar contenedores dañados",
      description: "Reparar contenedores de almacenamiento",
      type: "repair",
      minPlayers: 1,
      area: "Storage",
      duration: 20000,
      effects: { energy: 5, fatigue: 10 },
      roles: ["engineer"],
    },
  ],
  Biodome: [
    {
      id: "biodome_1",
      name: "Polinizar manualmente plantas raras",
      description: "Ayudar en la polinización de plantas especiales",
      type: "precision",
      minPlayers: 1,
      area: "Biodome",
      duration: 30000,
      effects: { hunger: 15, sanity: 10, energy: -10 },
      roles: ["biologist"],
    },
    {
      id: "biodome_2",
      name: "Ajustar parámetros ambientales",
      description: "Optimizar temperatura y humedad del biodomo",
      type: "puzzle",
      minPlayers: 1,
      area: "Biodome",
      duration: 25000,
      effects: { oxygen: 10, hp: 5, fatigue: 5 },
      roles: ["biologist", "scientist"],
    },
    {
      id: "biodome_3",
      name: "Recolectar muestra bioluminiscente",
      description: "Obtener muestras de organismos bioluminiscentes",
      type: "exploration",
      minPlayers: 1,
      area: "Biodome",
      duration: 35000,
      effects: { sanity: -5, energy: -10, hp: 10 },
      roles: ["biologist", "scientist"],
    },
  ],
  Observatory: [
    {
      id: "observatory_1",
      name: "Registrar anomalías estelares",
      description: "Documentar fenómenos astronómicos inusuales",
      type: "observation",
      minPlayers: 1,
      area: "Observatory",
      duration: 30000,
      effects: { sanity: 15, fatigue: 10 },
      roles: ["scientist"],
    },
    {
      id: "observatory_2",
      name: "Calibrar telescopio principal",
      description: "Ajustar el telescopio para observaciones precisas",
      type: "precision",
      minPlayers: 1,
      area: "Observatory",
      duration: 20000,
      effects: { sanity: 5, energy: 5 },
      roles: ["scientist", "engineer"],
    },
    {
      id: "observatory_3",
      name: "Investigar señal desconocida",
      description: "Analizar una señal misteriosa del espacio",
      type: "risk",
      minPlayers: 1,
      area: "Observatory",
      duration: 40000,
      effects: { sanity: 20, hp: 10 }, // Puede variar
      roles: ["scientist"],
    },
  ],
}

// Mapeo de roles de crew a nombres de roles en misiones
const ROLE_MAPPING = {
  crew_medic: "medic",
  crew_engineer: "engineer",
  crew_scientist: "scientist",
  crew_biologist: "biologist",
}

// Sistema de gestión de misiones
class MissionSystem {
  constructor() {
    this.assignedMissions = []
    this.activeMissions = []
    this.completedMissions = []
    this.placedAreas = new Set()
    this.playerCount = 1
    this.playerRoles = []
    this.isInitialized = false
    this.proximityCheckInterval = null
    this.SESSION_ID = "default_session_id"
  }

  // Inicializar el sistema de misiones
  initialize(playerCount, playerRoles, placedAreas) {
    console.log("[v0] Initializing mission system", { playerCount, playerRoles, placedAreas })

    this.playerCount = playerCount || 1
    this.playerRoles = playerRoles || ["crew_medic"]
    this.placedAreas = new Set(placedAreas || [])

    // Asignar misiones basadas en jugadores y áreas
    this.assignMissions()

    // Mostrar panel de misiones
    this.showMissionsPanel()

    // Iniciar verificación de proximidad
    this.startProximityCheck()

    this.isInitialized = true
    console.log("[v0] Mission system initialized with", this.assignedMissions.length, "missions")
  }

  // Asignar misiones al inicio de la partida
  assignMissions() {
    this.assignedMissions = []

    // Calcular número de misiones: 2-3 por jugador
    const missionsPerPlayer = Math.floor(Math.random() * 2) + 2 // 2 o 3
    const totalMissions = this.playerCount * missionsPerPlayer

    // Obtener roles mapeados
    const mappedRoles = this.playerRoles.map((r) => ROLE_MAPPING[r] || "")

    // Filtrar misiones disponibles según áreas colocadas
    const availableMissions = []
    for (const [areaType, missions] of Object.entries(MISSION_BANK)) {
      if (this.placedAreas.has(areaType)) {
        availableMissions.push(...missions)
      }
    }

    if (availableMissions.length === 0) {
      console.warn("[v0] No missions available - no areas placed")
      return
    }

    // Seleccionar misiones aleatoriamente, priorizando las que coinciden con roles
    const selectedMissions = []
    const missionPool = [...availableMissions]

    // Primero, intentar asignar misiones que coincidan con algún rol
    for (let i = 0; i < totalMissions && missionPool.length > 0; i++) {
      let mission = null

      // Intentar encontrar misión que coincida con algún rol
      const roleMatchingMissions = missionPool.filter(
        (m) => m.roles.length === 0 || m.roles.some((r) => mappedRoles.includes(r)),
      )

      if (roleMatchingMissions.length > 0) {
        const randomIndex = Math.floor(Math.random() * roleMatchingMissions.length)
        mission = roleMatchingMissions[randomIndex]
        const poolIndex = missionPool.indexOf(mission)
        missionPool.splice(poolIndex, 1)
      } else {
        // Si no hay misiones que coincidan, tomar cualquiera
        const randomIndex = Math.floor(Math.random() * missionPool.length)
        mission = missionPool.splice(randomIndex, 1)[0]
      }

      if (mission) {
        selectedMissions.push({
          ...mission,
          status: "pending", // pending, active, completed
          progress: 0,
          startTime: null,
          playersNearby: 0,
        })
      }
    }

    this.assignedMissions = selectedMissions
    console.log("[v0] Assigned missions:", this.assignedMissions)
  }

  // Mostrar panel de misiones en la UI
  showMissionsPanel() {
    // Eliminar panel anterior si existe
    let panel = document.getElementById("missions-panel")
    if (panel) panel.remove()

    // Crear panel de misiones
    panel = document.createElement("div")
    panel.id = "missions-panel"
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      background: linear-gradient(180deg, #0f1729 0%, #1a1f3a 100%);
      border: 2px solid #00d9ff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
      z-index: 9999;
      overflow-y: auto;
      font-family: 'Rajdhani', sans-serif;
    `

    // Título del panel
    const title = document.createElement("div")
    title.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      color: #00d9ff;
      margin-bottom: 12px;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
      text-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
    `
    title.textContent = "📋 MISIONES"
    panel.appendChild(title)

    // Contador de progreso
    const progress = document.createElement("div")
    progress.id = "missions-progress"
    progress.style.cssText = `
      font-size: 14px;
      color: #8899aa;
      margin-bottom: 16px;
      text-align: center;
      padding: 8px;
      background: #0b0b0b;
      border-radius: 6px;
    `
    progress.textContent = `Completadas: ${this.completedMissions.length} / ${this.assignedMissions.length}`
    panel.appendChild(progress)

    // Lista de misiones
    const missionsList = document.createElement("div")
    missionsList.id = "missions-list"
    missionsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `

    this.assignedMissions.forEach((mission, index) => {
      const missionCard = this.createMissionCard(mission, index)
      missionsList.appendChild(missionCard)
    })

    panel.appendChild(missionsList)
    document.body.appendChild(panel)
  }

  // Crear tarjeta de misión individual
  createMissionCard(mission, index) {
    const card = document.createElement("div")
    card.id = `mission-card-${index}`
    card.className = "mission-card"

    let statusColor = "#666"
    let statusText = "⏳ Pendiente"
    let statusBg = "#1a1f3a"

    if (mission.status === "active") {
      statusColor = "#ffd93d"
      statusText = "🔄 En progreso"
      statusBg = "#2a2a00"
    } else if (mission.status === "completed") {
      statusColor = "#4CAF50"
      statusText = "✓ Completada"
      statusBg = "#1a3a1a"
    }

    card.style.cssText = `
      background: ${statusBg};
      border: 2px solid ${statusColor};
      border-radius: 8px;
      padding: 12px;
      transition: all 0.3s ease;
    `

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="font-size: 16px; font-weight: bold; color: #fff; flex: 1;">${mission.name}</div>
        <div style="font-size: 12px; color: ${statusColor}; white-space: nowrap; margin-left: 8px;">${statusText}</div>
      </div>
      <div style="font-size: 13px; color: #aaa; margin-bottom: 8px;">${mission.description}</div>
      <div style="font-size: 12px; color: #00d9ff; margin-bottom: 8px;">📍 ${mission.area}</div>
      <div style="background: #0b0b0b; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 4px; border: 1px solid #333;">
        <div id="mission-progress-${index}" style="background: linear-gradient(90deg, ${statusColor}, ${statusColor}dd); height: 100%; width: ${mission.progress}%; transition: width 0.2s linear; box-shadow: 0 0 10px ${statusColor}88;"></div>
      </div>
      <div data-percent style="font-size: 11px; color: #888; text-align: right; font-weight: bold;">${Math.floor(mission.progress)}%</div>
    `

    return card
  }

  // Actualizar UI de misiones
  updateMissionsUI() {
    const progressEl = document.getElementById("missions-progress")
    if (progressEl) {
      progressEl.textContent = `Completadas: ${this.completedMissions.length} / ${this.assignedMissions.length}`
    }

    this.assignedMissions.forEach((mission, index) => {
      const card = document.getElementById(`mission-card-${index}`)
      if (card) {
        // Recrear la tarjeta con el estado actualizado
        const newCard = this.createMissionCard(mission, index)
        card.replaceWith(newCard)
      }
    })

    // Verificar si todas las misiones están completadas
    if (this.completedMissions.length === this.assignedMissions.length && this.assignedMissions.length > 0) {
      this.showCompletionCelebration()
    }
  }

  // Iniciar verificación de proximidad
  startProximityCheck() {
    // Ya no usamos proximidad, las misiones se activan por click
    console.log("[v0] Mission system ready - click on areas to complete missions")
  }

  checkPlayerProximity() {
    // Función removida - ahora usamos clicks en áreas
  }

  // Nuevo método: Manejar clic en áreas para misiones
  handleAreaClick(areaType) {
    console.log("[v0] Area clicked:", areaType)

    // Buscar misiones pendientes o activas para esta área
    const missionsForArea = this.assignedMissions
      .map((mission, index) => ({ mission, index }))
      .filter(({ mission }) => mission.area === areaType && mission.status !== "completed")

    console.log("[v0] Missions found for area:", missionsForArea.length)

    if (missionsForArea.length === 0) {
      console.log("[v0] No missions available for area:", areaType)
      this.showNoMissionNotification(areaType)
      return
    }

    // Si hay múltiples misiones, mostrar selector
    if (missionsForArea.length > 1) {
      console.log("[v0] Multiple missions available, showing selector")
      this.showMissionSelector(missionsForArea, null)
    } else {
      // Solo una misión, activarla directamente
      const { mission, index } = missionsForArea[0]
      console.log("[v0] Single mission found:", mission.name, "status:", mission.status)

      if (mission.status === "pending") {
        console.log("[v0] Activating mission:", mission.name)
        this.activateMission(index)
      } else if (mission.status === "active") {
        // Ya está activa, no hacer nada (la barra de progreso ya está visible)
        console.log("[v0] Mission already active:", mission.name)
      }
    }
  }

  // Nuevo método: Auto-progreso de misión hasta la finalización
  startMissionAutoProgress(mission, index) {
    // Mostrar barra de progreso
    this.showProgressBar(mission, index)

    // Calcular incremento por frame (60 FPS)
    const incrementPerFrame = (1000 / 60 / mission.duration) * 100

    // Función de actualización
    const updateProgress = () => {
      if (mission.status !== "active") {
        return // Misión pausada o completada
      }

      mission.progress = Math.min(100, mission.progress + incrementPerFrame)

      // Actualizar UI
      const progressBar = document.getElementById(`mission-progress-${index}`)
      if (progressBar) {
        progressBar.style.width = `${mission.progress}%`
      }

      const percentText = document.querySelector(`#mission-card-${index} [data-percent]`)
      if (percentText) {
        percentText.textContent = `${Math.floor(mission.progress)}%`
      }

      if (mission._progressFillEl) {
        mission._progressFillEl.style.width = `${mission.progress}%`
      }
      if (mission._progressTextEl) {
        mission._progressTextEl.textContent = `${Math.floor(mission.progress)}%`
      }

      // Completar si llega al 100%
      if (mission.progress >= 100) {
        this.completeMission(index)
      } else {
        // Continuar animación
        mission._progressAnimationFrame = requestAnimationFrame(updateProgress)
      }
    }

    // Iniciar animación
    mission._progressAnimationFrame = requestAnimationFrame(updateProgress)
  }

  // Mostrar barra de progreso en la UI
  showProgressBar(mission, index) {
    // Remover barra anterior si existe
    const existingBar = document.getElementById("mission-progress-bar")
    if (existingBar) existingBar.remove()

    const progressBar = document.createElement("div")
    progressBar.id = "mission-progress-bar"
    progressBar.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 41, 0.95);
      border: 3px solid #00d9ff;
      border-radius: 12px;
      padding: 20px 30px;
      box-shadow: 0 0 30px rgba(0, 217, 255, 0.6);
      z-index: 9998;
      min-width: 400px;
      font-family: 'Rajdhani', sans-serif;
    `

    progressBar.innerHTML = `
      <div style="font-size: 20px; font-weight: bold; color: #00d9ff; margin-bottom: 12px; text-align: center; font-family: 'Orbitron', sans-serif;">
        ${mission.name}
      </div>
      <div style="font-size: 14px; color: #aaa; margin-bottom: 16px; text-align: center;">
        ${mission.description}
      </div>
      <div style="background: #0b0b0b; border-radius: 8px; height: 24px; overflow: hidden; border: 2px solid #333; position: relative;">
        <div id="floating-progress-fill" style="background: linear-gradient(90deg, #00d9ff, #00b8d4); height: 100%; width: 0%; transition: width 0.2s linear; box-shadow: 0 0 20px #00d9ffaa;"></div>
        <div id="floating-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: bold; color: #fff; text-shadow: 0 0 4px #000;">0%</div>
      </div>
      <div style="font-size: 12px; color: #888; margin-top: 8px; text-align: center;">
        Mantente cerca del área para completar la misión
      </div>
    `

    document.body.appendChild(progressBar)

    // Guardar referencia para actualizar
    mission._progressBarEl = progressBar
    mission._progressFillEl = document.getElementById("floating-progress-fill")
    mission._progressTextEl = document.getElementById("floating-progress-text")
  }

  // Mostrar selector de misión en la UI
  showMissionSelector(missions, position) {
    // Evitar mostrar múltiples selectores
    if (document.getElementById("mission-selector")) return

    const selector = document.createElement("div")
    selector.id = "mission-selector"
    selector.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, #0f1729 0%, #1a1f3a 100%);
      border: 3px solid #00d9ff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 0 40px rgba(0, 217, 255, 0.5);
      z-index: 10000;
      min-width: 400px;
      font-family: 'Rajdhani', sans-serif;
    `

    const title = document.createElement("div")
    title.style.cssText = `
      font-size: 22px;
      font-weight: bold;
      color: #00d9ff;
      margin-bottom: 16px;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
      text-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
    `
    title.textContent = "Selecciona una misión"
    selector.appendChild(title)

    missions.forEach(({ mission, index }) => {
      const missionBtn = document.createElement("button")
      missionBtn.style.cssText = `
        width: 100%;
        background: #1a1f3a;
        border: 2px solid #00d9ff;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
        font-family: 'Rajdhani', sans-serif;
      `

      missionBtn.innerHTML = `
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${mission.name}</div>
        <div style="font-size: 14px; color: #aaa;">${mission.description}</div>
        <div style="font-size: 12px; color: #00d9ff; margin-top: 8px;">⏱️ ${Math.floor(mission.duration / 1000)}s</div>
      `

      missionBtn.onmouseover = () => {
        missionBtn.style.background = "#2a2f4a"
        missionBtn.style.transform = "translateX(4px)"
        missionBtn.style.boxShadow = "0 0 20px rgba(0, 217, 255, 0.4)"
      }
      missionBtn.onmouseout = () => {
        missionBtn.style.background = "#1a1f3a"
        missionBtn.style.transform = "translateX(0)"
        missionBtn.style.boxShadow = "none"
      }

      missionBtn.onclick = () => {
        this.activateMission(index)
        selector.remove()
      }

      selector.appendChild(missionBtn)
    })

    const cancelBtn = document.createElement("button")
    cancelBtn.style.cssText = `
      width: 100%;
      background: #2d1f1f;
      border: 2px solid #ff4444;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px;
    `
    cancelBtn.textContent = "Cancelar"
    cancelBtn.onclick = () => selector.remove()
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = "#3d2f2f"
    }
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = "#2d1f1f"
    }

    selector.appendChild(cancelBtn)
    document.body.appendChild(selector)
  }

  // Completar misión
  completeMission(index) {
    const mission = this.assignedMissions[index]
    if (!mission || mission.status === "completed") return

    mission.status = "completed"
    mission.progress = 100
    this.completedMissions.push(mission)

    console.log("[v0] Mission completed:", mission.name)

    // Cancelar animation frame si existe
    if (mission._progressAnimationFrame) {
      cancelAnimationFrame(mission._progressAnimationFrame)
      mission._progressAnimationFrame = null
    }

    if (mission._progressBarEl) {
      mission._progressBarEl.remove()
      mission._progressBarEl = null
      mission._progressFillEl = null
      mission._progressTextEl = null
    }

    // Aplicar efectos de la misión a las stats del jugador
    this.applyMissionEffects(mission)

    // Actualizar UI
    this.updateMissionsUI()

    // Mostrar notificación de completado
    this.showMissionNotification(mission, "¡Misión completada!")

    // Emitir al servidor
    if (window.socket && window.socket.emit) {
      window.socket.emit("mission_completed", {
        sessionId: window.SESSION_ID || this.SESSION_ID,
        missionId: mission.id,
        playerId: window.PLAYER_ID,
      })
    }
  }

  // Aplicar efectos de misión a las stats del jugador
  applyMissionEffects(mission) {
    if (!mission.effects || !window.playerStats) return

    for (const [stat, change] of Object.entries(mission.effects)) {
      if (window.playerStats.hasOwnProperty(stat)) {
        window.playerStats[stat] += change
        window.playerStats[stat] = Math.max(0, Math.min(100, window.playerStats[stat]))
      }
    }

    // Actualizar HUD
    if (typeof window.updateHUD === "function") {
      window.updateHUD()
    }

    console.log("[v0] Applied mission effects:", mission.effects)
  }

  // Mostrar notificación de misión
  showMissionNotification(mission, message) {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #00d9ff 0%, #0099cc 100%);
      color: #0a0e27;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 0 30px rgba(0, 217, 255, 0.6);
      z-index: 10001;
      animation: missionNotifPop 0.6s ease-out forwards;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
    `
    notification.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">${message}</div>
      <div style="font-size: 16px; opacity: 0.9;">${mission.name}</div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = "missionNotifFadeOut 0.4s ease-out forwards"
      setTimeout(() => notification.remove(), 400)
    }, 2000)
  }

  // Mostrar celebración al completar todas las misiones
  showCompletionCelebration() {
    const celebration = document.createElement("div")
    celebration.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      animation: fadeIn 0.5s ease-out;
    `

    celebration.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        padding: 40px 60px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 0 50px rgba(76, 175, 80, 0.8);
        animation: celebrationPop 0.6s ease-out;
      ">
        <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
        <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 12px; font-family: 'Orbitron', sans-serif;">
          ¡TODAS LAS MISIONES COMPLETADAS!
        </div>
        <div style="font-size: 18px; color: #e0f7ff;">
          La tripulación ha cumplido con éxito todas sus tareas
        </div>
      </div>
    `

    document.body.appendChild(celebration)

    setTimeout(() => {
      celebration.style.animation = "fadeOut 0.5s ease-out"
      setTimeout(() => celebration.remove(), 500)
    }, 4000)
  }

  // Detener el sistema de misiones
  stop() {
    if (this.proximityCheckInterval) {
      clearInterval(this.proximityCheckInterval)
      this.proximityCheckInterval = null
    }
    console.log("[v0] Mission system stopped")
  }

  showNoMissionNotification(areaType) {
    const notification = document.createElement("div")
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: #fff;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 0 30px rgba(255, 152, 0, 0.6);
      z-index: 10001;
      animation: missionNotifPop 0.6s ease-out forwards;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
    `
    notification.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">ℹ️ Sin misiones</div>
      <div style="font-size: 16px; opacity: 0.9;">No hay misiones disponibles en ${areaType}</div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = "missionNotifFadeOut 0.4s ease-out forwards"
      setTimeout(() => notification.remove(), 400)
    }, 2000)
  }
}

// Crear instancia global del sistema de misiones
window.missionSystem = new MissionSystem()

// Agregar estilos CSS para animaciones
const missionStyles = document.createElement("style")
missionStyles.textContent = `
  @keyframes missionNotifPop {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes missionNotifFadeOut {
    to {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
  }
  
  @keyframes celebrationPop {
    0% {
      transform: scale(0) rotate(-180deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.1) rotate(10deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .mission-card:hover {
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
  }
  
  #missions-panel::-webkit-scrollbar {
    width: 8px;
  }
  
  #missions-panel::-webkit-scrollbar-track {
    background: #0b0b0b;
    border-radius: 4px;
  }
  
  #missions-panel::-webkit-scrollbar-thumb {
    background: #00d9ff;
    border-radius: 4px;
  }
  
  #missions-panel::-webkit-scrollbar-thumb:hover {
    background: #00b8d4;
  }
`
document.head.appendChild(missionStyles)

console.log("[v0] Mission system loaded")
window._missionsLoaded = true
