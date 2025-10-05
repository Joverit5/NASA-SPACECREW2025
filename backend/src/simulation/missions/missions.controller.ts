import { Socket } from "socket.io";
import { MissionsService } from "./missions.service";

export class MissionsController {
  constructor(
    private socket: Socket,
    private missionsService: MissionsService
  ) {
    this.registerHandlers();
  }

  private registerHandlers() {
    // Cliente solicita activar una misión
    this.socket.on("mission:activate", (data: { missionId: string; playerId: string }) => {
      console.log(`▶️ mission:activate received from ${this.socket.id}:`, data);

      if (!data.missionId || !data.playerId) {
        console.warn("⚠️ mission:activate missing missionId or playerId");
        return;
      }

      const success = this.missionsService.activateMission(data.missionId, data.playerId);
      
      if (!success) {
        this.socket.emit("mission:activate_failed", {
          missionId: data.missionId,
          reason: "Mission not found or already active",
        });
      }
    });

    // Cliente solicita lista de misiones activas
    this.socket.on("mission:get_active", () => {
      const activeMissions = this.missionsService.getActiveMissions();
      this.socket.emit("mission:active_list", activeMissions);
    });

    // Cliente solicita historial de misiones
    this.socket.on("mission:get_history", () => {
      const history = this.missionsService.getMissionHistory();
      this.socket.emit("mission:history_list", history);
    });

    // Cliente solicita misiones para un área específica
    this.socket.on("mission:get_for_area", (data: { areaType: string }) => {
      const missions = this.missionsService.getMissionsForArea(data.areaType);
      this.socket.emit("mission:area_missions", {
        areaType: data.areaType,
        missions,
      });
    });

    // Cliente informa que el jugador está en un área (para misiones de proximidad)
    this.socket.on("mission:player_in_area", (data: { playerId: string; areaType: string }) => {
      // Aquí podrías implementar lógica de proximidad si es necesario
      console.log(`📍 Player ${data.playerId} in area ${data.areaType}`);
    });
  }
}