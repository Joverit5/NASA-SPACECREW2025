const express = require("express")
const http = require("http")
const socketIO = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const PORT = 8080

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// In-memory session storage
const sessions = new Map()

// REST API endpoints
app.post("/api/session", (req, res) => {
  const { name, maxPlayers } = req.body
  const sessionId = "s" + Date.now()

  sessions.set(sessionId, {
    id: sessionId,
    name: name || "Unnamed Session",
    maxPlayers: maxPlayers || 5,
    players: [],
    areas: [],
    map: {
      width: 20,
      height: 20,
      tiles: Array.from({ length: 20 }, () => Array(20).fill(0)),
    },
    resources: {
      oxygen: 100,
      power: 100,
      water: 100,
    },
  })

  console.log(`[API] Created session: ${sessionId}`)
  res.json({ sessionId })
})

app.post("/api/session/:id/join", (req, res) => {
  const { id } = req.params
  const { displayName } = req.body

  const session = sessions.get(id)
  if (!session) {
    return res.status(404).json({ error: "Session not found" })
  }

  const playerId = "p" + Date.now()
  session.players.push({
    id: playerId,
    name: displayName || "Player",
    role: "crew_medic",
  })

  console.log(`[API] Player ${playerId} joined session ${id}`)
  res.json({ playerId, sessionId: id })
})

app.get("/api/session/:id", (req, res) => {
  const { id } = req.params
  const session = sessions.get(id)

  if (!session) {
    return res.status(404).json({ error: "Session not found" })
  }

  res.json(session)
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`)

  socket.on("join_session", (data) => {
    const { sessionId, player } = data
    console.log(`[Socket] join_session: ${sessionId} by ${player?.id}`)

    const session = sessions.get(sessionId)
    if (session) {
      socket.join(sessionId)
      socket.emit("session_state", session)
      socket.to(sessionId).emit("player_joined", player)
    } else {
      socket.emit("place_error", { reason: "session_not_found", sessionId })
    }
  })

  socket.on("get_session", (data) => {
    const { sessionId } = data
    console.log(`[Socket] get_session: ${sessionId}`)

    const session = sessions.get(sessionId)
    if (session) {
      socket.emit("session_state", session)
    } else {
      socket.emit("place_error", { reason: "session_not_found", sessionId })
    }
  })

  socket.on("place_area", (data) => {
    const { sessionId, area } = data
    console.log(`[Socket] place_area in ${sessionId}:`, area)

    const session = sessions.get(sessionId)
    if (!session) {
      socket.emit("place_error", { reason: "session_not_found", sessionId })
      return
    }

    // Add area to session
    session.areas.push(area)

    // Update map tiles
    for (let y = 0; y < area.h; y++) {
      for (let x = 0; x < area.w; x++) {
        const tileX = area.x + x
        const tileY = area.y + y
        if (tileY >= 0 && tileY < 20 && tileX >= 0 && tileX < 20) {
          session.map.tiles[tileY][tileX] = area.id
        }
      }
    }

    // Broadcast to all clients in the session
    io.to(sessionId).emit("session_state", session)
  })

  socket.on("update_area", (data) => {
    const { sessionId, area } = data
    console.log(`[Socket] update_area in ${sessionId}:`, area)

    const session = sessions.get(sessionId)
    if (!session) {
      socket.emit("place_error", { reason: "session_not_found", sessionId })
      return
    }

    // Find and update the area
    const index = session.areas.findIndex((a) => a.id === area.id)
    if (index !== -1) {
      // Clear old tiles
      const oldArea = session.areas[index]
      for (let y = 0; y < oldArea.h; y++) {
        for (let x = 0; x < oldArea.w; x++) {
          const tileX = oldArea.x + x
          const tileY = oldArea.y + y
          if (tileY >= 0 && tileY < 20 && tileX >= 0 && tileX < 20) {
            session.map.tiles[tileY][tileX] = 0
          }
        }
      }

      // Update area
      session.areas[index] = area

      // Set new tiles
      for (let y = 0; y < area.h; y++) {
        for (let x = 0; x < area.w; x++) {
          const tileX = area.x + x
          const tileY = area.y + y
          if (tileY >= 0 && tileY < 20 && tileX >= 0 && tileX < 20) {
            session.map.tiles[tileY][tileX] = area.id
          }
        }
      }
    }

    // Broadcast to all clients
    io.to(sessionId).emit("session_state", session)
  })

  socket.on("remove_area", (data) => {
    const { sessionId, areaId } = data
    console.log(`[Socket] remove_area in ${sessionId}: ${areaId}`)

    const session = sessions.get(sessionId)
    if (!session) {
      socket.emit("place_error", { reason: "session_not_found", sessionId })
      return
    }

    // Find and remove the area
    const index = session.areas.findIndex((a) => a.id === areaId)
    if (index !== -1) {
      const area = session.areas[index]

      // Clear tiles
      for (let y = 0; y < area.h; y++) {
        for (let x = 0; x < area.w; x++) {
          const tileX = area.x + x
          const tileY = area.y + y
          if (tileY >= 0 && tileY < 20 && tileX >= 0 && tileX < 20) {
            session.map.tiles[tileY][tileX] = 0
          }
        }
      }

      session.areas.splice(index, 1)
    }

    // Broadcast to all clients
    io.to(sessionId).emit("session_state", session)
  })

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`)
  })
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
  console.log(`Socket.IO enabled`)
})
