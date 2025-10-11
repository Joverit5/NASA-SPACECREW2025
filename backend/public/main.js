function checkAllDependencies() {
  const deps = {
    'Phaser': typeof window.Phaser !== 'undefined',
    'Socket.io': typeof window.io !== 'undefined',
    'BudgetSystem': typeof window.BudgetSystem !== 'undefined',
    'EventSystem': typeof window.eventSystem !== 'undefined',
    'MissionSystem': typeof window.MissionSystem !== 'undefined',
    'MISSION_BANK': typeof window.MISSION_BANK !== 'undefined',
  };
  
  console.log('🔍 Dependencies Check:', deps);
  
  const allReady = Object.values(deps).every(v => v === true);
  if (!allReady) {
    const missing = Object.entries(deps)
      .filter(([_, loaded]) => !loaded)
      .map(([name]) => name);
    console.warn('⚠️ Missing dependencies:', missing);
  }
  
  return { allReady, deps };
}

// ========== CRITICAL: Must be false at start ==========
let simulationStarted = false;

// --------- CONFIG & GLOBALS ----------
const ROLE = "crew" // Will be set by multiplayer system
const BASE_PATH = `/assets/crew/crew_assets/crew_medic/` // Default, will be updated
const META_PATH = BASE_PATH + "metadata.json"

const TILE_W = 32, TILE_H = 32
const ISO_TILE_W = 64, ISO_TILE_H = 32
const SPRITE_SCALE = 1
const DEV_AUTO_RECREATE_ON_MISSING = true

let SESSION_ID = null
let PLAYER_ID = null
let sessionReady = false

let game = null, playerSprite = null, ghostRect = null
const isIsometricMode = false
window.isIsometricMode = false
let isEditMode = true // Flag para controlar si estamos en modo edición

const otherPlayers = new Map() // Track other players' sprites
let isHost = false // Track if current player is host
const currentPlayerRole = null // Track current player's role

let localBoard = Array.from({ length: 20 }, () => Array(20).fill(0))
let currentDraggedArea = null // keep this reference
window.currentDraggedArea = currentDraggedArea // expose for console
const loadedTextureKeys = []
let debugLogEl = null
let stateEl = document.getElementById("session-state") // Changed from const to let

const cameraOffsetX = 0
const cameraOffsetY = 0
const CAMERA_LERP_SPEED = 0.08 // Smooth camera follow speed (0-1, lower = smoother)

const areasById = new Map()
const undoStack = [], redoStack = []
const MAX_UNDO = 200
const removedSet = new Set() // for undo+server sync
let allowedGrid = null // boolean grid loaded from /assets/maps/map_grid.json

// GRID config & origin for centering/scaling map
const GRID_COLS = 20
const GRID_ROWS = 20
let GRID_ORIGIN_X = 0, GRID_ORIGIN_Y = 0

// dev debug flags
window.DEV_BYPASS_CLIENT_PLACE = false

window._mainLoaded = false

// --------- UTIL HELPERS ----------
function appendLog(msg) {
  debugLogEl = debugLogEl || document.getElementById("log")
  if (!debugLogEl) return
  debugLogEl.innerText = `${new Date().toLocaleTimeString()} - ${msg}\n` + debugLogEl.innerText
}
function keyFor(relPath) {
  return (ROLE + "_" + relPath).replace(/[^a-zA-Z0-9_]/g, "_")
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}
function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

function dbgPlacementState(tx, ty, w, h) {
  try {
    const rows = Math.max(6, Math.min(20, localBoard.length))
    const sample = localBoard.slice(0, rows).map((r) => r.join(","))
    console.log(
      "[DBG] placement test at",
      tx,
      ty,
      "size",
      w + "x" + h,
      "allowedGrid?",
      !!allowedGrid,
      "local sample:",
      sample,
    )
  } catch (e) {
    console.warn("dbgPlacementState error", e)
  }
}

// --------- client placement check (tile bounds + occupancy) ----------
function clientCanPlace(board, x, y, w, h, ignoreAreaId = null) {
  if (!board || !board[0]) return false
  if (x < 0 || y < 0 || x + w > board[0].length || y + h > board.length) return false
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const cell = board[y + j][x + i]
      if (cell !== 0) {
        if (ignoreAreaId && cell === ignoreAreaId) continue
        return false
      }
    }
  return true
}

// --------- allowedGrid mapping: if allowedGrid size != GRID size, map coordinates properly
function isCellAllowed(tx, ty) {
  if (!allowedGrid) return true
  const agRows = allowedGrid.length
  const agCols = (allowedGrid[0] || []).length
  if (!agRows || !agCols) return true

  // Clamp tile coords to valid range
  if (tx < 0 || ty < 0 || tx >= GRID_COLS || ty >= GRID_ROWS) return false

  // Map game grid coordinates (20x20) to allowedGrid coordinates (128x128)
  const cellsPerTileX = agCols / GRID_COLS
  const cellsPerTileY = agRows / GRID_ROWS

  // Sample the center of the tile in allowedGrid space
  const centerX = Math.floor((tx + 0.5) * cellsPerTileX)
  const centerY = Math.floor((ty + 0.5) * cellsPerTileY)

  // Clamp to allowedGrid bounds
  const cx = clamp(centerX, 0, agCols - 1)
  const cy = clamp(centerY, 0, agRows - 1)

  return !!allowedGrid[cy][cx]
}

// --------- SOCKET initialization (safe) ----------
const io = window.io
if (typeof io !== "undefined") {
  try {
    window.socket = io()
    appendLog("Socket.IO initializing...")
  } catch (e) {
    console.error("Failed to initialize socket:", e)
    appendLog("ERROR: Socket.IO failed to initialize")
    window.socket = null
  }
} else {
  console.warn("socket.io client not loaded")
  appendLog("WARNING: socket.io not available - running in offline mode")
  window.socket = null
}

// --------- SOCKET handlers (safe checks) ----------
if (window.socket && typeof window.socket.on === "function") {
  window.socket.on("session_state", (st) => {
    appendLog("session_state received")
    if (!st) return

    if (st.map && Array.isArray(st.map.tiles)) {
      try {
        localBoard = st.map.tiles.map((row) => row.map((cell) => (cell === 0 || !cell ? 0 : cell)))
      } catch (e) {
        localBoard = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0))
      }
    }

    sessionReady = true
    enableToolbar(st.hostId === PLAYER_ID)

    if (Array.isArray(st.areas)) {
      const serverIds = new Set(st.areas.map((a) => a.id))
      for (const rid of Array.from(removedSet)) if (!serverIds.has(rid)) removedSet.delete(rid)

      const localIds = new Set(areasById.keys())
      for (const a of st.areas) {
        if (removedSet.has(a.id)) continue
        if (!areasById.has(a.id)) {
          const scene = game?.scene?.scenes[0]
          if (scene) createAreaVisual(scene, a, false)
        } else {
          const entry = areasById.get(a.id)
          entry.meta = a
          entry.container.x = GRID_ORIGIN_X + a.x * TILE_W
          entry.container.y = GRID_ORIGIN_Y + a.y * TILE_H
        }
      }
      for (const lid of localIds) {
        if (!serverIds.has(lid) && !removedSet.has(lid)) {
          const entry = areasById.get(lid)
          if (entry) {
            entry.container.destroy()
            areasById.delete(lid)
          }
          clearAreaTiles(entry.meta)
        }
      }
    }

    if (st.hostId) {
      isHost = PLAYER_ID === st.hostId
      enableToolbar(isHost)
    }

    if (st.missionStarted && !simulationStarted) {
      appendLog("🚀 Mission started!")
      startIsometricTransition()
    }

    if (Array.isArray(st.players)) {
      st.players.forEach((player) => {
        if (player.id !== PLAYER_ID) {
          updateOtherPlayerSprite(player)
        }
      })
    }
  })

  window.socket.on("mission_started", (data) => {
    appendLog("🚀 Mission started!")
    console.log("[Socket] mission_started event received:", data);
    
    if (!simulationStarted) {
      console.log("[Socket] Calling startIsometricTransition...");
      startIsometricTransition();
    } else {
      console.log("[Socket] Mission already started, skipping transition");
    }
  })

  window.socket.on("player_joined", (data) => {
    appendLog(`👤 ${data.player?.name} (${data.player?.role}) joined`)

    if (data.sessionState && data.sessionState.areas) {
      const scene = game?.scene?.scenes[0]
      if (scene) {
        data.sessionState.areas.forEach((area) => {
          if (!areasById.has(area.id)) {
            createAreaVisual(scene, area, false)
          }
        })
      }
    }

    if (data.player && data.player.id !== PLAYER_ID) {
      createOtherPlayerSprite(data.player)
    }
  })

  window.socket.on("player_left", (data) => {
    appendLog(`👋 ${data.name} left`)
    removeOtherPlayerSprite(data.id)
  })

  window.socket.on("player_moved", (data) => {
    if (data.playerId !== PLAYER_ID) {
      updateOtherPlayerPosition(data.playerId, data.x, data.y)
    }
  })

  window.socket.on("chat_message", (data) => {
    appendLog(`💬 ${data.playerName}: ${data.message}`)
    if (window.chatSystem) {
      window.chatSystem.addMessage(data.playerName, data.message)
    }
  })

  window.socket.on("place_error", (err) => {
    appendLog("place_error: " + JSON.stringify(err))
    if (err && err.reason === "session_not_found" && DEV_AUTO_RECREATE_ON_MISSING) {
      localStorage.removeItem("DEV_SESSION_ID")
      localStorage.removeItem("DEV_PLAYER_ID")
      SESSION_ID = null
      PLAYER_ID = null
    } else if (err && err.reason === "not_host") {
      appendLog("⚠️ Solo el host puede editar el mapa")
      alert("Solo el host puede colocar o mover áreas")
    }
  })

  window.socket.on("area_placed", (data) => {
    if (!data.area) return
    const scene = game?.scene?.scenes[0]
    if (!scene) return

    if (!areasById.has(data.area.id)) {
      appendLog(`📦 Area placed: ${data.area.type} at (${data.area.x}, ${data.area.y})`)
      createAreaVisual(scene, data.area, false)
    }
  })

  window.socket.on("area_updated", (data) => {
    if (!data.areaId || !data.updates) return

    const entry = areasById.get(data.areaId)
    if (!entry) return

    appendLog(`🔄 Area updated: ${data.areaId}`)

    Object.assign(entry.meta, data.updates)

    if (data.updates.x !== undefined || data.updates.y !== undefined) {
      entry.container.x = GRID_ORIGIN_X + entry.meta.x * TILE_W
      entry.container.y = GRID_ORIGIN_Y + entry.meta.y * TILE_H
    }

    clearAreaTiles(entry.meta)
    fillAreaTiles(entry.meta, data.areaId)
  })

  window.socket.on("area_removed", (data) => {
    if (!data.areaId) return

    const entry = areasById.get(data.areaId)
    if (!entry) return

    appendLog(`🗑️ Area removed: ${data.areaId}`)

    entry.container.destroy()
    areasById.delete(data.areaId)
    clearAreaTiles(entry.meta)
  })

  window.socket.on("player_update", (u) => appendLog("player_update: " + JSON.stringify(u)))
  window.socket.on("event_triggered", (ev) => appendLog("event: " + (ev && ev.name)))
}

// --------- UI / TOOLBAR (define BEFORE scene) ----------
function createToolbar() {
  function globalPointerMove(e) {
    if (!currentDraggedArea) return
    if (typeof window._phaserPreviewPointerMove === "function") window._phaserPreviewPointerMove(e.clientX, e.clientY)
  }
  function globalPointerUp(e) {
    if (!currentDraggedArea) return
    if (typeof window._phaserPointerUp === "function") window._phaserPointerUp(e.clientX, e.clientY)
  }
  document.addEventListener("pointermove", globalPointerMove)
  document.addEventListener("pointerup", globalPointerUp)
}
function enableToolbar(yes) {
  const bar = document.getElementById("toolbar_bar")
  if (!bar) return
  const buttons = bar.querySelectorAll("button")
  buttons.forEach((b) => {
    if (b.id === "btn_start_sim") {
      b.disabled = !yes
      if (!yes) {
        b.title = "Solo el host puede iniciar la misión"
      }
    } else {
      b.disabled = !yes
      if (!yes) {
        b.title = "Solo el host puede editar"
      }
    }
  })

  if (!yes) {
    appendLog("⚠️ Modo espectador: solo el host puede editar")
  }
}

// --------- GHOST PREVIEW (uses allowedGrid mapping) ----------
function updateGhost(tx, ty) {
  if (!ghostRect || !currentDraggedArea) return
  ghostRect.clear()
  const px = GRID_ORIGIN_X + tx * TILE_W,
    py = GRID_ORIGIN_Y + ty * TILE_H
  const wpx = currentDraggedArea.w * TILE_W,
    hpx = currentDraggedArea.h * TILE_H

  const okCollision = clientCanPlace(localBoard, tx, ty, currentDraggedArea.w, currentDraggedArea.h)
  let okMap = true
  if (allowedGrid) {
    for (let yy = 0; yy < currentDraggedArea.h; yy++) {
      for (let xx = 0; xx < currentDraggedArea.w; xx++) {
        const cx = tx + xx,
          cy = ty + yy
        if (!isCellAllowed(cx, cy)) {
          okMap = false
          break
        }
      }
      if (!okMap) break
    }
  }

  const ok = (window.DEV_BYPASS_CLIENT_PLACE ? true : okCollision) && okMap
  const color = ok ? 0x00ff00 : 0xff0000
  ghostRect.fillStyle(color, 0.35)
  ghostRect.fillRect(px, py, wpx, hpx)
  ghostRect.lineStyle(2, color, 0.95)
  ghostRect.strokeRect(px, py, wpx, hpx)
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
  }
  return map[type] || 0x888888
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
  }
  return map[type] || null
}

function fillAreaTiles(areaMeta, idToSet = null) {
  const { x, y, w, h } = areaMeta
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const px = x + i,
        py = y + j
      if (py >= 0 && py < localBoard.length && px >= 0 && px < localBoard[0].length)
        localBoard[py][px] = idToSet || areaMeta.id || 1
    }
}
function clearAreaTiles(areaMeta) {
  fillAreaTiles(areaMeta, 0)
}

function pushUndo(op) {
  if (undoStack.length >= MAX_UNDO) undoStack.shift()
  undoStack.push(op)
  redoStack.length = 0
}

function createAreaVisual(scene, areaMeta, emitToServer = false) {
  const { id, type, x, y, w, h } = areaMeta
  const px = GRID_ORIGIN_X + x * TILE_W
  const py = GRID_ORIGIN_Y + y * TILE_H
  const container = scene.add.container(px, py).setSize(w * TILE_W, h * TILE_H)
  const iconPath = iconForType(type)
  const iconKey = `area_icon_${type}`

  // Helper functions for hover label
  function showLabel() {
    if (container._hoverLabel) return
    const label = scene.add
      .text((w * TILE_W) / 2, -18, type, {
        fontSize: "14px",
        color: "#fff",
        backgroundColor: "#222a",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(9999)
    container.add(label)
    container._hoverLabel = label
  }
  function hideLabel() {
    if (container._hoverLabel) {
      container._hoverLabel.destroy()
      container._hoverLabel = null
    }
  }

  function addIconToContainer(icon) {
    icon.setInteractive({ cursor: "pointer" })
    icon.on("pointerover", showLabel)
    icon.on("pointerout", hideLabel)
    container.add(icon)
  }

  if (iconPath && !scene.textures.exists(iconKey)) {
    scene.load.image(iconKey, iconPath)
    scene.load.once("complete", () => {
      if (scene.textures.exists(iconKey)) {
        const icon = scene.add.image((w * TILE_W) / 2, (h * TILE_H) / 2, iconKey)
        icon.setDisplaySize(w * TILE_W, h * TILE_H)
        icon.setAlpha(0.95)
        addIconToContainer(icon)
      }
    })
    scene.load.start()
  } else if (iconPath && scene.textures.exists(iconKey)) {
    const icon = scene.add.image((w * TILE_W) / 2, (h * TILE_H) / 2, iconKey)
    icon.setDisplaySize(w * TILE_W, h * TILE_H)
    icon.setAlpha(0.95)
    addIconToContainer(icon)
  }
  container.setInteractive(
    new window.Phaser.Geom.Rectangle(0, 0, w * TILE_W, h * TILE_H),
    window.Phaser.Geom.Rectangle.Contains,
  )

  container.setData("areaId", id)

  // Only allow dragging if host
  if (isHost) {
    scene.input.setDraggable(container)

    container.on("dragstart", () => {
      clearAreaTiles(areaMeta)
      container.setAlpha(0.85)
      selectArea(id)
    })

    container.on("drag", (pointer) => {
      const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
      const localX = worldPoint.x - GRID_ORIGIN_X
      const localY = worldPoint.y - GRID_ORIGIN_Y
      let tx = Math.floor(localX / TILE_W),
        ty = Math.floor(localY / TILE_H)
      tx = clamp(tx, 0, GRID_COLS - areaMeta.w)
      ty = clamp(ty, 0, GRID_ROWS - areaMeta.h)
      container.x = GRID_ORIGIN_X + tx * TILE_W
      container.y = GRID_ORIGIN_Y + ty * TILE_H
      currentDraggedArea = {
        type: areaMeta.type,
        w: areaMeta.w,
        h: areaMeta.h,
        color: colorForType(areaMeta.type),
      }
      window.currentDraggedArea = currentDraggedArea
      updateGhost(tx, ty)
    })
    container.on("dragend", () => {
      container.setAlpha(1)
      const newX = Math.round((container.x - GRID_ORIGIN_X) / TILE_W),
        newY = Math.round((container.y - GRID_ORIGIN_Y) / TILE_H)
      const oldMeta = clone(areaMeta)
      dbgPlacementState(newX, newY, areaMeta.w, areaMeta.h)
      const ok = window.DEV_BYPASS_CLIENT_PLACE
        ? true
        : clientCanPlace(localBoard, newX, newY, areaMeta.w, areaMeta.h, id)
      console.log(`[DBG] move ok=${ok} newX=${newX} newY=${newY} id=${id}`)
      if (!ok) {
        appendLog("Move invalid (collision). Reverting.")
        container.x = GRID_ORIGIN_X + oldMeta.x * TILE_W
        container.y = GRID_ORIGIN_Y + oldMeta.y * TILE_H
        fillAreaTiles(oldMeta, oldMeta.id)
        return
      }
      areaMeta.x = newX
      areaMeta.y = newY
      fillAreaTiles(areaMeta, id)
      appendLog(`Area moved: ${id} -> (${newX},${newY})`)

      window.socket.emit &&
        window.socket.emit("update_area", {
          sessionId: SESSION_ID,
          areaId: id,
          updates: { x: newX, y: newY },
        })
    })
  } else {
    // Non-hosts can only view
    container.on("pointerdown", () => {
      selectArea(id)
      if (window.isIsometricMode && window.missionSystem && window.missionSystem.isInitialized) {
        console.log("Area clicked in isometric mode:", areaMeta.type)
        window.missionSystem.handleAreaClick(areaMeta.type)
      }
    })
  }

  areasById.set(id, { container, meta: areaMeta })
  fillAreaTiles(areaMeta, id)
  if (emitToServer) {
    window.socket.emit &&
      window.socket.emit("place_area", {
        sessionId: SESSION_ID,
        area: {
          type: areaMeta.type,
          x: areaMeta.x,
          y: areaMeta.y,
          w: areaMeta.w,
          h: areaMeta.h,
        },
      })
    appendLog("place_area -> " + JSON.stringify(areaMeta))
  }
  return container
}

let selectedAreaId = null
function selectArea(id) {
  if (selectedAreaId && areasById.has(selectedAreaId)) {
    const prev = areasById.get(selectedAreaId)
    const g = prev.container.list[0]
    g.clear()
      .fillStyle(colorForType(prev.meta.type), 0.35)
      .fillRect(0, 0, prev.meta.w * TILE_W, prev.meta.h * TILE_H)
      .lineStyle(2, colorForType(prev.meta.type), 1)
      .strokeRect(0, 0, prev.meta.w * TILE_W, prev.meta.h * TILE_H)
  }
  selectedAreaId = id
  if (!areasById.has(id)) return
  const sel = areasById.get(id)
  const g = sel.container.list[0]
  g.clear()
    .fillStyle(colorForType(sel.meta.type), 0.35)
    .fillRect(0, 0, sel.meta.w * TILE_W, sel.meta.h * TILE_H)
    .lineStyle(4, 0xffff00, 1)
    .strokeRect(0, 0, sel.meta.w * TILE_W, sel.meta.h * TILE_H)
  appendLog("selected area " + id)
}
function getSelectedArea() {
  if (!selectedAreaId) return null
  return areasById.get(selectedAreaId)
}

function rotateSelected(objEntry) {
  if (!objEntry) objEntry = getSelectedArea()
  if (!objEntry) return
  const meta = objEntry.meta
  const prev = clone(meta)
  clearAreaTiles(meta)
  const newW = meta.h,
    newH = meta.w
  if (!clientCanPlace(localBoard, meta.x, meta.y, newW, newH, meta.id)) {
    appendLog("Rotate blocked by collision or bounds.")
    fillAreaTiles(meta, meta.id)
    return
  }
  meta.w = newW
  meta.h = newH
  meta.rotation = (meta.rotation || 0) + 90
  const container = objEntry.container
  container.removeAll(true)
  const scene = game.scene.scenes[0]
  const g = scene.add.graphics()
  g.fillStyle(colorForType(meta.type), 0.35)
  g.fillRect(0, 0, meta.w * TILE_W, meta.h * TILE_H)
  g.lineStyle(2, colorForType(meta.type), 1)
  g.strokeRect(0, 0, meta.w * TILE_W, meta.h * TILE_H)
  const label = scene.add.text(4, 4, meta.type, {
    fontSize: "12px",
    color: "#111",
  })
  container.add([g, label])
  container.setSize(meta.w * TILE_W, meta.h * TILE_H)
  fillAreaTiles(meta, meta.id)
  pushUndo({ type: "rotate", areaId: meta.id, from: prev, to: clone(meta) })
  window.socket.emit && window.socket.emit("update_area", { sessionId: SESSION_ID, area: meta })
  appendLog("rotated area " + meta.id)
}

function deleteSelected(objEntry) {
  if (!objEntry) objEntry = getSelectedArea()
  if (!objEntry) return
  const meta = objEntry.meta
  objEntry.container.destroy()
  areasById.delete(meta.id)
  clearAreaTiles(meta)
  removedSet.add(meta.id)
  window.socket.emit &&
    window.socket.emit("remove_area", {
      sessionId: SESSION_ID,
      areaId: meta.id,
    })
  pushUndo({ type: "delete", area: clone(meta) })
  appendLog("deleted area " + meta.id)
  selectedAreaId = null
}

// --------- SCENE: preload / create / update ----------
function preloadScene() {
  this.load.json("meta", META_PATH)
  this.load.image("map", "/assets/maps/map.png")
  this.load.image("next", "/assets/next.png")
  this.load.image("previous", "/assets/previous.png")
  this.load.json("map_grid", "/assets/maps/map_grid.json")
  this.load.audio("error_sound", "/assets/sfx/error.mp3")
  
  const stats = ["hp", "hunger", "oxygen", "energy", "sanity", "fatigue"]
  const states = ["low", "mid", "high"]
  for (const stat of stats) {
    for (const s of states) {
      const key = `${stat}_${s}`
      const path = `/assets/variables/${stat}_${s}.png`
      if (!this.textures.exists(key)) this.load.image(key, path)
    }
  }

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
  }
  for (const [type, path] of Object.entries(areaIconMap)) {
    const key = `area_icon_${type}`
    if (!this.textures.exists(key)) this.load.image(key, path)
  }
}

function createScene() {
  function clientToCanvas(scene, clientX, clientY) {
    const rect = scene.sys.canvas.getBoundingClientRect()
    const scaleX = scene.sys.canvas.width / rect.width
    const scaleY = scene.sys.canvas.height / rect.height
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    return { x, y }
  }
  function getCanvasRelativePointer(pointer, scene) {
    const rect = scene.sys.canvas.getBoundingClientRect()

    if (pointer && pointer.event && pointer.event.clientX !== undefined) {
      return { x: pointer.event.clientX - rect.left, y: pointer.event.clientY - rect.top }
    }

    if (typeof pointer.x === "number" && typeof pointer.y === "number") {
      const scaleX = rect.width / scene.sys.canvas.width
      const scaleY = rect.height / scene.sys.canvas.height
      return { x: pointer.x * scaleX, y: pointer.y * scaleY }
    }
    return { x: 0, y: 0 }
  }

  const scene = this
  const { width, height } = scene.sys.game.canvas
  debugLogEl = document.getElementById("log")
  stateEl = document.getElementById("session-state")
  appendLog("createScene starting...")
  
  const canvasW = this.sys.canvas.width
  const canvasH = this.sys.canvas.height
  const gridPixelW = TILE_W * GRID_COLS
  const gridPixelH = TILE_H * GRID_ROWS
  GRID_ORIGIN_X = Math.floor((canvasW - gridPixelW) / 2)
  GRID_ORIGIN_Y = Math.floor((canvasH - gridPixelH) / 2)

  const g = this.add.graphics()
  g.lineStyle(1, 0x333333, 1)
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      g.strokeRect(GRID_ORIGIN_X + x * TILE_W, GRID_ORIGIN_Y + y * TILE_H, TILE_W, TILE_H)
    }
  }
  this.baseGridGraphics = g

  function redrawGrid() {
    const canvasW = scene.sys.canvas.width
    const canvasH = scene.sys.canvas.height
    GRID_ORIGIN_X = Math.floor((canvasW - TILE_W * GRID_COLS) / 2)
    GRID_ORIGIN_Y = Math.floor((canvasH - TILE_H * GRID_ROWS) / 2)

    scene.baseGridGraphics.clear()
    scene.baseGridGraphics.lineStyle(1, 0x333333, 1)
    for (let yy = 0; yy < GRID_ROWS; yy++) {
      for (let xx = 0; xx < GRID_COLS; xx++) {
        scene.baseGridGraphics.strokeRect(GRID_ORIGIN_X + xx * TILE_W, GRID_ORIGIN_Y + yy * TILE_H, TILE_W, TILE_H)
      }
    }

    if (scene.mapImg) {
      const targetW = TILE_W * GRID_COLS
      const targetH = TILE_H * GRID_ROWS
      const tex = scene.textures.get("map")
      const srcImg = tex && tex.getSourceImage()
      const srcW = srcImg ? srcImg.width : targetW
      const srcH = srcImg ? srcImg.height : targetH
      const scale = Math.min(targetW / srcW, targetH / srcH)
      const displayW = Math.round(srcW * scale)
      const displayH = Math.round(srcH * scale)
      scene.mapImg.setDisplaySize(displayW, displayH)
      const extraX = Math.floor((targetW - displayW) / 2)
      const extraY = Math.floor((targetH - displayH) / 2)
      scene.mapImg.x = GRID_ORIGIN_X + extraX
      scene.mapImg.y = GRID_ORIGIN_Y + extraY
    }

    areasById.forEach((entry) => {
      const meta = entry.meta
      entry.container.x = GRID_ORIGIN_X + meta.x * TILE_W
      entry.container.y = GRID_ORIGIN_Y + meta.y * TILE_H
    })

    if (scene._inGameToolbar && scene._inGameToolbar.container) {
      scene._inGameToolbar.container.x = scene.sys.canvas.width / 2
      scene._inGameToolbar.container.y = scene.sys.canvas.height - 40
    }

    if (playerSprite) {
      playerSprite.setDepth(playerSprite.y)
    }
  }

  redrawGrid()

  this.scale.on("resize", () => {
    try {
      redrawGrid()
    } catch (e) {
      console.warn("resize redrawGrid failed", e)
    }
  })
  
  const vars = ["hp", "hunger", "oxygen", "energy", "sanity", "fatigue"]
  const playerStats = {}
  window.playerStats = playerStats
  const statGroup = this.add.container(20, 20)
  statGroup.setAlpha(0)
  statGroup.setVisible(false)

  vars.forEach((name, i) => {
    const y = i * 28
    playerStats[name] = 100

    const icon = scene.add.image(0, y, `${name}_high`).setOrigin(0, 0)
    icon.setDisplaySize(24, 24)

    const txt = scene.add.text(30, y + 4, "100%", {
      fontSize: "14px",
      color: "#fff",
    })
    statGroup.add([icon, txt])
    playerStats[name + "_el"] = { icon, txt }
  })
  statGroup.setScrollFactor(0)

  this.showStats = function (opts = {}) {
    try {
      statGroup.setVisible(true)
      this.tweens.add({
        targets: statGroup,
        alpha: 1,
        duration: opts.duration || 700,
        ease: opts.ease || "Power2",
      })
    } catch (e) {
      console.warn("showStats failed", e)
      statGroup.setVisible(true)
      statGroup.setAlpha(1)
    }
  }

  function updateHUD() {
    window.updateHUD = updateHUD
    vars.forEach((name) => {
      const val = playerStats[name]
      let state = "high"
      if (val <= 40) state = "low"
      else if (val <= 60) state = "mid"

      const key = `${name}_${state}`
      if (scene.textures.exists(key)) playerStats[name + "_el"].icon.setTexture(key)
      playerStats[name + "_el"].txt.setText(`${val}%`)
    })
  }

  try {
    updateHUD()
  } catch (e) {
    console.warn("updateHUD init failed", e)
  }

  this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys({
    W: Phaser.Input.Keyboard.KeyCodes.W,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
  });
  
  console.log("[Input] Keyboard controls initialized");
  
  if (typeof createToolbar !== "function") {
    appendLog("FATAL: createToolbar not defined. Aborting scene init.")
    return
  }
  createToolbar()
  enableToolbar(false)

  const domToolbar = document.getElementById("toolbar_bar")
  if (domToolbar) domToolbar.style.display = "none"

  function createInGameToolbar(scene) {
    const tw = scene.add.container(scene.sys.canvas.width / 2, scene.sys.canvas.height - 40)
    tw.setDepth(1000)
    tw.setSize(480, 64)

    const bg = scene.add.rectangle(0, 0, 520, 64, 0x111111, 0.85).setOrigin(0.5)
    bg.setStrokeStyle(2, 0x333333)
    tw.add(bg)

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
    ]

    const spacing = 64
    const icons = []
    let currentPage = 0
    const AREAS_PER_PAGE = 5
    const totalPages = Math.ceil(areaDefs.length / AREAS_PER_PAGE)

    function renderPage(page) {
      icons.forEach((icon) => icon.destroy())
      icons.length = 0
      tw.list = tw.list.filter((child) => !child._isNavBtn)

      let x = -((AREAS_PER_PAGE - 1) * spacing) / 2
      const startIdx = page * AREAS_PER_PAGE
      const endIdx = Math.min(startIdx + AREAS_PER_PAGE, areaDefs.length)
      for (let i = startIdx; i < endIdx; i++) {
        const a = areaDefs[i]
        const key = `area_icon_${a.type}`
        const img = scene.add.image(x, 0, key).setDisplaySize(40, 40).setInteractive({ cursor: "pointer" })
        img.type = a.type
        img.w = a.w
        img.h = a.h
        img.setData("draggable", true)

        function showLabel() {
          if (img._hoverLabel) return
          const label = scene.add
            .text(img.x, img.y - 28, a.type, {
              fontSize: "14px",
              color: "#fff",
              backgroundColor: "#222a",
              padding: { x: 6, y: 2 },
            })
            .setOrigin(0.5, 1)
            .setDepth(9999)
          tw.add(label)
          img._hoverLabel = label
        }
        function hideLabel() {
          if (img._hoverLabel) {
            img._hoverLabel.destroy()
            img._hoverLabel = null
          }
        }
        img.on("pointerover", showLabel)
        img.on("pointerout", hideLabel)

        img.on("pointerdown", (pointer) => {
          currentDraggedArea = {
            type: a.type,
            w: a.w,
            h: a.h,
            color: colorForType(a.type),
          }
          window.currentDraggedArea = currentDraggedArea
          appendLog("in-game drag start: " + a.type)
          
          try {
            const key = `area_icon_${a.type}`
            let canvasPos
            if (pointer && pointer.event && typeof pointer.event.clientX === "number") {
              canvasPos = clientToCanvas(scene, pointer.event.clientX, pointer.event.clientY)
            } else {
              canvasPos = { x: pointer.x || 0, y: pointer.y || 0 }
            }
            const follow = scene.add
              .image(canvasPos.x, canvasPos.y, key)
              .setOrigin(0.5)
              .setDisplaySize(36, 36)
              .setDepth(6000)
              .setAlpha(0.95)
            follow.setScrollFactor(0)
            scene._dragFollowSprite = follow
          } catch (e) {}
        })

        tw.add(img)
        icons.push(img)
        x += spacing
      }

      if (page > 0) {
        const prevBtn = scene.add
          .image(-300, 0, "previous")
          .setDisplaySize(32, 32)
          .setInteractive({ cursor: "pointer" })
        prevBtn._isNavBtn = true
        prevBtn.on("pointerdown", () => {
          renderPage(page - 1)
          currentPage = page - 1
        })
        tw.add(prevBtn)
      }
      if (page < totalPages - 1) {
        const nextBtn = scene.add.image(300, 0, "next").setDisplaySize(32, 32).setInteractive({ cursor: "pointer" })
        nextBtn._isNavBtn = true
        nextBtn.on("pointerdown", () => {
          renderPage(page + 1)
          currentPage = page + 1
        })
        tw.add(nextBtn)
      }
    }

    if (!scene.textures.exists("next")) scene.load.image("next", "/assets/next.png")
    if (!scene.textures.exists("previous")) scene.load.image("previous", "/assets/previous.png")
    scene.load.once("complete", () => {
      renderPage(currentPage)
    })
    scene.load.start()
    return { container: tw, icons }
  }

  const inGameToolbar = createInGameToolbar(this)
  this._inGameToolbar = inGameToolbar

  const meta = this.cache.json.get("meta")
  if (!meta) appendLog("Warning: metadata not found at " + META_PATH)

  const toLoad = new Map()
  if (meta && meta.frames && meta.frames.rotations)
    for (const [k, p] of Object.entries(meta.frames.rotations)) toLoad.set(keyFor(p), BASE_PATH + p)
  if (meta && meta.frames && meta.frames.animations) {
    for (const animName of Object.keys(meta.frames.animations || {})) {
      const animDirs = meta.frames.animations[animName]
      for (const dir of Object.keys(animDirs || {}))
        for (const rel of animDirs[dir]) toLoad.set(keyFor(rel), BASE_PATH + rel)
    }
  }
  for (const [k, p] of toLoad.entries())
    if (!this.textures.exists(k)) {
      this.load.image(k, p)
      loadedTextureKeys.push(k)
    }

  ghostRect = this.add.graphics()
  ghostRect.setDepth(5000)

  const mapGrid = this.cache.json.get("map_grid")
  if (mapGrid && Array.isArray(mapGrid.cells)) {
    allowedGrid = mapGrid.cells
    appendLog(
      "allowedGrid loaded: " +
        (mapGrid.width || allowedGrid[0].length || 0) +
        "x" +
        (mapGrid.height || allowedGrid.length || 0),
    )
  } else {
    allowedGrid = null
    appendLog("No map_grid.json found - everything allowed by default.")
  }

  let mapImg = null
  if (this.textures.exists("map")) {
    const tex = this.textures.get("map")
    const srcImg = tex.getSourceImage()
    const srcW = srcImg ? srcImg.width : TILE_W * GRID_COLS
    const srcH = srcImg ? srcImg.height : TILE_H * GRID_ROWS
    const targetW = TILE_W * GRID_COLS
    const targetH = TILE_H * GRID_ROWS
    const scale = Math.min(targetW / srcW, targetH / srcH)
    const displayW = Math.round(srcW * scale)
    const displayH = Math.round(srcH * scale)

    mapImg = this.add.image(GRID_ORIGIN_X, GRID_ORIGIN_Y, "map").setOrigin(0, 0).setDepth(-1)
    mapImg.setDisplaySize(displayW, displayH)
    const extraX = Math.floor((targetW - displayW) / 2)
    const extraY = Math.floor((targetH - displayH) / 2)
    mapImg.x = GRID_ORIGIN_X + extraX
    mapImg.y = GRID_ORIGIN_Y + extraY
    mapImg.setAlpha(0.95)
  }

  this.load.once("complete", () => {
    appendLog("Image load complete. Role images: " + loadedTextureKeys.length)
    const firstKey = loadedTextureKeys[0]
    if (firstKey) {
      playerSprite = this.add
        .sprite(
          GRID_ORIGIN_X + Math.floor((GRID_COLS * TILE_W) / 2),
          GRID_ORIGIN_Y + Math.floor((GRID_ROWS * TILE_H) / 2),
          firstKey,
        )
        .setOrigin(0.5, 1)
      playerSprite.setScale(SPRITE_SCALE)
      playerSprite.setDepth(playerSprite.y)
      
      // CRITICAL: Keep hidden until simulation starts
      playerSprite.setVisible(false)
      playerSprite.active = false
      
      playerSprite.setData("origX", playerSprite.x)
      playerSprite.setData("origY", playerSprite.y)

      window.playerSprite = playerSprite
    }
    
    // Initialize BudgetSystem
    if (!scene.budget) {
      if (typeof window.BudgetSystem !== 'undefined') {
        try {
          scene.budget = new window.BudgetSystem(scene);
          window.budgetSystem = scene.budget;
          appendLog("[Budget] Sistema de presupuesto inicializado correctamente (post-load).");
        } catch (error) {
          console.error('Error initializing BudgetSystem:', error);
        }
      }
    }
    
    if (meta && meta.frames && meta.frames.animations && meta.frames.animations.walk) {
      for (const [dir, arr] of Object.entries(meta.frames.animations.walk)) {
        const frames = arr.map((p) => ({ key: keyFor(p) }))
        const animKey = "walk_" + dir.replace(/-/g, "_")
        if (!this.anims.exists(animKey))
          this.anims.create({
            key: animKey,
            frames,
            frameRate: Math.max(6, Math.min(12, frames.length * 3)),
            repeat: -1,
          })
      }
      if (this.anims.exists("walk_south") && playerSprite) playerSprite.play("walk_south")
    }
  })
  this.load.start()

  this.input.on("pointermove", (pointer) => {
    if (isIsometricMode || !currentDraggedArea) return
    const rect = scene.sys.canvas.getBoundingClientRect()
    let canvasX, canvasY
    if (pointer && pointer.event && typeof pointer.event.clientX === "number") {
      const p = clientToCanvas(scene, pointer.event.clientX, pointer.event.clientY)
      canvasX = p.x
      canvasY = p.y
    } else {
      canvasX = pointer.x
      canvasY = pointer.y
    }
    const worldPoint = this.cameras.main.getWorldPoint(canvasX, canvasY)
    const localX = worldPoint.x - GRID_ORIGIN_X
    const localY = worldPoint.y - GRID_ORIGIN_Y
    const tx = Math.floor(localX / TILE_W)
    const ty = Math.floor(localY / TILE_H)

    updateGhost(tx, ty)

    try {
      if (scene._dragFollowSprite) {
        scene._dragFollowSprite.x = canvasX
        scene._dragFollowSprite.y = canvasY
      }
    } catch (e) {}
  })

  window._phaserPreviewPointerMove = (clientX, clientY) => {
    try {
      const canvasPos = clientToCanvas(scene, clientX, clientY)
      const worldPoint = scene.cameras.main.getWorldPoint(canvasPos.x, canvasPos.y)
      const localX = worldPoint.x - GRID_ORIGIN_X
      const localY = worldPoint.y - GRID_ORIGIN_Y
      const tx = Math.floor(localX / TILE_W)
      const ty = Math.floor(localY / TILE_H)
      updateGhost(tx, ty)

      if (scene._dragFollowSprite) {
        scene._dragFollowSprite.x = canvasPos.x
        scene._dragFollowSprite.y = canvasPos.y
      }
    } catch (e) {}
  }

  this.input.on("pointerup", phaserPointerUp)

  window._phaserPointerUp = (clientX, clientY) => {
    try {
      const canvasPos = clientToCanvas(scene, clientX, clientY)
      const pointer = { x: canvasPos.x, y: canvasPos.y, event: { clientX, clientY } }
      phaserPointerUp(pointer)
    } catch (e) {}
  }

  function phaserPointerUp(pointer) {
    if (isIsometricMode || !currentDraggedArea) return
    const rel = getCanvasRelativePointer(pointer, scene)
    const worldPoint = scene.cameras.main.getWorldPoint(rel.x, rel.y)

    const localX = worldPoint.x - GRID_ORIGIN_X
    const localY = worldPoint.y - GRID_ORIGIN_Y
    const tx = Math.floor(localX / TILE_W),
      ty = Math.floor(localY / TILE_H)

    dbgPlacementState(tx, ty, currentDraggedArea.w, currentDraggedArea.h)
    const okLocal = window.DEV_BYPASS_CLIENT_PLACE
      ? true
      : clientCanPlace(
          localBoard,
          tx,
          ty,
          currentDraggedArea.w,
          currentDraggedArea.h
        )

    let okMap = true
    if (allowedGrid) {
      for (let yy = 0; yy < currentDraggedArea.h; yy++) {
        for (let xx = 0; xx < currentDraggedArea.w; xx++) {
          const cx = tx + xx,
            cy = ty + yy
          if (!isCellAllowed(cx, cy)) {
            okMap = false
            break
          }
        }
        if (!okMap) break
      }
    }

    if (!okLocal || !okMap) {
      appendLog(`placement invalid at (${tx},${ty})`)
    } else {
      if (!scene.budget) {
        console.warn("[Budget] Sistema de presupuesto no inicializado aún.");
        currentDraggedArea = null
        window.currentDraggedArea = null
        ghostRect.clear()
        return
      }
      const canAfford = scene.budget.canAfford(
        currentDraggedArea.type,
        currentDraggedArea.w,
        currentDraggedArea.h,
        currentDraggedArea.missions || 0
      )

      if (canAfford) {
        const purchased = scene.budget.purchase(
          currentDraggedArea.type,
          currentDraggedArea.w,
          currentDraggedArea.h,
          currentDraggedArea.missions || 0
        )

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
          }
          createAreaVisual(scene, areaMeta, true)
          pushUndo({ type: "place", area: clone(areaMeta) })
        }
      }
    }

    currentDraggedArea = null
    window.currentDraggedArea = null
    ghostRect.clear()
    
    try {
      if (scene._dragFollowSprite) {
        scene._dragFollowSprite.destroy()
        scene._dragFollowSprite = null
      }
    } catch (e) {}
  }

  window.sendChatMessage = (message) => {
    if (!window.socket || !SESSION_ID) return

    window.socket.emit("chat_message", {
      sessionId: SESSION_ID,
      message: message,
    })
  }

  window.getSessionInfo = () => ({
    sessionId: SESSION_ID,
    playerId: PLAYER_ID,
    isHost: isHost,
    role: currentPlayerRole,
    playerCount: otherPlayers.size + 1,
  })
}

// ---------- Helper functions for managing other players ----
function createOtherPlayerSprite(player) {
  if (otherPlayers.has(player.id)) return

  const scene = game.scene.scenes[0]
  if (!scene) return

  const key = player.textureKey || "crew_medic_walk_south_0"
  const sprite = scene.add
    .sprite(GRID_ORIGIN_X + (player.x || 0) * TILE_W, GRID_ORIGIN_Y + (player.y || 0) * TILE_H, key)
    .setOrigin(0.5, 1)
    .setScale(SPRITE_SCALE)

  sprite.setDepth(sprite.y)

  const nameTag = scene.add
    .text(sprite.x, sprite.y - sprite.displayHeight - 5, player.name, {
      fontSize: "12px",
      color: "#fff",
      backgroundColor: "#222a",
      padding: { x: 4, y: 1 },
    })
    .setOrigin(0.5, 1)
    .setDepth(sprite.depth + 1)
  nameTag.setScrollFactor(0)

  otherPlayers.set(player.id, { sprite, nameTag, data: player })
  appendLog(`Created sprite for player ${player.name} (${player.id})`)
}

function updateOtherPlayerSprite(player) {
  if (!otherPlayers.has(player.id)) {
    createOtherPlayerSprite(player)
    return
  }

  const entry = otherPlayers.get(player.id)
  const scene = game.scene.scenes[0]
  if (!scene) return

  entry.sprite.x = GRID_ORIGIN_X + (player.x || 0) * TILE_W
  entry.sprite.y = GRID_ORIGIN_Y + (player.y || 0) * TILE_H
  entry.sprite.setDepth(entry.sprite.y)

  entry.nameTag.x = entry.sprite.x
  entry.nameTag.y = entry.sprite.y - entry.sprite.displayHeight - 5
  entry.nameTag.setDepth(entry.sprite.depth + 1)

  if (player.textureKey && entry.sprite.texture.key !== player.textureKey) {
    entry.sprite.setTexture(player.textureKey)
  }

  if (player.animation && entry.sprite.anims.currentAnim?.key !== player.animation) {
    entry.sprite.play(player.animation)
  }

  entry.data = player
}

function removeOtherPlayerSprite(playerId) {
  if (!otherPlayers.has(playerId)) return

  const entry = otherPlayers.get(playerId)
  if (entry.sprite) entry.sprite.destroy()
  if (entry.nameTag) entry.nameTag.destroy()
  otherPlayers.delete(playerId)
  appendLog(`Removed sprite for player ID ${playerId}`)
}

function updateOtherPlayerPosition(playerId, x, y) {
  if (!otherPlayers.has(playerId)) return

  const entry = otherPlayers.get(playerId)
  entry.sprite.x = GRID_ORIGIN_X + x * TILE_W
  entry.sprite.y = GRID_ORIGIN_Y + y * TILE_H
  entry.sprite.setDepth(entry.sprite.y)

  entry.nameTag.x = entry.sprite.x
  entry.nameTag.y = entry.sprite.y - entry.sprite.displayHeight - 5
  entry.nameTag.setDepth(entry.sprite.depth + 1)

  entry.data.x = x
  entry.data.y = y
}

function updateScene() {
  if (!game) return
  
  const scene = game.scene.scenes[0]
  if (!scene) return

  // Only handle player movement if simulation has started
  if (simulationStarted && playerSprite && playerSprite.active) {
    playerSprite.setDepth(playerSprite.y + 1000)
    
    if (scene.cursors && scene.keys) {
      const speed = scene.keys.SHIFT.isDown ? 8 : 5
      let dx = 0
      let dy = 0
      let moved = false

      if (scene.cursors.up.isDown || scene.keys.W.isDown) {
        dy = -speed
        moved = true
      }
      if (scene.cursors.down.isDown || scene.keys.S.isDown) {
        dy = speed
        moved = true
      }
      if (scene.cursors.left.isDown || scene.keys.A.isDown) {
        dx = -speed
        moved = true
      }
      if (scene.cursors.right.isDown || scene.keys.D.isDown) {
        dx = speed
        moved = true
      }

      if (moved) {
        if (dx !== 0 && dy !== 0) {
          const magnitude = Math.sqrt(dx * dx + dy * dy)
          dx = (dx / magnitude) * speed
          dy = (dy / magnitude) * speed
        }

        const newX = playerSprite.x + dx
        const newY = playerSprite.y + dy

        const bounds = {
          minX: GRID_ORIGIN_X,
          maxX: GRID_ORIGIN_X + (GRID_COLS * TILE_W),
          minY: GRID_ORIGIN_Y,
          maxY: GRID_ORIGIN_Y + (GRID_ROWS * TILE_H)
        }

        if (newX >= bounds.minX && newX <= bounds.maxX && 
            newY >= bounds.minY && newY <= bounds.maxY) {
          playerSprite.x = newX
          playerSprite.y = newY

          if (window.socket && window.socket.emit && window.SESSION_ID && window.PLAYER_ID) {
            window.socket.emit("player_moved", {
              sessionId: window.SESSION_ID,
              playerId: window.PLAYER_ID,
              x: Math.round((newX - GRID_ORIGIN_X) / TILE_W * 100) / 100,
              y: Math.round((newY - GRID_ORIGIN_Y) / TILE_H * 100) / 100
            })
          }

          if (scene.anims.exists("walk_south") && !playerSprite.anims.isPlaying) {
            playerSprite.play("walk_south")
          }
        }
      } else {
        if (playerSprite.anims.isPlaying) {
          playerSprite.stop()
        }
      }
    }
  }

  // Camera follow logic
  if (simulationStarted && scene.cameras.main && playerSprite && playerSprite.active) {
    const camera = scene.cameras.main
    
    const targetX = playerSprite.x - camera.width / 2
    const targetY = playerSprite.y - camera.height / 2

    const finalTargetX = targetX + cameraOffsetX
    const finalTargetY = targetY + cameraOffsetY

    const currentScrollX = camera.scrollX
    const currentScrollY = camera.scrollY
    
    camera.scrollX = currentScrollX + (finalTargetX - currentScrollX) * CAMERA_LERP_SPEED
    camera.scrollY = currentScrollY + (finalTargetY - currentScrollY) * CAMERA_LERP_SPEED
  }

  // Update other players' sprite depths
  otherPlayers.forEach((entry) => {
    if (entry.sprite && entry.sprite.active) {
      entry.sprite.setDepth(entry.sprite.y + 1000)
    }
  })
}

// ----------- ISOMETRIC MODE TRANSITION -----------
function startIsometricTransition() {
  if (isIsometricMode || simulationStarted) {
    console.log("[Transition] Already in simulation mode, skipping...");
    return;
  }

  console.log("[Transition] Starting isometric transition...");
  appendLog("Starting mission simulation...");
  
  simulationStarted = true
  isEditMode = false
  window.isEditMode = false
  window.isIsometricMode = true
  
  const scene = game?.scene?.scenes[0];
  if (!scene) {
    console.error("[Transition] No scene available!");
    return;
  }

  const domToolbar = document.getElementById("toolbar_bar");
  if (domToolbar) domToolbar.style.display = "none";
  
  if (scene._inGameToolbar && scene._inGameToolbar.container) {
    scene._inGameToolbar.container.setVisible(false);
  }

  if (scene.showStats) {
    scene.showStats({ duration: 1000 });
  }

  if (playerSprite) {
    playerSprite.setVisible(true);
    playerSprite.active = true;
    playerSprite.setDepth(playerSprite.y + 1000);
    console.log("[Transition] Player sprite activated at", playerSprite.x, playerSprite.y);
  } else {
    console.warn("[Transition] No player sprite found!");
  }

  if (ghostRect) {
    ghostRect.destroy();
    ghostRect = null;
  }

  areasById.forEach((entry) => {
    if (entry.container && entry.container.input) {
      entry.container.disableInteractive();
      entry.container.setAlpha(0.95);
    }
  });

  try {
    if (window.missionSystem && typeof window.missionSystem.initialize === 'function') {
      const placedAreas = Array.from(areasById.values()).map(e => e.meta.type);
      const uniqueAreas = [...new Set(placedAreas)];
      
      const playerRoles = [window.PLAYER_ROLE || 'crew_medic'];
      const playerCount = otherPlayers.size + 1;
      
      console.log("[Transition] Initializing mission system:", {
        playerCount,
        playerRoles,
        placedAreas: uniqueAreas
      });
      
      window.missionSystem.initialize(playerCount, playerRoles, uniqueAreas);
      appendLog("✅ Mission system initialized");
    } else {
      console.warn("[Transition] Mission system not available");
    }
  } catch (error) {
    console.error("[Transition] Error initializing mission system:", error);
  }

  try {
    if (window.eventSystem && typeof window.eventSystem.start === 'function') {
      window.eventSystem.start();
      appendLog("✅ Event system started");
      console.log("[Transition] Event system started");
    }
  } catch (error) {
    console.error("[Transition] Error starting event system:", error);
  }

  try {
    if (scene.budget && typeof scene.budget.fadeOut === 'function') {
      scene.budget.fadeOut();
    } else if (window.budgetSystem && typeof window.budgetSystem.fadeOut === 'function') {
      window.budgetSystem.fadeOut();
    }
  } catch (error) {
    console.warn("[Transition] Error hiding budget system:", error);
  }

  if (scene.input && scene.input.keyboard) {
    scene.input.keyboard.enabled = true;
  }

  console.log("[Transition] ✅ Transition complete!");
  appendLog("🚀 Mission simulation started!");
}

// ------------ PHASER GAME SETUP ------------
function initGame() {
  const config = {
    type: window.Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    scene: {
      preload: preloadScene,
      create: createScene,
      update: updateScene,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: window.Phaser.Scale.RESIZE,
      autoCenter: window.Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      postBoot: (game) => {
        window.addEventListener("resize", () => {
          game.scale.resize(window.innerWidth, window.innerHeight)
        })
      },
    },
  }

  try {
    game = new window.Phaser.Game(config)
    window.game = game
    appendLog("✔️ Phaser game initialized")
  } catch (e) {
    console.error("Failed to initialize Phaser game:", e)
    appendLog("ERROR: Phaser game initialization failed: " + e.message)
  }
}

// ------------- MAIN EXECUTION -------------
window.addEventListener("load", () => {
  appendLog("Window loaded. Initializing game...")
  initGame()
  window._mainLoaded = true
})

window.undoLast = () => {
  if (undoStack.length === 0) {
    appendLog("Undo stack is empty.")
    return
  }
  const op = undoStack.pop()
  if (!op) return
  redoStack.push(op)
  appendLog(`Undoing: ${op.type}`)
  switch (op.type) {
    case "add":
      if (areasById.has(op.area.id)) {
        areasById.get(op.area.id).container.destroy()
        areasById.delete(op.area.id)
        clearAreaTiles(op.area)
      }
      break
    case "move":
      if (areasById.has(op.areaId)) {
        const entry = areasById.get(op.areaId)
        clearAreaTiles(entry.meta)
        entry.meta.x = op.from.x
        entry.meta.y = op.from.y
        fillAreaTiles(entry.meta, op.areaId)
        entry.container.x = GRID_ORIGIN_X + op.from.x * TILE_W
        entry.container.y = GRID_ORIGIN_Y + op.from.y * TILE_H
        appendLog(`Area ${op.areaId} moved back to (${op.from.x}, ${op.from.y})`)
      }
      break
    case "rotate":
      if (areasById.has(op.areaId)) {
        const entry = areasById.get(op.areaId)
        clearAreaTiles(entry.meta)
        const prevMeta = clone(entry.meta)
        entry.meta.w = op.from.w
        entry.meta.h = op.from.h
        fillAreaTiles(entry.meta, op.areaId)
        entry.container.removeAll(true)
        const scene = game.scene.scenes[0]
        const g = scene.add.graphics()
        g.fillStyle(colorForType(entry.meta.type), 0.35)
        g.fillRect(0, 0, entry.meta.w * TILE_W, entry.meta.h * TILE_H)
        g.lineStyle(2, colorForType(entry.meta.type), 1)
        g.strokeRect(0, 0, entry.meta.w * TILE_W, entry.meta.h * TILE_H)
        const label = scene.add.text(4, 4, entry.meta.type, {
          fontSize: "12px",
          color: "#111",
        })
        entry.container.add([g, label])
        entry.container.setSize(entry.meta.w * TILE_W, entry.meta.h * TILE_H)
        appendLog(`Area ${op.areaId} rotated back.`)
      }
      break
    case "delete":
      appendLog(`Re-adding area ${op.area.id}`)
      if (game && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0]
        createAreaVisual(scene, op.area, false)
      }
      break
  }
  if (op.area) {
    fillAreaTiles(op.area, op.area.id)
  } else if (op.areaId && areasById.has(op.areaId)) {
    fillAreaTiles(areasById.get(op.areaId).meta, op.areaId)
  }
}

window.redoLast = () => {
  if (redoStack.length === 0) {
    appendLog("Redo stack is empty.")
    return
  }
  const op = redoStack.pop()
  if (!op) return
  undoStack.push(op)
  appendLog(`Redoing: ${op.type}`)
  switch (op.type) {
    case "add":
      if (game && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0]
        createAreaVisual(scene, op.area, true)
      }
      break
    case "move":
      if (areasById.has(op.areaId)) {
        const entry = areasById.get(op.areaId)
        clearAreaTiles(entry.meta)
        entry.meta.x = op.to.x
        entry.meta.y = op.to.y
        fillAreaTiles(entry.meta, op.areaId)
        entry.container.x = GRID_ORIGIN_X + op.to.x * TILE_W
        entry.container.y = GRID_ORIGIN_Y + op.to.y * TILE_H
        appendLog(`Area ${op.areaId} moved again to (${op.to.x}, ${op.to.y})`)
        window.socket.emit && window.socket.emit("update_area", { sessionId: SESSION_ID, area: entry.meta })
      }
      break
    case "rotate":
      if (areasById.has(op.areaId)) {
        rotateSelected(areasById.get(op.areaId))
      }
      break
    case "delete":
      if (areasById.has(op.area.id)) {
        const entry = areasById.get(op.area.id)
        entry.container.destroy()
        areasById.delete(op.area.id)
        clearAreaTiles(op.area)
        window.socket.emit && window.socket.emit("remove_area", { sessionId: SESSION_ID, areaId: op.area.id })
      }
      break
  }
}

window.onMultiplayerReady = (data) => {
  console.log("[v0] Multiplayer ready callback received", data)
  SESSION_ID = window.SESSION_ID
  PLAYER_ID = window.PLAYER_ID
  isHost = window.IS_HOST
  sessionReady = true

  appendLog(`Multiplayer ready: ${data.playerName} (${data.player?.role})`)
  appendLog(`Session: ${SESSION_ID}, Player: ${PLAYER_ID}, Host: ${isHost}`)

  enableToolbar(isHost)
}

window.onMissionStarted = (data) => {
  console.log("[v0] Mission started callback received", data);
  console.log("[v0] Current state:", {
    simulationStarted,
    isEditMode,
    playerSprite: !!playerSprite,
    game: !!game
  });
  
  if (!simulationStarted) {
    console.log("[v0] Starting transition to simulation mode...");
    startIsometricTransition();
  } else {
    console.log("[v0] Already in simulation mode, skipping transition");
  }
}