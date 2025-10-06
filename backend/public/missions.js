// public/missions.js
// Helpers para transformar/normalizar misiones usando window.MISSION_BANK

(function () {
  if (!window.MISSION_BANK) {
    console.warn('MISSION_BANK not loaded yet (missions.js expects mission-bank.js).');
  }

  // Buscar configuración por id en el banco
  function findMissionConfigById(missionId) {
    if (!window.MISSION_BANK) return null;
    for (const area of Object.keys(window.MISSION_BANK)) {
      const list = window.MISSION_BANK[area] || [];
      const found = list.find((m) => m.id === missionId);
      if (found) return found;
    }
    return null;
  }

  // Dado un objeto misión que viene del servidor, retornar una ActiveMission con config adjunta
  function normalizeAssignedMission(serverMission) {
    // serverMission puede venir con .id, .missionId o .config
    let config = null;
    if (serverMission.config) config = serverMission.config;
    else if (serverMission.missionId) config = findMissionConfigById(serverMission.missionId);
    else if (serverMission.id) config = findMissionConfigById(serverMission.id);
    // If still null, try serverMission.ref or serverMission.type (fallback)
    if (!config && serverMission.missionId && typeof serverMission.missionId === 'string') {
      config = findMissionConfigById(serverMission.missionId);
    }

    const normalized = {
      id: serverMission.id || `assigned_${(serverMission.missionId || serverMission.id || Math.random()).toString()}`,
      missionId: (serverMission.missionId || (config && config.id) || serverMission.id),
      config: config || serverMission.config || {
        id: serverMission.missionId || serverMission.id || 'unknown',
        name: serverMission.name || 'Misión desconocida',
        description: serverMission.description || '',
        area: serverMission.area || 'Unknown',
        duration: serverMission.duration || 20000,
        type: serverMission.type || 'individual',
        minPlayers: serverMission.minPlayers || 1,
        effects: serverMission.effects || {},
        roles: serverMission.roles || [],
      },
      status: serverMission.status || 'pending',
      progress: typeof serverMission.progress === 'number' ? serverMission.progress : 0,
      startTime: serverMission.startTime || null,
      endTime: serverMission.endTime || null,
      playersInvolved: serverMission.playersInvolved || serverMission.players || [],
      assignedTo: serverMission.assignedTo || serverMission.playerId || null,
    };
    return normalized;
  }

  // Export to window
  window.MissionsUtil = {
    findMissionConfigById,
    normalizeAssignedMission,
  };
})();
