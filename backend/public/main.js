// Estado de simulación iniciada
let simulationStarted = false;
// prueba/public/main.js
// Full file - includes:
//  - origin-centered grid & map scaling
//  - allowedGrid scaling (maps large 128x128 -> 20x20 grid properly)
//  - debug helpers (DEV_BYPASS_CLIENT_PLACE, dbgPlacementState)
//  - toolbar fixes (click + pointerdown) and window.currentDraggedArea exposure
//  - isometric mode transition and area recreation

// --------- CONFIG & GLOBALS ----------
const ROLE = "crew_medic";
const BASE_PATH = `/assets/crew/crew_assets/${ROLE}/`;
const META_PATH = BASE_PATH + "metadata.json";

const TILE_W = 32,
  TILE_H = 32;
const ISO_TILE_W = 64,
  ISO_TILE_H = 32;
const SPRITE_SCALE = 1;
const DEV_AUTO_RECREATE_ON_MISSING = true;

let SESSION_ID = localStorage.getItem("DEV_SESSION_ID") || null;
let PLAYER_ID = localStorage.getItem("DEV_PLAYER_ID") || null;
let sessionReady = false;

let game = null,
  playerSprite = null,
  ghostRect = null;
let isIsometricMode = false;
window.isIsometricMode = false;
let isEditMode = true; // Flag para controlar si estamos en modo edición

let localBoard = Array.from({ length: 20 }, () => Array(20).fill(0));
let currentDraggedArea = null; // keep this reference
window.currentDraggedArea = currentDraggedArea; // expose for console
const loadedTextureKeys = [];
let debugLogEl = null,
  stateEl = null;

const cameraOffsetX = 0;
const cameraOffsetY = 0;
const CAMERA_LERP_SPEED = 0.08; // Smooth camera follow speed (0-1, lower = smoother)

const areasById = new Map();
const undoStack = [],
  redoStack = [];
const MAX_UNDO = 200;
const removedSet = new Set(); // for undo+server sync
let allowedGrid = null; // boolean grid loaded from /assets/maps/map_grid.json

// GRID config & origin for centering/scaling map
const GRID_COLS = 20;
const GRID_ROWS = 20;
let GRID_ORIGIN_X = 0,
  GRID_ORIGIN_Y = 0;

// dev debug flags
window.DEV_BYPASS_CLIENT_PLACE = false;

window._mainLoaded = false;

// --------- UTIL HELPERS ----------
function appendLog(msg) {
  debugLogEl = debugLogEl || document.getElementById("log");
  if (!debugLogEl) return;
  debugLogEl.innerText =
    `${new Date().toLocaleTimeString()} - ${msg}\n` + debugLogEl.innerText;
}
function keyFor(relPath) {
  return (ROLE + "_" + relPath).replace(/[^a-zA-Z0-9_]/g, "_");
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function dbgPlacementState(tx, ty, w, h) {
  try {
    const rows = Math.max(6, Math.min(20, localBoard.length));
    const sample = localBoard.slice(0, rows).map((r) => r.join(","));
    console.log(
      "[DBG] placement test at",
      tx,
      ty,
      "size",
      w + "x" + h,
      "allowedGrid?",
      !!allowedGrid,
      "local sample:",
      sample
    );
  } catch (e) {
    console.warn("dbgPlacementState error", e);
  }
}

// --------- client placement check (tile bounds + occupancy) ----------
function clientCanPlace(board, x, y, w, h, ignoreAreaId = null) {
  if (!board || !board[0]) return false;
  if (x < 0 || y < 0 || x + w > board[0].length || y + h > board.length)
    return false;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const cell = board[y + j][x + i];
      if (cell !== 0) {
        if (ignoreAreaId && cell === ignoreAreaId) continue;
        return false;
      }
    }
  return true;
}

// --------- allowedGrid mapping: if allowedGrid size != GRID size, map coordinates properly
function isCellAllowed(tx, ty) {
  if (!allowedGrid) return true;
  const agRows = allowedGrid.length;
  const agCols = (allowedGrid[0] || []).length;
  if (!agRows || !agCols) return true;

  // Clamp tile coords to valid range
  if (tx < 0 || ty < 0 || tx >= GRID_COLS || ty >= GRID_ROWS) return false;

  // Map game grid coordinates (20x20) to allowedGrid coordinates (128x128)
  // Each game tile corresponds to multiple allowedGrid cells
  const cellsPerTileX = agCols / GRID_COLS;
  const cellsPerTileY = agRows / GRID_ROWS;

  // Sample the center of the tile in allowedGrid space
  const centerX = Math.floor((tx + 0.5) * cellsPerTileX);
  const centerY = Math.floor((ty + 0.5) * cellsPerTileY);

  // Clamp to allowedGrid bounds
  const cx = clamp(centerX, 0, agCols - 1);
  const cy = clamp(centerY, 0, agRows - 1);

  return !!allowedGrid[cy][cx];
}

// --------- SESSION REST helpers (dev) ----------
async function createSessionREST() {
  try {
    const resp = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "dev", maxPlayers: 5 }),
    });
    if (!resp.ok) throw new Error("create session failed " + resp.status);
    const data = await resp.json();
    return data.sessionId;
  } catch (e) {
    appendLog("createSessionREST error: " + (e.message || e));
    return null;
  }
}
async function joinSessionREST(sessionId, displayName = "DevPlayer") {
  try {
    const resp = await fetch(`/api/session/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    if (!resp.ok) throw new Error("join session failed " + resp.status);
    const data = await resp.json();
    return data.playerId;
  } catch (e) {
    appendLog("joinSessionREST error: " + (e.message || e));
    return null;
  }
}
async function createAndJoinSession() {
  appendLog("Creating session via POST /api/session...");
  const sid = await createSessionREST();
  if (!sid) return null;
  SESSION_ID = sid;
  localStorage.setItem("DEV_SESSION_ID", SESSION_ID);
  appendLog("Session created: " + SESSION_ID);
  appendLog("Joining via REST ...");
  const pid = await joinSessionREST(SESSION_ID, "DevPlayer");
  if (!pid) return null;
  PLAYER_ID = pid;
  localStorage.setItem("DEV_PLAYER_ID", PLAYER_ID);
  window.socket.emit &&
    window.socket.emit("join_session", {
      sessionId: SESSION_ID,
      player: { id: PLAYER_ID, name: "DevPlayer" },
    });
  window.socket.emit &&
    window.socket.emit("get_session", { sessionId: SESSION_ID });
  return { sessionId: SESSION_ID, playerId: PLAYER_ID };
}
function waitSocketConnect(timeout = 4000) {
  return new Promise((resolve) => {
    if (window.socket && window.socket.connected) return resolve(true);
    if (!window.socket || typeof window.socket.on !== "function")
      return resolve(false);
    const onConnect = () => {
      window.socket.off("connect", onConnect);
      resolve(true);
    };
    window.socket.on("connect", onConnect);
    setTimeout(
      () => resolve(!!(window.socket && window.socket.connected)),
      timeout
    );
  });
}
async function ensureDevSession() {
  await waitSocketConnect(4000);
  if (!window.socket || !window.socket.connected)
    appendLog("Warning: socket not connected (continuing)...");
  if (SESSION_ID && PLAYER_ID) {
    appendLog(
      "Using existing sessionId+playerId: " + SESSION_ID + " / " + PLAYER_ID
    );
    window.socket.emit &&
      window.socket.emit("join_session", {
        sessionId: SESSION_ID,
        player: { id: PLAYER_ID, name: "DevPlayer" },
      });
    window.socket.emit &&
      window.socket.emit("get_session", { sessionId: SESSION_ID });
    return true;
  }
  if (SESSION_ID && !PLAYER_ID) {
    appendLog("Found SESSION_ID but no PLAYER_ID - attempting REST join");
    const pid = await joinSessionREST(SESSION_ID, "DevPlayer");
    if (!pid) {
      localStorage.removeItem("DEV_SESSION_ID");
      SESSION_ID = null;
      return ensureDevSession();
    }
    PLAYER_ID = pid;
    localStorage.setItem("DEV_PLAYER_ID", PLAYER_ID);
    window.socket.emit &&
      window.socket.emit("join_session", {
        sessionId: SESSION_ID,
        player: { id: PLAYER_ID, name: "DevPlayer" },
      });
    window.socket.emit &&
      window.socket.emit("get_session", { sessionId: SESSION_ID });
    return true;
  }
  const r = await createAndJoinSession();
  return !!r;
}

// --------- SOCKET initialization (safe) ----------
const io = window.io; // Declare the io variable here
if (typeof io !== "undefined") {
  try {
    window.socket = io();
    appendLog("Socket.IO initializing...");
  } catch (e) {
    console.error("Failed to initialize socket:", e);
    appendLog("ERROR: Socket.IO failed to initialize");
    window.socket = null;
  }
} else {
  console.warn("socket.io client not loaded");
  appendLog("WARNING: socket.io not available - running in offline mode");
  window.socket = null;
}

// --------- SOCKET handlers (safe checks) ----------
if (window.socket && typeof window.socket.on === "function") {
  window.socket.on("connect", () =>
    appendLog("socket connected: " + (window.socket.id || "unknown"))
  );
  window.socket.on("session_state", (st) => {
    appendLog("session_state received");
    if (!st) return;
    // normalize incoming map tiles if any
    if (st.map && Array.isArray(st.map.tiles)) {
      try {
        localBoard = st.map.tiles.map((row) =>
          row.map((cell) => (cell === 0 || !cell ? 0 : cell))
        );
      } catch (e) {
        /* fallback */ localBoard = Array.from({ length: GRID_ROWS }, () =>
          Array(GRID_COLS).fill(0)
        );
      }
    }
    sessionReady = true;
    enableToolbar(true);
    if (stateEl)
      stateEl.innerText = JSON.stringify(
        {
          players: st.players?.length || 0,
          areas: st.areas?.length || 0,
          oxygen: st.resources?.oxygen,
        },
        null,
        2
      );

    if (Array.isArray(st.areas)) {
      const serverIds = new Set(st.areas.map((a) => a.id));
      for (const rid of Array.from(removedSet))
        if (!serverIds.has(rid)) removedSet.delete(rid);

      const localIds = new Set(areasById.keys());
      for (const a of st.areas) {
        if (removedSet.has(a.id)) continue;
        if (!areasById.has(a.id))
          createAreaVisual(game.scene.scenes[0], a, false);
        else {
          const entry = areasById.get(a.id);
          entry.meta = a;
          entry.container.x = GRID_ORIGIN_X + a.x * TILE_W;
          entry.container.y = GRID_ORIGIN_Y + a.y * TILE_H;
        }
      }
      for (const lid of localIds) {
        if (!serverIds.has(lid) && !removedSet.has(lid)) {
          const entry = areasById.get(lid);
          if (entry) {
            entry.container.destroy();
            areasById.delete(lid);
          }
          clearAreaTiles(entry.meta);
        }
      }
    }
  });
  window.socket.on("place_error", (err) => {
    appendLog("place_error: " + JSON.stringify(err));
    if (
      err &&
      err.reason === "session_not_found" &&
      DEV_AUTO_RECREATE_ON_MISSING
    ) {
      localStorage.removeItem("DEV_SESSION_ID");
      localStorage.removeItem("DEV_PLAYER_ID");
      SESSION_ID = null;
      PLAYER_ID = null;
      ensureDevSession();
    }
  });
  window.socket.on("player_update", (u) =>
    appendLog("player_update: " + JSON.stringify(u))
  );
  window.socket.on("event_triggered", (ev) =>
    appendLog("event: " + (ev && ev.name))
  );
}

// --------- UI / TOOLBAR (define BEFORE scene) ----------
function createToolbar() {
  function globalPointerMove(e) {
    if (!currentDraggedArea) return;
    if (typeof window._phaserPreviewPointerMove === "function")
      window._phaserPreviewPointerMove(e.clientX, e.clientY);
  }
  function globalPointerUp(e) {
    if (!currentDraggedArea) return;
    if (typeof window._phaserPointerUp === "function")
      window._phaserPointerUp(e.clientX, e.clientY);
  }
  document.addEventListener("pointermove", globalPointerMove);
  document.addEventListener("pointerup", globalPointerUp);
}
function enableToolbar(yes) {
  const bar = document.getElementById("toolbar_bar");
  if (!bar) return;
  const buttons = bar.querySelectorAll("button");
  buttons.forEach((b) => {
    if (b.id === "btn_start_sim") {
      b.disabled = !yes;
    } else {
      b.disabled = !yes;
    }
  });
}

// --------- GHOST PREVIEW (uses allowedGrid mapping) ----------
function updateGhost(tx, ty) {
  if (!ghostRect || !currentDraggedArea) return;
  ghostRect.clear();
  const px = GRID_ORIGIN_X + tx * TILE_W,
    py = GRID_ORIGIN_Y + ty * TILE_H;
  const wpx = currentDraggedArea.w * TILE_W,
    hpx = currentDraggedArea.h * TILE_H;

  const okCollision = clientCanPlace(
    localBoard,
    tx,
    ty,
    currentDraggedArea.w,
    currentDraggedArea.h
  );
  let okMap = true;
  if (allowedGrid) {
    for (let yy = 0; yy < currentDraggedArea.h; yy++) {
      for (let xx = 0; xx < currentDraggedArea.w; xx++) {
        const cx = tx + xx,
          cy = ty + yy;
        if (!isCellAllowed(cx, cy)) {
          okMap = false;
          break;
        }
      }
      if (!okMap) break;
    }
  }

  const ok = (window.DEV_BYPASS_CLIENT_PLACE ? true : okCollision) && okMap;
  const color = ok ? 0x00ff00 : 0xff0000;
  ghostRect.fillStyle(color, 0.35);
  ghostRect.fillRect(px, py, wpx, hpx);
  ghostRect.lineStyle(2, color, 0.95);
  ghostRect.strokeRect(px, py, wpx, hpx);
}

// --------- AREA VISUALS & INTERACTIONS ----------
function colorForType(type) {
  const map = {
    kitchen: 0xffb347,
    sleep: 0x9b59ff,
    recreation: 0x5dc85d,
    maintenance: 0x00cfcf,
    energy: 0xf1c40f,
    control: 0xe74c3c,
    storage: 0x95a5a6,
    dock: 0x34495e,
  };
  return map[type] || 0x888888;
}
function iconForType(type) {
  const map = {
    Kitchen: "/assets/areas/kitchen.png",
    Sleep: "/assets/areas/sleep.png",
    Psychology: "/assets/areas/psycho.png",
    Maintenance: "/assets/areas/mecanic.png",
    Energy: "/assets/areas/electrical.png",
    Control: "/assets/areas/control.png",
    Storage: "/assets/areas/storage.png",
    Dock: "/assets/areas/hangar.png",
    Biodome: "/assets/areas/biodome.png",
    Oxygen: "/assets/areas/oxygen.png",
    Observatory: "/assets/areas/observatory.png",
    Medbay: "/assets/areas/medbay.png",
    Lab: "/assets/areas/lab.png",
  };
  return map[type] || null;
}

function fillAreaTiles(areaMeta, idToSet = null) {
  const { x, y, w, h } = areaMeta;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const px = x + i,
        py = y + j;
      if (
        py >= 0 &&
        py < localBoard.length &&
        px >= 0 &&
        px < localBoard[0].length
      )
        localBoard[py][px] = idToSet || areaMeta.id || 1;
    }
}
function clearAreaTiles(areaMeta) {
  fillAreaTiles(areaMeta, 0);
}

function createAreaVisual(scene, areaMeta, emitToServer = false) {
  const { id, type, x, y, w, h } = areaMeta;
  const px = GRID_ORIGIN_X + x * TILE_W;
  const py = GRID_ORIGIN_Y + y * TILE_H;
  const container = scene.add.container(px, py).setSize(w * TILE_W, h * TILE_H);
  const iconPath = iconForType(type);
  const iconKey = `area_icon_${type}`;

  // Helper functions for hover label
  function showLabel() {
    if (container._hoverLabel) return;
    const label = scene.add
      .text((w * TILE_W) / 2, -18, type, {
        fontSize: "14px",
        color: "#fff",
        backgroundColor: "#222a",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(9999);
    container.add(label);
    container._hoverLabel = label;
  }
  function hideLabel() {
    if (container._hoverLabel) {
      container._hoverLabel.destroy();
      container._hoverLabel = null;
    }
  }

  function addIconToContainer(icon) {
    icon.setInteractive({ cursor: "pointer" });
    icon.on("pointerover", showLabel);
    icon.on("pointerout", hideLabel);
    container.add(icon);
  }

  if (iconPath && !scene.textures.exists(iconKey)) {
    scene.load.image(iconKey, iconPath);
    scene.load.once("complete", () => {
      if (scene.textures.exists(iconKey)) {
        const icon = scene.add.image(
          (w * TILE_W) / 2,
          (h * TILE_H) / 2,
          iconKey
        );
        icon.setDisplaySize(w * TILE_W, h * TILE_H);
        icon.setAlpha(0.95);
        addIconToContainer(icon);
      }
    });
    scene.load.start();
  } else if (iconPath && scene.textures.exists(iconKey)) {
    const icon = scene.add.image((w * TILE_W) / 2, (h * TILE_H) / 2, iconKey);
    icon.setDisplaySize(w * TILE_W, h * TILE_H);
    icon.setAlpha(0.95);
    addIconToContainer(icon);
  }
  container.setInteractive(
    new window.Phaser.Geom.Rectangle(0, 0, w * TILE_W, h * TILE_H),
    window.Phaser.Geom.Rectangle.Contains
  );

  container.setData("areaId", id);
  scene.input.setDraggable(container);

  container.on("pointerdown", () => {
    selectArea(id);
    if (
      window.isIsometricMode &&
      window.missionSystem &&
      window.missionSystem.isInitialized
    ) {
      console.log("Area clicked in isometric mode:", areaMeta.type);
      window.missionSystem.handleAreaClick(areaMeta.type);
    }
  });

  container.on("dragstart", () => {
    clearAreaTiles(areaMeta);
    container.setAlpha(0.85);
    selectArea(id);
  });
  container.on("drag", (pointer) => {
    const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const localX = worldPoint.x - GRID_ORIGIN_X;
    const localY = worldPoint.y - GRID_ORIGIN_Y;
    let tx = Math.floor(localX / TILE_W),
      ty = Math.floor(localY / TILE_H);
    tx = clamp(tx, 0, GRID_COLS - areaMeta.w);
    ty = clamp(ty, 0, GRID_ROWS - areaMeta.h);
    container.x = GRID_ORIGIN_X + tx * TILE_W;
    container.y = GRID_ORIGIN_Y + ty * TILE_H;
    // update ghost while dragging existing area
    currentDraggedArea = {
      type: areaMeta.type,
      w: areaMeta.w,
      h: areaMeta.h,
      color: colorForType(areaMeta.type),
    };
    window.currentDraggedArea = currentDraggedArea;
    updateGhost(tx, ty);
  });
  container.on("dragend", () => {
    container.setAlpha(1);
    const newX = Math.round((container.x - GRID_ORIGIN_X) / TILE_W),
      newY = Math.round((container.y - GRID_ORIGIN_Y) / TILE_H);
    const oldMeta = clone(areaMeta);
    dbgPlacementState(newX, newY, areaMeta.w, areaMeta.h);
    const ok = window.DEV_BYPASS_CLIENT_PLACE
      ? true
      : clientCanPlace(localBoard, newX, newY, areaMeta.w, areaMeta.h, id);
    console.log(`[DBG] move ok=${ok} newX=${newX} newY=${newY} id=${id}`);
    if (!ok) {
      appendLog("Move invalid (collision). Reverting.");
      container.x = GRID_ORIGIN_X + oldMeta.x * TILE_W;
      container.y = GRID_ORIGIN_Y + oldMeta.y * TILE_H;
      fillAreaTiles(oldMeta, oldMeta.id);
      return;
    }
    areaMeta.x = newX;
    areaMeta.y = newY;
    fillAreaTiles(areaMeta, id);
    appendLog(`Area moved: ${id} -> (${newX},${newY})`);
    pushUndo({
      type: "move",
      areaId: id,
      from: { x: oldMeta.x, y: oldMeta.y },
      to: { x: newX, y: newY },
    });
    window.socket.emit &&
      window.socket.emit("update_area", {
        sessionId: SESSION_ID,
        area: areaMeta,
      });
  });

  areasById.set(id, { container, meta: areaMeta });
  fillAreaTiles(areaMeta, id);
  if (emitToServer) {
    window.socket.emit &&
      window.socket.emit("place_area", {
        sessionId: SESSION_ID,
        area: areaMeta,
      });
    appendLog("place_area -> " + JSON.stringify(areaMeta));
  }
  return container;
}

let selectedAreaId = null;
function selectArea(id) {
  if (selectedAreaId && areasById.has(selectedAreaId)) {
    const prev = areasById.get(selectedAreaId);
    const g = prev.container.list[0];
    g.clear()
      .fillStyle(colorForType(prev.meta.type), 0.35)
      .fillRect(0, 0, prev.meta.w * TILE_W, prev.meta.h * TILE_H)
      .lineStyle(2, colorForType(prev.meta.type), 1)
      .strokeRect(0, 0, prev.meta.w * TILE_W, prev.meta.h * TILE_H);
  }
  selectedAreaId = id;
  if (!areasById.has(id)) return;
  const sel = areasById.get(id);
  const g = sel.container.list[0];
  g.clear()
    .fillStyle(colorForType(sel.meta.type), 0.35)
    .fillRect(0, 0, sel.meta.w * TILE_W, sel.meta.h * TILE_H)
    .lineStyle(4, 0xffff00, 1)
    .strokeRect(0, 0, sel.meta.w * TILE_W, sel.meta.h * TILE_H);
  appendLog("selected area " + id);
}
function getSelectedArea() {
  if (!selectedAreaId) return null;
  return areasById.get(selectedAreaId);
}

function rotateSelected(objEntry) {
  if (!objEntry) objEntry = getSelectedArea();
  if (!objEntry) return;
  const meta = objEntry.meta;
  const prev = clone(meta);
  clearAreaTiles(meta);
  const newW = meta.h,
    newH = meta.w;
  if (!clientCanPlace(localBoard, meta.x, meta.y, newW, newH, meta.id)) {
    appendLog("Rotate blocked by collision or bounds.");
    fillAreaTiles(meta, meta.id);
    return;
  }
  meta.w = newW;
  meta.h = newH;
  meta.rotation = (meta.rotation || 0) + 90;
  const container = objEntry.container;
  container.removeAll(true);
  const scene = game.scene.scenes[0];
  const g = scene.add.graphics();
  g.fillStyle(colorForType(meta.type), 0.35);
  g.fillRect(0, 0, meta.w * TILE_W, meta.h * TILE_H);
  g.lineStyle(2, colorForType(meta.type), 1);
  g.strokeRect(0, 0, meta.w * TILE_W, meta.h * TILE_H);
  const label = scene.add.text(4, 4, meta.type, {
    fontSize: "12px",
    color: "#111",
  });
  container.add([g, label]);
  container.setSize(meta.w * TILE_W, meta.h * TILE_H);
  fillAreaTiles(meta, meta.id);
  pushUndo({ type: "rotate", areaId: meta.id, from: prev, to: clone(meta) });
  window.socket.emit &&
    window.socket.emit("update_area", { sessionId: SESSION_ID, area: meta });
  appendLog("rotated area " + meta.id);
}

function deleteSelected(objEntry) {
  if (!objEntry) objEntry = getSelectedArea();
  if (!objEntry) return;
  const meta = objEntry.meta;
  objEntry.container.destroy();
  areasById.delete(meta.id);
  clearAreaTiles(meta);
  removedSet.add(meta.id);
  window.socket.emit &&
    window.socket.emit("remove_area", {
      sessionId: SESSION_ID,
      areaId: meta.id,
    });
  pushUndo({ type: "delete", area: clone(meta) });
  appendLog("deleted area " + meta.id);
  selectedAreaId = null;
}

// --------- SCENE: preload / create / update ----------
function preloadScene() {
  this.load.json("meta", META_PATH);
  this.load.image("map", "/assets/maps/map.png");
  this.load.json("map_grid", "/assets/maps/map_grid.json");
  this.load.audio("error_sound", "/assets/sfx/error.mp3");
  // --- preload HUD stat icons (use available area icons as fallbacks) ---
  // load the 3-state images for each variable from /assets/variables
  const stats = ["hp", "hunger", "oxygen", "energy", "sanity", "fatigue"];
  const states = ["low", "mid", "high"];
  for (const stat of stats) {
    for (const s of states) {
      const key = `${stat}_${s}`;
      const path = `/assets/variables/${stat}_${s}.png`;
      if (!this.textures.exists(key)) this.load.image(key, path);
    }
  }

  // --- preload area icons for in-game toolbar ---
  const areaIconMap = {
    Kitchen: "/assets/areas/kitchen.png",
    Sleep: "/assets/areas/sleep.png",
    Psychology: "/assets/areas/psycho.png",
    Maintenance: "/assets/areas/mecanic.png",
    Energy: "/assets/areas/electrical.png",
    Control: "/assets/areas/control.png",
    Storage: "/assets/areas/storage.png",
    Dock: "/assets/areas/hangar.png",
    Biodome: "/assets/areas/biodome.png",
    Oxygen: "/assets/areas/oxygen.png",
    Observatory: "/assets/areas/observatory.png",
    Medbay: "/assets/areas/medbay.png",
    Lab: "/assets/areas/lab.png",
  };
  for (const [type, path] of Object.entries(areaIconMap)) {
    const key = `area_icon_${type}`;
    if (!this.textures.exists(key)) this.load.image(key, path);
  }
}

function createScene() {
  function clientToCanvas(scene, clientX, clientY) {
    const rect = scene.sys.canvas.getBoundingClientRect();
    // rect.width = CSS display width, scene.sys.canvas.width = internal canvas width
    const scaleX = scene.sys.canvas.width / rect.width;
    const scaleY = scene.sys.canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
  }
  function getCanvasRelativePointer(pointer, scene) {
  const rect = scene.sys.canvas.getBoundingClientRect();

  if (pointer && pointer.event && pointer.event.clientX !== undefined) {
    return { x: pointer.event.clientX - rect.left, y: pointer.event.clientY - rect.top };
  }

  if (typeof pointer.x === "number" && typeof pointer.y === "number") {
    const scaleX = rect.width / scene.sys.canvas.width;
    const scaleY = rect.height / scene.sys.canvas.height;
    return { x: pointer.x * scaleX, y: pointer.y * scaleY };
  }
  return { x: 0, y: 0 };
}

  const scene = this;
  const { width, height } = scene.sys.game.canvas;
  debugLogEl = document.getElementById("log");
  stateEl = document.getElementById("state");
  appendLog("createScene starting...");
  // compute grid origin so it is centered inside canvas
  const canvasW = this.sys.canvas.width;
  const canvasH = this.sys.canvas.height;
  const gridPixelW = TILE_W * GRID_COLS;
  const gridPixelH = TILE_H * GRID_ROWS;
  GRID_ORIGIN_X = Math.floor((canvasW - gridPixelW) / 2);
  GRID_ORIGIN_Y = Math.floor((canvasH - gridPixelH) / 2);

  // draw base grid at origin
  const g = this.add.graphics();
  g.lineStyle(1, 0x333333, 1);
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      g.strokeRect(
        GRID_ORIGIN_X + x * TILE_W,
        GRID_ORIGIN_Y + y * TILE_H,
        TILE_W,
        TILE_H
      );
    }
  }
  this.baseGridGraphics = g;
  
function redrawGrid() {
  // recomputar grid origin según tamaño actual del canvas
  const canvasW = scene.sys.canvas.width;
  const canvasH = scene.sys.canvas.height;
  GRID_ORIGIN_X = Math.floor((canvasW - TILE_W * GRID_COLS) / 2);
  GRID_ORIGIN_Y = Math.floor((canvasH - TILE_H * GRID_ROWS) / 2);

  // redraw base grid
  scene.baseGridGraphics.clear();
  scene.baseGridGraphics.lineStyle(1, 0x333333, 1);
  for (let yy = 0; yy < GRID_ROWS; yy++) {
    for (let xx = 0; xx < GRID_COLS; xx++) {
      scene.baseGridGraphics.strokeRect(
        GRID_ORIGIN_X + xx * TILE_W,
        GRID_ORIGIN_Y + yy * TILE_H,
        TILE_W,
        TILE_H
      );
    }
  }

  // reposicionar mapImg si existe
  if (scene.mapImg) {
    const targetW = TILE_W * GRID_COLS;
    const targetH = TILE_H * GRID_ROWS;
    const tex = scene.textures.get("map");
    const srcImg = tex && tex.getSourceImage();
    const srcW = srcImg ? srcImg.width : targetW;
    const srcH = srcImg ? srcImg.height : targetH;
    const scale = Math.min(targetW / srcW, targetH / srcH);
    const displayW = Math.round(srcW * scale);
    const displayH = Math.round(srcH * scale);
    scene.mapImg.setDisplaySize(displayW, displayH);
    const extraX = Math.floor((targetW - displayW) / 2);
    const extraY = Math.floor((targetH - displayH) / 2);
    scene.mapImg.x = GRID_ORIGIN_X + extraX;
    scene.mapImg.y = GRID_ORIGIN_Y + extraY;
  }

  // reposicionar areas existentes
  areasById.forEach((entry) => {
    const meta = entry.meta;
    entry.container.x = GRID_ORIGIN_X + meta.x * TILE_W;
    entry.container.y = GRID_ORIGIN_Y + meta.y * TILE_H;
  });

  // reposicionar in-game toolbar bottom-center
  if (scene._inGameToolbar && scene._inGameToolbar.container) {
    scene._inGameToolbar.container.x = scene.sys.canvas.width / 2;
    scene._inGameToolbar.container.y = scene.sys.canvas.height - 40;
  }

  // reajustar playerSprite depth/posición relativa si existe
  if (playerSprite) {
    playerSprite.setDepth(playerSprite.y);
  }
}

// Llamar inicialmente para normalizar (ya que el config ahora puede haber inicializado con el tamaño real)
redrawGrid();

// escuchar cambios de tamaño (cuando el usuario redimensione la ventana o cambie layout)
this.scale.on("resize", () => {
  try {
    redrawGrid();
  } catch (e) {
    console.warn("resize redrawGrid failed", e);
  }
});
  // Hud top-left stats (hidden initially; will fade-in on Start Simulation)
  const vars = ["hp", "hunger", "oxygen", "energy", "sanity", "fatigue"];
  const playerStats = {};
  // Expose for console
  window.playerStats = playerStats;
  const statGroup = this.add.container(20, 20);
  statGroup.setAlpha(0);
  statGroup.setVisible(false);

  vars.forEach((name, i) => {
    const y = i * 28; // vertical spacing
    playerStats[name] = 100;

    const icon = scene.add.image(0, y, `${name}_high`).setOrigin(0, 0);
    icon.setDisplaySize(24, 24);

    const txt = scene.add.text(30, y + 4, "100%", {
      fontSize: "14px",
      color: "#fff",
    });
    statGroup.add([icon, txt]);
    playerStats[name + "_el"] = { icon, txt };
  });
  statGroup.setScrollFactor(0);

  // Expose helper to show stats with a fade-in tween
  this.showStats = function (opts = {}) {
    try {
      statGroup.setVisible(true);
      this.tweens.add({
        targets: statGroup,
        alpha: 1,
        duration: opts.duration || 700,
        ease: opts.ease || "Power2",
      });
    } catch (e) {
      console.warn("showStats failed", e);
      statGroup.setVisible(true);
      statGroup.setAlpha(1);
    }
  };

  // Update hud function
  function updateHUD() {
    window.updateHUD = updateHUD;
    vars.forEach((name) => {
      const val = playerStats[name];
      let state = "high";
      if (val <= 40) state = "low";
      else if (val <= 60) state = "mid";

      const key = `${name}_${state}`;
      if (scene.textures.exists(key))
        playerStats[name + "_el"].icon.setTexture(key);
      playerStats[name + "_el"].txt.setText(`${val}%`);
    });
  }

  // initialize HUD visuals immediately
  try {
    updateHUD();
  } catch (e) {
    console.warn("updateHUD init failed", e);
  }

  this.input.keyboard.addKeys("W,A,S,D");
  // create toolbar (must exist)
  if (typeof createToolbar !== "function") {
    appendLog("FATAL: createToolbar not defined. Aborting scene init.");
    return;
  }
  createToolbar();
  enableToolbar(false);

  const domToolbar = document.getElementById("toolbar_bar");
  if (domToolbar) domToolbar.style.display = "none";

  // In-game toolbar (bottom center) creation
  function createInGameToolbar(scene) {
    // container anchored to bottom-center
    const tw = scene.add.container(
      scene.sys.canvas.width / 2,
      scene.sys.canvas.height - 40
    );
    tw.setDepth(1000);
    tw.setSize(480, 64);

    const bg = scene.add
      .rectangle(0, 0, 520, 64, 0x111111, 0.85)
      .setOrigin(0.5);
    bg.setStrokeStyle(2, 0x333333);
    tw.add(bg);

    const areaDefs = [
      { type: "Kitchen", w: 2, h: 2 },
      { type: "Sleep", w: 2, h: 2 },
      { type: "Psychology", w: 3, h: 2 },
      { type: "Maintenance", w: 2, h: 2 },
      { type: "Energy", w: 2, h: 2 },
      { type: "Control", w: 2, h: 2 },
      { type: "Storage", w: 3, h: 2 },
      { type: "Dock", w: 3, h: 3 },
      { type: "Medbay", w: 3, h: 2 },
      { type: "Lab", w: 3, h: 2 },
      { type: "Observatory", w: 3, h: 2 },
      { type: "Biodome", w: 3, h: 2 },
      { type: "Maintenance", w: 2, h: 2 },
    ];

    const spacing = 64;
    const icons = [];
    let currentPage = 0;
    const AREAS_PER_PAGE = 5;
    const totalPages = Math.ceil(areaDefs.length / AREAS_PER_PAGE);

    function renderPage(page) {
      // clear previous icons
      icons.forEach((icon) => icon.destroy());
      icons.length = 0;
      tw.list = tw.list.filter((child) => !child._isNavBtn);

      let x = -((AREAS_PER_PAGE - 1) * spacing) / 2;
      const startIdx = page * AREAS_PER_PAGE;
      const endIdx = Math.min(startIdx + AREAS_PER_PAGE, areaDefs.length);
      for (let i = startIdx; i < endIdx; i++) {
        const a = areaDefs[i];
        const key = `area_icon_${a.type}`;
        const img = scene.add
          .image(x, 0, key)
          .setDisplaySize(40, 40)
          .setInteractive({ cursor: "pointer" });
        img.type = a.type;
        img.w = a.w;
        img.h = a.h;
        img.setData("draggable", true);

        // Hover label
        function showLabel() {
          if (img._hoverLabel) return;
          const label = scene.add
            .text(img.x, img.y - 28, a.type, {
              fontSize: "14px",
              color: "#fff",
              backgroundColor: "#222a",
              padding: { x: 6, y: 2 },
            })
            .setOrigin(0.5, 1)
            .setDepth(9999);
          tw.add(label);
          img._hoverLabel = label;
        }
        function hideLabel() {
          if (img._hoverLabel) {
            img._hoverLabel.destroy();
            img._hoverLabel = null;
          }
        }
        img.on("pointerover", showLabel);
        img.on("pointerout", hideLabel);

        // pointerdown starts drag from toolbar
        img.on("pointerdown", (pointer) => {
          currentDraggedArea = {
            type: a.type,
            w: a.w,
            h: a.h,
            color: colorForType(a.type),
          };
          window.currentDraggedArea = currentDraggedArea;
          appendLog("in-game drag start: " + a.type);
          // create a follow sprite to show a floating preview of the dragged area
          try {
            const key = `area_icon_${a.type}`;
            let canvasPos;
            if (pointer && pointer.event && typeof pointer.event.clientX === "number") {
              canvasPos = clientToCanvas(scene, pointer.event.clientX, pointer.event.clientY);
            } else {
              // pointer.x/y ya podrían ser internal canvas coords (Phaser)
              canvasPos = { x: pointer.x || 0, y: pointer.y || 0 };
            }
            const follow = scene.add
              .image(canvasPos.x, canvasPos.y, key)
              .setOrigin(0.5)
              .setDisplaySize(36, 36)
              .setDepth(6000)
              .setAlpha(0.95);
              follow.setScrollFactor(0); 
              scene._dragFollowSprite = follow;
            } catch (e) {
              
            }
        });

        tw.add(img);
        icons.push(img);
        x += spacing;
      }

      // Previous button
      if (page > 0) {
        const prevBtn = scene.add
          .image(-300, 0, "previous")
          .setDisplaySize(32, 32)
          .setInteractive({ cursor: "pointer" });
        prevBtn._isNavBtn = true;
        prevBtn.on("pointerdown", () => {
          renderPage(page - 1);
          currentPage = page - 1;
        });
        tw.add(prevBtn);
      }
      // Next button
      if (page < totalPages - 1) {
        const nextBtn = scene.add
          .image(300, 0, "next")
          .setDisplaySize(32, 32)
          .setInteractive({ cursor: "pointer" });
        nextBtn._isNavBtn = true;
        nextBtn.on("pointerdown", () => {
          renderPage(page + 1);
          currentPage = page + 1;
        });
        tw.add(nextBtn);
      }
    }

    // Preload los íconos de navegación
    if (!scene.textures.exists("next"))
      scene.load.image("next", "/assets/next.png");
    if (!scene.textures.exists("previous"))
      scene.load.image("previous", "/assets/previous.png");
    scene.load.once("complete", () => {
      renderPage(currentPage);
    });
    scene.load.start();
    return { container: tw, icons };
  }

  // create in-game toolbar now and keep reference
  const inGameToolbar = createInGameToolbar(this);
  this._inGameToolbar = inGameToolbar;

  const meta = this.cache.json.get("meta");
  if (!meta) appendLog("Warning: metadata not found at " + META_PATH);

  const toLoad = new Map();
  if (meta && meta.frames && meta.frames.rotations)
    for (const [k, p] of Object.entries(meta.frames.rotations))
      toLoad.set(keyFor(p), BASE_PATH + p);
  if (meta && meta.frames && meta.frames.animations) {
    for (const animName of Object.keys(meta.frames.animations || {})) {
      const animDirs = meta.frames.animations[animName];
      for (const dir of Object.keys(animDirs || {}))
        for (const rel of animDirs[dir])
          toLoad.set(keyFor(rel), BASE_PATH + rel);
    }
  }
  for (const [k, p] of toLoad.entries())
    if (!this.textures.exists(k)) {
      this.load.image(k, p);
      loadedTextureKeys.push(k);
    }

  ghostRect = this.add.graphics();
  ghostRect.setDepth(5000);

  // allowed grid load (may be different resolution)
  const mapGrid = this.cache.json.get("map_grid");
  if (mapGrid && Array.isArray(mapGrid.cells)) {
    allowedGrid = mapGrid.cells;
    appendLog(
      "allowedGrid loaded: " +
        (mapGrid.width || allowedGrid[0].length || 0) +
        "x" +
        (mapGrid.height || allowedGrid.length || 0)
    );
  } else {
    allowedGrid = null;
    appendLog("No map_grid.json found - everything allowed by default.");
  }

  // place & scale background map so it fits the grid area (centered inside grid area)
  let mapImg = null;
  if (this.textures.exists("map")) {
    const tex = this.textures.get("map");
    const srcImg = tex.getSourceImage();
    const srcW = srcImg ? srcImg.width : TILE_W * GRID_COLS;
    const srcH = srcImg ? srcImg.height : TILE_H * GRID_ROWS;
    const targetW = TILE_W * GRID_COLS;
    const targetH = TILE_H * GRID_ROWS;
    const scale = Math.min(targetW / srcW, targetH / srcH);
    const displayW = Math.round(srcW * scale);
    const displayH = Math.round(srcH * scale);

    mapImg = this.add
      .image(GRID_ORIGIN_X, GRID_ORIGIN_Y, "map")
      .setOrigin(0, 0)
      .setDepth(-1);
    mapImg.setDisplaySize(displayW, displayH);
    const extraX = Math.floor((targetW - displayW) / 2);
    const extraY = Math.floor((targetH - displayH) / 2);
    mapImg.x = GRID_ORIGIN_X + extraX;
    mapImg.y = GRID_ORIGIN_Y + extraY;
    mapImg.setAlpha(0.95);
  }

  this.load.once("complete", () => {
    appendLog("Image load complete. Role images: " + loadedTextureKeys.length);
    const firstKey = loadedTextureKeys[0];
    if (firstKey) {
      playerSprite = this.add
        .sprite(
          GRID_ORIGIN_X + Math.floor((GRID_COLS * TILE_W) / 2),
          GRID_ORIGIN_Y + Math.floor((GRID_ROWS * TILE_H) / 2),
          firstKey
        )
        .setOrigin(0.5, 1);
      playerSprite.setScale(SPRITE_SCALE);
      playerSprite.setDepth(playerSprite.y);
      playerSprite.setVisible(!isEditMode);
      playerSprite.active = !isEditMode;
      // Store initial player sprite position for camera system
      playerSprite.setData("origX", playerSprite.x);
      playerSprite.setData("origY", playerSprite.y);

      window.playerSprite = playerSprite;
    }
    // Initialize mission system if in isometric mode
    simulationStarted = true;
    if (playerSprite) {
      // The player sprite is only visible in simulation mode
      playerSprite.setVisible(false);
      playerSprite.active = false;
    }
    if (!scene.budget) {
      scene.budget = new BudgetSystem(scene);
      window.budgetSystem = scene.budget;
      appendLog("[Budget] Sistema de presupuesto inicializado correctamente (post-load).");
    }
    if (
      meta &&
      meta.frames &&
      meta.frames.animations &&
      meta.frames.animations.walk
    ) {
      for (const [dir, arr] of Object.entries(meta.frames.animations.walk)) {
        const frames = arr.map((p) => ({ key: keyFor(p) }));
        const animKey = "walk_" + dir.replace(/-/g, "_");
        if (!this.anims.exists(animKey))
          this.anims.create({
            key: animKey,
            frames,
            frameRate: Math.max(6, Math.min(12, frames.length * 3)),
            repeat: -1,
          });
      }
      if (this.anims.exists("walk_south") && playerSprite)
        playerSprite.play("walk_south");
    }
  });
  this.load.start();

  // pointermove -> preview (apply origin offset)
  this.input.on("pointermove", (pointer) => {
    if (isIsometricMode || !currentDraggedArea) return;
    const rect = scene.sys.canvas.getBoundingClientRect();
    let canvasX, canvasY;
    if (pointer && pointer.event && typeof pointer.event.clientX === "number") {
          const p = clientToCanvas(scene, pointer.event.clientX, pointer.event.clientY);
    canvasX = p.x; canvasY = p.y;
  } else {

    canvasX = pointer.x;
    canvasY = pointer.y;
  }
    const worldPoint = this.cameras.main.getWorldPoint(canvasX, canvasY);
    const localX = worldPoint.x - GRID_ORIGIN_X;
    const localY = worldPoint.y - GRID_ORIGIN_Y;
    const tx = Math.floor(localX / TILE_W);
    const ty = Math.floor(localY / TILE_H);

  updateGhost(tx, ty);

      try {
        if (scene._dragFollowSprite) {
          scene._dragFollowSprite.x = canvasX;
          scene._dragFollowSprite.y = canvasY;
        }
      } catch (e) {
        // ignore
      }
    });

  // Expose small helpers so DOM-based drag can forward coordinates into Phaser
  window._phaserPreviewPointerMove = (clientX, clientY) => {
    try {
      const canvasPos = clientToCanvas(scene, clientX, clientY);

      // actualizar ghost: necesitamos worldPoint
      const worldPoint = scene.cameras.main.getWorldPoint(canvasPos.x, canvasPos.y);
      const localX = worldPoint.x - GRID_ORIGIN_X;
      const localY = worldPoint.y - GRID_ORIGIN_Y;
      const tx = Math.floor(localX / TILE_W);
      const ty = Math.floor(localY / TILE_H);
      updateGhost(tx, ty);

      // actualizar follow sprite (canvas coords)
      if (scene._dragFollowSprite) {
        scene._dragFollowSprite.x = canvasPos.x;
        scene._dragFollowSprite.y = canvasPos.y;
      }
    } catch (e) {
      // ignore
    }
  };

  // pointerup -> finalize placement (from toolbar drag)
  this.input.on("pointerup", phaserPointerUp);

  window._phaserPointerUp = (clientX, clientY) => {
    try {
      const canvasPos = clientToCanvas(scene, clientX, clientY);
      const pointer = { x: canvasPos.x, y: canvasPos.y, event: { clientX, clientY } };
      phaserPointerUp(pointer);
    } catch (e) {
      // ignore
    }
  };


  function phaserPointerUp(pointer) {
    if (isIsometricMode || !currentDraggedArea) return;
    const rel = getCanvasRelativePointer(pointer, scene);
    const worldPoint = scene.cameras.main.getWorldPoint(rel.x, rel.y);

    const localX = worldPoint.x - GRID_ORIGIN_X;
    const localY = worldPoint.y - GRID_ORIGIN_Y;
    const tx = Math.floor(localX / TILE_W),
      ty = Math.floor(localY / TILE_H);

    dbgPlacementState(tx, ty, currentDraggedArea.w, currentDraggedArea.h);
    const okLocal = window.DEV_BYPASS_CLIENT_PLACE
      ? true
      : clientCanPlace(
          localBoard,
          tx,
          ty,
          currentDraggedArea.w,
          currentDraggedArea.h
        );

    // check allowedGrid (using scaling map)
    let okMap = true;
    if (allowedGrid) {
      for (let yy = 0; yy < currentDraggedArea.h; yy++) {
        for (let xx = 0; xx < currentDraggedArea.w; xx++) {
          const cx = tx + xx,
            cy = ty + yy;
          if (!isCellAllowed(cx, cy)) {
            okMap = false;
            break;
          }
        }
        if (!okMap) break;
      }
    }

    if (!okLocal || !okMap) {
      appendLog(`placement invalid at (${tx},${ty})`);
    } else {

      if (!scene.budget) {
        scene.budget = new BudgetSystem(scene);
        console.warn("[Budget] Sistema de presupuesto no inicializado aún.");
        currentDraggedArea = null;
        window.currentDraggedArea = null;
        ghostRect.clear();
        return;
      }
      const canAfford = scene.budget.canAfford(
        currentDraggedArea.type,
        currentDraggedArea.w,
        currentDraggedArea.h,
        currentDraggedArea.missions || 0
      );

      if (canAfford) {
        const purchased = scene.budget.purchase(
          currentDraggedArea.type,
          currentDraggedArea.w,
          currentDraggedArea.h,
          currentDraggedArea.missions || 0
        );

        if (purchased) {
          const areaMeta = {
            id: "a" + Date.now(),
            type: currentDraggedArea.type,
            x: tx,
            y: ty,
            w: currentDraggedArea.w,
            h: currentDraggedArea.h,
            rotation: 0,
            missions: currentDraggedArea.missions || 0,
            playerId: PLAYER_ID || "p1",
          };
          createAreaVisual(scene, areaMeta, true);
          pushUndo({ type: "place", area: clone(areaMeta) });
        }
      }
    }

    currentDraggedArea = null;
    window.currentDraggedArea = null;
    ghostRect.clear();
    // remove follow sprite if exists
    try {
      if (scene._dragFollowSprite) {
        scene._dragFollowSprite.destroy();
        scene._dragFollowSprite = null;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!scene.budget) {
    scene.budget = new BudgetSystem(scene);
    window.budgetSystem = scene.budget;
    appendLog("[Budget] Sistema de presupuesto inicializado correctamente (post-load).");
  }

  window.currentBudgetSystem = scene.budget; 




}

function updateScene() {
  // no player sprite or not visible/active (e.g. in edit mode)
  if (
    !playerSprite ||
    !playerSprite.visible ||
    !playerSprite.active ||
    typeof simulationStarted === "undefined" ||
    !simulationStarted
  )
    return;

  const cursors = this.input.keyboard.createCursorKeys();
  const up = cursors.up.isDown || this.input.keyboard.keys[87].isDown;
  const down = cursors.down.isDown || this.input.keyboard.keys[83].isDown;
  const left = cursors.left.isDown || this.input.keyboard.keys[65].isDown;
  const right = cursors.right.isDown || this.input.keyboard.keys[68].isDown;
  const speed = isIsometricMode ? 1.5 : 1.8;
  let dir = null;
  if (up && right) dir = "north_east";
  else if (up && left) dir = "north_west";
  else if (down && right) dir = "south_east";
  else if (down && left) dir = "south_west";
  else if (up) dir = "north";
  else if (down) dir = "south";
  else if (left) dir = "west";
  else if (right) dir = "east";

  if (dir) {
    const oldX = playerSprite.x;
    const oldY = playerSprite.y;

    // Calculate new position
    let newX = oldX;
    let newY = oldY;

    if (up) newY -= speed;
    if (down) newY += speed;
    if (left) newX -= speed;
    if (right) newX += speed;

    let canMove = true;

    if (isIsometricMode) {
      // In isometric mode, convert screen position to grid coordinates
      const canvasW = this.sys.canvas.width;
      const isoOriginX = canvasW / 2;
      const isoOriginY = 100;

      // Convert new position to grid coordinates
      const isoX = newX - isoOriginX;
      const isoY = newY - isoOriginY;
      const cart = isoToCartesian(isoX, isoY);
      const gridX = Math.floor(cart.x);
      const gridY = Math.floor(cart.y);

      // Check if within grid bounds
      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
        canMove = false;
      }
      // Check if within allowed area (ship)
      else if (!isCellAllowed(gridX, gridY)) {
        canMove = false;
      }
      // Check if colliding with placed areas
      else if (localBoard[gridY] && localBoard[gridY][gridX] !== 0) {
        canMove = false;
      }
    } else {
      // In 2D mode, convert pixel position to grid coordinates
      const gridX = Math.floor((newX - GRID_ORIGIN_X) / TILE_W);
      const gridY = Math.floor((newY - GRID_ORIGIN_Y) / TILE_H);

      // Check if within grid bounds
      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
        canMove = false;
      }
      // Check if within allowed area (ship)
      else if (!isCellAllowed(gridX, gridY)) {
        canMove = false;
      }
      // Check if colliding with placed areas
      else if (localBoard[gridY] && localBoard[gridY][gridX] !== 0) {
        canMove = false;
      }
    }

    if (canMove) {
      playerSprite.x = newX;
      playerSprite.y = newY;
    }

    playerSprite.setDepth(playerSprite.y);
    const animKey = "walk_" + dir;
    const anims = game.scene.scenes[0].anims;
    if (anims.exists(animKey)) {
      if (
        !playerSprite.anims.isPlaying ||
        playerSprite.anims.currentAnim.key !== animKey
      )
        playerSprite.play(animKey);
    } else {
      const fallback =
        "walk_" + (dir.indexOf("_") !== -1 ? dir.split("_")[0] : dir);
      if (anims.exists(fallback)) {
        if (
          !playerSprite.anims.isPlaying ||
          playerSprite.anims.currentAnim.key !== fallback
        )
          playerSprite.play(fallback);
      } else playerSprite.anims.stop();
    }
  } else playerSprite.anims.stop();

  if (isIsometricMode && playerSprite) {
    const camera = this.cameras.main;

    // Calculate target camera position to center player
    const targetX = playerSprite.x - camera.width / 2;
    const targetY = playerSprite.y - camera.height / 2;

    // Smooth lerp to target
    const currentX = camera.scrollX;
    const currentY = camera.scrollY;

    camera.scrollX = currentX + (targetX - currentX) * CAMERA_LERP_SPEED;
    camera.scrollY = currentY + (targetY - currentY) * CAMERA_LERP_SPEED;
  }
}

// --------- BOOT PHASER ----------
const _gameParentEl = document.getElementById("game") || document.body;
const INITIAL_GAME_W = Math.max(200, _gameParentEl.clientWidth);
const INITIAL_GAME_H = Math.max(200, _gameParentEl.clientHeight);

const phaserConfig = {
  type: window.Phaser.AUTO,
  parent: "game",
  width: INITIAL_GAME_W,
  height: INITIAL_GAME_H,
  scale: {
    mode: window.Phaser.Scale.RESIZE, // ensures canvas size follows container
    autoCenter: window.Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  backgroundColor: "#222222",
  scene: { preload: preloadScene, create: createScene, update: updateScene },
};
game = new window.Phaser.Game(phaserConfig);

// --------- BOOT / session init ----------
(async function boot() {
  debugLogEl = document.getElementById("log");
  appendLog("Booting client...");
  await ensureDevSession();
  if (!SESSION_ID) {
    appendLog("No session id found; creating new session...");
    await createAndJoinSession();
  }
  appendLog(
    "Boot finished. SESSION_ID=" + SESSION_ID + " PLAYER_ID=" + PLAYER_ID
  );
  window._mainLoaded = true;
})();

// --------- ISOMETRIC MODE UTILITIES ----------
function cartesianToIso(x, y) {
  return {
    x: (x - y) * (ISO_TILE_W / 2),
    y: (x + y) * (ISO_TILE_H / 2),
  };
}

function isoToCartesian(isoX, isoY) {
  return {
    x: (isoX / (ISO_TILE_W / 2) + isoY / (ISO_TILE_H / 2)) / 2,
    y: (isoY / (ISO_TILE_H / 2) - isoX / (ISO_TILE_W / 2)) / 2,
  };
}

// --------- ISOMETRIC MODE TRANSITION ----------
function startIsometricTransition() {
  if (isIsometricMode) {
    appendLog("Already in isometric mode");
    return;
  }

  isIsometricMode = true;
  window.isIsometricMode = true;
  isEditMode = false;

  // Activate and show player sprite
  if (playerSprite && simulationStarted) {
    playerSprite.setVisible(true);
    playerSprite.active = true;
  }

  appendLog("Starting isometric transition...");
  const scene = game.scene.scenes[0];

  // Disable toolbar during transition
  enableToolbar(false);
  // Destroy in-game toolbar if created
  try {
    if (scene && scene._inGameToolbar && scene._inGameToolbar.container) {
      scene._inGameToolbar.container.destroy();
      scene._inGameToolbar = null;
    }
  } catch (e) {
    console.warn("failed to remove in-game toolbar", e);
  }

  // Show HUD stats with fade-in when simulation starts
  if (scene && typeof scene.showStats === "function")
    scene.showStats({ duration: 800 });

  setTimeout(() => {
    if (window.eventSystem) {
      window.eventSystem.start();
      appendLog("Event system started");
    }
  }, 2000);

  setTimeout(() => {
    if (window.missionSystem) {
      console.log("Initializing mission system...");

      // Obtener áreas colocadas
      const placedAreaTypes = Array.from(areasById.values()).map(
        (entry) => entry.meta.type
      );
      const uniqueAreas = [...new Set(placedAreaTypes)];

      console.log("Placed areas:", uniqueAreas);
      console.log("Total areas:", areasById.size);

      const playerCount = 1;
      const playerRoles = [ROLE];

      console.log("Player count:", playerCount);
      console.log("Player roles:", playerRoles);

      window.missionSystem.initialize(playerCount, playerRoles, uniqueAreas);
      appendLog("Mission system started");

      console.log("Mission system initialized successfully");
    } else {
      console.error("Mission system not found!");
      appendLog("ERROR: Mission system not loaded");
    }
  }, 2500);

  // Transition to isometric view
  transitionToIsometric(scene);
}

function transitionToIsometric(scene) {
  isIsometricMode = true;
  window.isIsometricMode = true; // Expose globally
  isEditMode = false; // Exit edit mode if active

  // Ensure player sprite is visible
  if (playerSprite && simulationStarted) {
    playerSprite.setVisible(true);
    playerSprite.active = true;
  }

  // Do visible the player sprite if it exists
  if (playerSprite) {
    playerSprite.setVisible(true);
    playerSprite.active = true;
  }

  // Calculate isometric grid origin (centered)
  const canvasW = scene.sys.canvas.width;
  const canvasH = scene.sys.canvas.height;
  const isoOriginX = canvasW / 2;
  const isoOriginY = 100; // Top padding

  const mapImg = scene.children.list.find(
    (child) =>
      child.type === "Image" && child.texture && child.texture.key === "map"
  );
  if (mapImg) {
    // Fade out the old 2D map
    scene.tweens.add({
      targets: mapImg,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => {
        mapImg.destroy();
      },
    });
  }

  // This ensures proper layering and prevents planet floor from appearing first

  // Store original positions for transition
  const originalPositions = new Map();

  areasById.forEach((entry, id) => {
    const { container } = entry;
    scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 600,
      ease: "Cubic.easeOut",
    });
  });

  setTimeout(() => {
    // Create floors in correct order
    createShipFloor(scene, isoOriginX, isoOriginY);
    createPlanetFloor(scene, isoOriginX, isoOriginY);

    areasById.forEach((entry, id) => {
      const { container, meta } = entry;
      container.removeAll(true);
      container.setAlpha(1);

      // Recreate area in isometric style
      recreateAreaIsometric(scene, entry, isoOriginX, isoOriginY);
    });
  }, 650);

  // Animate player sprite
  if (playerSprite) {
    const playerGridX = (playerSprite.x - GRID_ORIGIN_X) / TILE_W;
    const playerGridY = (playerSprite.y - GRID_ORIGIN_Y) / TILE_H;
    const playerIsoPos = cartesianToIso(playerGridX, playerGridY);

    playerSprite.setData("origX", isoOriginX + playerIsoPos.x);
    playerSprite.setData("origY", isoOriginY + playerIsoPos.y);

    scene.tweens.add({
      targets: playerSprite,
      x: isoOriginX + playerIsoPos.x,
      y: isoOriginY + playerIsoPos.y,
      scaleX: SPRITE_SCALE * 1.2,
      scaleY: SPRITE_SCALE * 1.2,
      duration: 1500,
      ease: "Cubic.easeInOut",
    });
  }

  // Fade out the grid
  const gridGraphics = scene.children.list.find(
    (child) => child.type === "Graphics" && child !== ghostRect
  );
  if (gridGraphics) {
    scene.tweens.add({
      targets: gridGraphics,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
    });
  }

  setTimeout(() => {
    createIsometricGrid(scene, isoOriginX, isoOriginY);
    appendLog("Isometric transition complete!");
  }, 850);
}

function createIsometricGrid(scene, originX, originY) {
  const isoGrid = scene.add.graphics();
  isoGrid.lineStyle(1, 0x444444, 0.5);

  // Draw isometric grid
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const iso = cartesianToIso(x, y);
      const screenX = originX + iso.x;
      const screenY = originY + iso.y;

      // Draw horizontal lines
      if (x < GRID_COLS) {
        const isoNext = cartesianToIso(x + 1, y);
        const nextX = originX + isoNext.x;
        const nextY = originY + isoNext.y;
        isoGrid.lineBetween(screenX, screenY, nextX, nextY);
      }

      // Draw vertical lines
      if (y < GRID_ROWS) {
        const isoNext = cartesianToIso(x, y + 1);
        const nextX = originX + isoNext.x;
        const nextY = originY + isoNext.y;
        isoGrid.lineBetween(screenX, screenY, nextX, nextY);
      }
    }
  }

  isoGrid.setDepth(-1);
  isoGrid.setAlpha(0);

  // Fade in the isometric grid
  scene.tweens.add({
    targets: isoGrid,
    alpha: 1,
    duration: 800,
    ease: "Cubic.easeIn",
  });
}

function recreateAreaIsometric(scene, entry, originX, originY) {
  const { container, meta } = entry;

  // Clear old graphics
  container.removeAll(true);

  const graphics = scene.add.graphics();
  const color = colorForType(meta.type);

  // Draw isometric tiles for the area
  for (let dy = 0; dy < meta.h; dy++) {
    for (let dx = 0; dx < meta.w; dx++) {
      const tileX = meta.x + dx;
      const tileY = meta.y + dy;
      const iso = cartesianToIso(tileX, tileY);

      const screenX = originX + iso.x;
      const screenY = originY + iso.y;

      graphics.fillStyle(color, 0.3);
      graphics.beginPath();
      graphics.moveTo(screenX, screenY); // Top
      graphics.lineTo(screenX + ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Right
      graphics.lineTo(screenX, screenY + ISO_TILE_H); // Bottom
      graphics.lineTo(screenX - ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Left
      graphics.closePath();
      graphics.fillPath();

      // Draw outline
      graphics.lineStyle(2, color, 0.8);
      graphics.strokePath();
    }
  }

  const centerIso = cartesianToIso(meta.x + meta.w / 2, meta.y + meta.h / 2);
  const iconPath = iconForType(meta.type);
  const iconKey = `area_icon_${meta.type}`;

  if (iconPath && scene.textures.exists(iconKey)) {
    const icon = scene.add.image(
      originX + centerIso.x,
      originY + centerIso.y - 10,
      iconKey
    );
    const iconSize = Math.min(meta.w, meta.h) * 20;
    icon.setDisplaySize(iconSize, iconSize);
    icon.setAlpha(0.95);
    container.add(icon);
  }

  // Add label at center of area
  const label = scene.add.text(
    originX + centerIso.x,
    originY + centerIso.y + 15,
    meta.type,
    {
      fontSize: "10px",
      color: "#fff",
      backgroundColor: "#000000cc",
      padding: { x: 4, y: 2 },
    }
  );
  label.setOrigin(0.5);

  container.x = 0;
  container.y = 0;
  container.add([graphics, label]);
  container.setDepth(meta.y * 100 + meta.x); // Proper depth sorting for isometric

  container.setAlpha(0);
  scene.tweens.add({
    targets: container,
    alpha: 1,
    duration: 800,
    ease: "Cubic.easeIn",
  });
}

function createPlanetFloor(scene, originX, originY) {
  const planetFloor = scene.add.graphics();
  planetFloor.setDepth(-150);

  const planetColor1 = 0x8b4513;
  const planetColor2 = 0xa0522d;
  const planetColor3 = 0xcd853f;
  let planetTileCount = 0;
  for (let ty = 0; ty < GRID_ROWS; ty++) {
    for (let tx = 0; tx < GRID_COLS; tx++) {
      if (!isCellAllowed(tx, ty)) {
        planetTileCount++;
        const iso = cartesianToIso(tx, ty);
        const screenX = originX + iso.x;
        const screenY = originY + iso.y;

        const random = Math.random();
        let color = planetColor1;
        if (random > 0.66) color = planetColor3;
        else if (random > 0.33) color = planetColor2;

        planetFloor.fillStyle(color, 0.85);
        planetFloor.beginPath();
        planetFloor.moveTo(screenX, screenY); // Top
        planetFloor.lineTo(screenX + ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Right
        planetFloor.lineTo(screenX, screenY + ISO_TILE_H); // Bottom
        planetFloor.lineTo(screenX - ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Left
        planetFloor.closePath();
        planetFloor.fillPath();

        planetFloor.lineStyle(1, 0x654321, 0.4);
        planetFloor.strokePath();

        if (Math.random() > 0.7) {
          planetFloor.lineStyle(1, 0x654321, 0.3);
          planetFloor.lineBetween(
            screenX - ISO_TILE_W / 4,
            screenY + ISO_TILE_H / 2,
            screenX + ISO_TILE_W / 4,
            screenY + ISO_TILE_H / 2
          );
        }
      }
    }
  }

  planetFloor.setData("origX", 0);
  planetFloor.setData("origY", 0);

  planetFloor.setAlpha(0);
  scene.tweens.add({
    targets: planetFloor,
    alpha: 1,
    duration: 1000,
    delay: 200, // Small delay to ensure ship floor appears first
    ease: "Cubic.easeIn",
  });

  appendLog("Planet floor created (only outside ship)");
}

function createShipFloor(scene, originX, originY) {
  const shipFloor = scene.add.graphics();
  shipFloor.setDepth(-50);

  const floorColor = 0x4a5568;
  const floorColorLight = 0x5a6578;

  if (allowedGrid && allowedGrid.length > 0) {
    const agRows = allowedGrid.length;
    const agCols = allowedGrid[0].length;

    let shipTileCount = 0;

    for (let ty = 0; ty < GRID_ROWS; ty++) {
      for (let tx = 0; tx < GRID_COLS; tx++) {
        if (isCellAllowed(tx, ty)) {
          shipTileCount++;
          const iso = cartesianToIso(tx, ty);
          const screenX = originX + iso.x;
          const screenY = originY + iso.y;

          const color = (tx + ty) % 2 === 0 ? floorColor : floorColorLight;

          shipFloor.fillStyle(color, 0.9);
          shipFloor.beginPath();
          shipFloor.moveTo(screenX, screenY); // Top
          shipFloor.lineTo(screenX + ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Right
          shipFloor.lineTo(screenX, screenY + ISO_TILE_H); // Bottom
          shipFloor.lineTo(screenX - ISO_TILE_W / 2, screenY + ISO_TILE_H / 2); // Left
          shipFloor.closePath();
          shipFloor.fillPath();

          shipFloor.lineStyle(1, 0x2d3748, 0.5);
          shipFloor.strokePath();

          if (Math.random() > 0.85) {
            shipFloor.lineStyle(1, 0x718096, 0.6);
            shipFloor.lineBetween(
              screenX - ISO_TILE_W / 4,
              screenY + ISO_TILE_H / 2,
              screenX + ISO_TILE_W / 4,
              screenY + ISO_TILE_H / 2
            );
          }
        }
      }
    }
  }

  shipFloor.setData("origX", 0);
  shipFloor.setData("origY", 0);

  // Fade in
  shipFloor.setAlpha(0);
  scene.tweens.add({
    targets: shipFloor,
    alpha: 1,
    duration: 1000,
    ease: "Cubic.easeIn",
  });

  appendLog("Ship floor created in isometric view");
}

window.areasById = areasById;
