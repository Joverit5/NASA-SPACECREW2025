import { Server } from "socket.io";
import { GameService } from "../../game/game.service";
import { MISSION_BANK, ROLE_MAPPING, ActiveMission, MissionConfig } from "./mision-bank";

export class MissionsService {
  private activeMissions: Map<string, ActiveMission> = new Map();
  private missionHistory: ActiveMission[] = [];
  private isRunning: boolean = false;
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private io: Server,
    private gameService: GameService
  ) {}

  // Iniciar el sistema de misiones
  start() {
    if (this.isRunning) {
      console.log("⚠️ Mission system already running");
      return;
    }

    this.isRunning = true;
    console.log("🎯 Mission system started");
  }

  // Detener el sistema de misiones
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Limpiar todos los intervalos de progreso
    this.progressIntervals.forEach(interval => clearInterval(interval));
    this.progressIntervals.clear();

    console.log("🛑 Mission system stopped");
  }

  // Asignar misiones al inicio de la simulación
  assignMissions(sessionId: string, playerRoles: string[], placedAreas: string[]): ActiveMission[] {
    console.log("📋 Assigning missions for session:", sessionId);
    console.log("   Player roles:", playerRoles);
    console.log("   Placed areas:", placedAreas);

    const playerCount = playerRoles.length;
    const missionsPerPlayer = Math.floor(Math.random() * 2) + 2; // 2-3 misiones por jugador
    const totalMissions = playerCount * missionsPerPlayer;

    // Mapear roles
    const mappedRoles = playerRoles.map(r => ROLE_MAPPING[r] || "");

    // Filtrar misiones disponibles según áreas colocadas
    const availableMissions: MissionConfig[] = [];
    for (const areaType of placedAreas) {
      const missionsForArea = MISSION_BANK[areaType];
      if (missionsForArea) {
        availableMissions.push(...missionsForArea);
      }
    }

    if (availableMissions.length === 0) {
      console.warn("⚠️ No missions available - no valid areas placed");
      return [];
    }

    const assignedMissions: ActiveMission[] = [];
    const missionPool = [...availableMissions];

    // Seleccionar misiones priorizando las que coincidan con roles
    for (let i = 0; i < totalMissions && missionPool.length > 0; i++) {
      let missionConfig: MissionConfig | null = null;

      // Intentar encontrar misión que coincida con algún rol
      const roleMatchingMissions = missionPool.filter(
        m => m.roles.length === 0 || m.roles.some(r => mappedRoles.includes(r))
      );

      if (roleMatchingMissions.length > 0) {
        const randomIndex = Math.floor(Math.random() * roleMatchingMissions.length);
        missionConfig = roleMatchingMissions[randomIndex];
        const poolIndex = missionPool.indexOf(missionConfig);
        missionPool.splice(poolIndex, 1);
      } else {
        const randomIndex = Math.floor(Math.random() * missionPool.length);
        missionConfig = missionPool.splice(randomIndex, 1)[0];
      }

      if (missionConfig) {
        const mission: ActiveMission = {
          id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          missionId: missionConfig.id,
          config: missionConfig,
          status: "pending",
          progress: 0,
          startTime: null,
          endTime: null,
          playersInvolved: [],
          assignedTo: playerRoles[i % playerRoles.length], // Rotar entre jugadores
        };

        assignedMissions.push(mission);
        this.activeMissions.set(mission.id, mission);
      }
    }

    this.missionHistory.push(...assignedMissions);

    console.log(`✅ Assigned ${assignedMissions.length} missions`);

    // Emitir misiones asignadas a todos los clientes
    this.io.emit("missions:assigned", {
      sessionId,
      missions: assignedMissions,
    });

    return assignedMissions;
  }

  // Activar una misión (el jugador hace clic en el área)
  activateMission(missionId: string, playerId: string): boolean {
    const mission = this.activeMissions.get(missionId);
    if (!mission) {
      console.warn(`⚠️ Mission ${missionId} not found`);
      return false;
    }

    if (mission.status !== "pending") {
      console.warn(`⚠️ Mission ${missionId} already ${mission.status}`);
      return false;
    }

    mission.status = "active";
    mission.startTime = Date.now();
    mission.endTime = Date.now() + mission.config.duration;
    mission.progress = 0;
    if (!mission.playersInvolved.includes(playerId)) {
      mission.playersInvolved.push(playerId);
    }

    console.log(`▶️ Mission activated: ${mission.config.name} by ${playerId}`);

    // Iniciar progreso automático
    this.startMissionProgress(mission);

    // Emitir a todos los clientes
    this.io.emit("mission:activated", {
      mission,
      playerId,
    });

    return true;
  }

  // Iniciar progreso automático de una misión
  private startMissionProgress(mission: ActiveMission) {
    const incrementPerSecond = (1000 / mission.config.duration) * 100;

    const interval = setInterval(() => {
      if (mission.status !== "active") {
        clearInterval(interval);
        this.progressIntervals.delete(mission.id);
        return;
      }

      mission.progress = Math.min(100, mission.progress + incrementPerSecond);

      // Emitir actualización de progreso
      this.io.emit("mission:progress", {
        missionId: mission.id,
        progress: mission.progress,
      });

      // Completar si llega al 100%
      if (mission.progress >= 100) {
        this.completeMission(mission.id);
      }
    }, 1000); // Actualizar cada segundo

    this.progressIntervals.set(mission.id, interval);
  }

  // Completar una misión
  completeMission(missionId: string): boolean {
    const mission = this.activeMissions.get(missionId);
    if (!mission) {
      console.warn(`⚠️ Mission ${missionId} not found`);
      return false;
    }

    if (mission.status === "completed") {
      console.warn(`⚠️ Mission ${missionId} already completed`);
      return false;
    }

    mission.status = "completed";
    mission.progress = 100;
    mission.endTime = Date.now();

    console.log(`✅ Mission completed: ${mission.config.name}`);

    // Limpiar intervalo de progreso
    const interval = this.progressIntervals.get(missionId);
    if (interval) {
      clearInterval(interval);
      this.progressIntervals.delete(missionId);
    }

    // Aplicar efectos a todos los jugadores involucrados
    mission.playersInvolved.forEach(playerId => {
      this.gameService.applyStatsEffects(playerId, mission.config.effects);
    });

    // Emitir completado a todos los clientes
    this.io.emit("mission:completed", {
      mission,
    });

    return true;
  }

  // Obtener misiones activas
  getActiveMissions(): ActiveMission[] {
    return Array.from(this.activeMissions.values());
  }

  // Obtener historial de misiones
  getMissionHistory(): ActiveMission[] {
    return this.missionHistory;
  }

  // Obtener misiones para un área específica
  getMissionsForArea(areaType: string): ActiveMission[] {
    return Array.from(this.activeMissions.values()).filter(
      m => m.config.area === areaType && m.status !== "completed"
    );
  }
}