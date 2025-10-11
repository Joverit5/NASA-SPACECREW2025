import express from "express"
import http from "http"
import path from "path"
import { createGameGateway } from "./game"

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(express.json())
app.use(express.static("public"))

// Serve static files for assets
app.use("/assets", express.static(path.join(__dirname, "../public/assets")))

// Serve game files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/combined.html"))
})

app.get("/main.js", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/main.js"))
})

app.get("/multiplayer.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../src/multiplayer.html"))
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() })
})

// Create HTTP server
const httpServer = http.createServer(app)

// Initialize Socket.io with game logic
const io = createGameGateway(httpServer)

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🎮 Game ready for multiplayer connections`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🔴 Shutting down gracefully...")
  httpServer.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})