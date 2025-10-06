// Sistema de Misiones Integrado con el Sidebar
(function() {
  'use strict';

  class MissionSystem {
    constructor() {
      this.isInitialized = false;
      this.activeMissions = [];
      this.completedMissions = [];
      this.playerCount = 0;
      this.playerRoles = [];
      this.availableAreas = [];
      this.missionPool = [];
      this.maxActiveMissions = 3;
      this.missionCheckInterval = 30000; // 30 segundos
      this.missionTimer = null;
    }

    initialize(playerCount, playerRoles, placedAreas) {
      console.log('[Mission] Inicializando sistema de misiones...');
      console.log('[Mission] Jugadores:', playerCount);
      console.log('[Mission] Roles:', playerRoles);
      console.log('[Mission] Áreas disponibles:', placedAreas);

      this.playerCount = playerCount;
      this.playerRoles = playerRoles.map(role => {
        return window.ROLE_MAPPING && window.ROLE_MAPPING[role] 
          ? window.ROLE_MAPPING[role] 
          : role;
      });
      this.availableAreas = placedAreas;

      // Construir pool de misiones basado en áreas disponibles
      this.buildMissionPool();

      // Asignar misiones iniciales
      this.assignInitialMissions();

      // Iniciar sistema de asignación automática
      this.startMissionSystem();

      this.isInitialized = true;
      console.log('[Mission] Sistema de misiones inicializado correctamente');
      console.log('[Mission] Pool de misiones:', this.missionPool.length);
    }

    buildMissionPool() {
      this.missionPool = [];

      if (!window.MISSION_BANK) {
        console.warn('[Mission] MISSION_BANK no está cargado');
        return;
      }

      // Para cada área disponible, agregar sus misiones al pool
      for (const area of this.availableAreas) {
        const areaMissions = window.MISSION_BANK[area];
        if (areaMissions && Array.isArray(areaMissions)) {
          // Filtrar misiones por roles disponibles
          const validMissions = areaMissions.filter(mission => {
            // Si la misión no requiere roles específicos, es válida
            if (!mission.roles || mission.roles.length === 0) return true;
            
            // Verificar si algún jugador tiene el rol necesario
            return mission.roles.some(role => this.playerRoles.includes(role));
          });

          this.missionPool.push(...validMissions);
        }
      }

      console.log('[Mission] Pool construido con', this.missionPool.length, 'misiones');
    }

    assignInitialMissions() {
      // Asignar 2-3 misiones iniciales
      const initialCount = Math.min(2, this.missionPool.length);
      
      for (let i = 0; i < initialCount; i++) {
        this.assignRandomMission();
      }

      this.updateMissionUI();
    }

    assignRandomMission() {
      if (this.activeMissions.length >= this.maxActiveMissions) {
        console.log('[Mission] Límite de misiones activas alcanzado');
        return null;
      }

      if (this.missionPool.length === 0) {
        console.log('[Mission] No hay misiones disponibles en el pool');
        return null;
      }

      // Seleccionar misión aleatoria del pool
      const randomIndex = Math.floor(Math.random() * this.missionPool.length);
      const missionConfig = this.missionPool[randomIndex];

      // Crear instancia de misión activa
      const mission = {
        id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        config: missionConfig,
        status: 'pending',
        progress: 0,
        startTime: null,
        assignedTo: null,
      };

      this.activeMissions.push(mission);
      console.log('[Mission] Misión asignada:', missionConfig.name);

      return mission;
    }

    startMission(missionId) {
      const mission = this.activeMissions.find(m => m.id === missionId);
      if (!mission) {
        console.warn('[Mission] Misión no encontrada:', missionId);
        return false;
      }

      if (mission.status === 'active') {
        console.warn('[Mission] Misión ya está activa');
        return false;
      }

      mission.status = 'active';
      mission.startTime = Date.now();
      mission.progress = 0;

      console.log('[Mission] Misión iniciada:', mission.config.name);

      // Iniciar progreso automático
      this.startMissionProgress(mission);

      this.updateMissionUI();

      return true;
    }

    startMissionProgress(mission) {
      const duration = mission.config.duration || 30000;
      const updateInterval = 100; // Actualizar cada 100ms
      const totalUpdates = duration / updateInterval;

      let currentUpdate = 0;

      const progressInterval = setInterval(() => {
        currentUpdate++;
        mission.progress = Math.min(100, (currentUpdate / totalUpdates) * 100);

        // Actualizar UI
        this.updateMissionProgressBar(mission.id, mission.progress);

        if (mission.progress >= 100) {
          clearInterval(progressInterval);
          this.completeMission(mission.id);
        }
      }, updateInterval);

      mission.progressInterval = progressInterval;
    }

    completeMission(missionId) {
      const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
      if (missionIndex === -1) {
        console.warn('[Mission] Misión no encontrada para completar:', missionId);
        return;
      }

      const mission = this.activeMissions[missionIndex];
      
      // Limpiar intervalo
      if (mission.progressInterval) {
        clearInterval(mission.progressInterval);
      }

      mission.status = 'completed';
      mission.progress = 100;

      // Aplicar efectos de la misión
      this.applyMissionEffects(mission);

      // Mover a completadas
      this.completedMissions.push(mission);
      this.activeMissions.splice(missionIndex, 1);

      console.log('[Mission] Misión completada:', mission.config.name);

      // Actualizar UI
      this.updateMissionUI();

      // Asignar nueva misión después de un delay
      setTimeout(() => {
        this.assignRandomMission();
        this.updateMissionUI();
      }, 5000);
    }

    applyMissionEffects(mission) {
      if (!mission.config.effects) return;

      console.log('[Mission] Aplicando efectos de misión:', mission.config.effects);

      // Aplicar efectos a las estadísticas del jugador
      if (window.playerStats && typeof window.updateHUD === 'function') {
        for (const [stat, change] of Object.entries(mission.config.effects)) {
          if (window.playerStats.hasOwnProperty(stat)) {
            window.playerStats[stat] += change;
            window.playerStats[stat] = Math.max(0, Math.min(100, window.playerStats[stat]));
          }
        }
        window.updateHUD();
      }
    }

    handleAreaClick(areaType) {
      console.log('[Mission] Área clicada:', areaType);

      // Buscar misiones pendientes para esta área
      const pendingMission = this.activeMissions.find(m => 
        m.status === 'pending' && m.config.area === areaType
      );

      if (pendingMission) {
        console.log('[Mission] Iniciando misión:', pendingMission.config.name);
        this.startMission(pendingMission.id);
      } else {
        console.log('[Mission] No hay misiones pendientes para', areaType);
      }
    }

    startMissionSystem() {
      // Revisar y asignar nuevas misiones periódicamente
      this.missionTimer = setInterval(() => {
        if (this.activeMissions.length < this.maxActiveMissions) {
          this.assignRandomMission();
          this.updateMissionUI();
        }
      }, this.missionCheckInterval);

      console.log('[Mission] Sistema de misiones automático iniciado');
    }

    stopMissionSystem() {
      if (this.missionTimer) {
        clearInterval(this.missionTimer);
        this.missionTimer = null;
      }

      // Limpiar intervalos de progreso
      this.activeMissions.forEach(m => {
        if (m.progressInterval) {
          clearInterval(m.progressInterval);
        }
      });

      console.log('[Mission] Sistema de misiones detenido');
    }

    updateMissionUI() {
      const missionsList = document.getElementById('missions-list');
      const missionCounter = document.getElementById('mission-counter');

      if (!missionsList) {
        console.warn('[Mission] Elemento missions-list no encontrado');
        return;
      }

      // Actualizar contador
      const totalMissions = this.activeMissions.length + this.completedMissions.length;
      if (missionCounter) {
        missionCounter.textContent = `(${this.completedMissions.length}/${totalMissions})`;
      }

      // Limpiar lista
      missionsList.innerHTML = '';

      if (this.activeMissions.length === 0) {
        missionsList.innerHTML = `
          <div style="text-align: center; color: #9aa7b2; font-size: 12px; padding: 20px;">
            Sin misiones activas
          </div>
        `;
        return;
      }

      // Renderizar misiones activas
      this.activeMissions.forEach(mission => {
        const missionCard = this.createMissionCard(mission);
        missionsList.appendChild(missionCard);
      });
    }

    createMissionCard(mission) {
      const card = document.createElement('div');
      card.className = 'mission-card';
      card.id = `mission-${mission.id}`;

      if (mission.status === 'active') {
        card.classList.add('active');
      } else if (mission.status === 'completed') {
        card.classList.add('completed');
      }

      const statusText = {
        'pending': 'Pendiente',
        'active': 'En Progreso',
        'completed': 'Completada'
      }[mission.status] || mission.status;

      card.innerHTML = `
        <div class="mission-header">
          <div class="mission-name">${mission.config.name}</div>
          <div class="mission-status">${statusText}</div>
        </div>
        <div class="mission-description">${mission.config.description}</div>
        <div class="mission-area">📍 ${mission.config.area}</div>
        <div class="mission-progress-bar">
          <div class="mission-progress-fill" id="progress-${mission.id}" style="width: ${mission.progress}%"></div>
        </div>
        <div class="mission-progress-text">${Math.floor(mission.progress)}%</div>
      `;

      // Agregar click para iniciar misión si está pendiente
      if (mission.status === 'pending') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          this.startMission(mission.id);
        });
      }

      return card;
    }

    updateMissionProgressBar(missionId, progress) {
      const progressBar = document.getElementById(`progress-${missionId}`);
      const progressText = progressBar?.parentElement?.nextElementSibling;

      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }

      if (progressText) {
        progressText.textContent = `${Math.floor(progress)}%`;
      }
    }

    reset() {
      this.stopMissionSystem();
      this.activeMissions = [];
      this.completedMissions = [];
      this.missionPool = [];
      this.isInitialized = false;
      this.updateMissionUI();
    }
  }

  // Exportar a window
  window.MissionSystem = MissionSystem;
  window.missionSystem = new MissionSystem();
  window._missionsLoaded = true;

  console.log('[Mission] Sistema de misiones cargado y listo');
})();