// Re-export all game modules
export { GameController } from "./game.controller"
export { GameService } from "./game.service"
export { createGameGateway } from "./game.gateway"
export * from "./game.types"

// Example usage in your main server file:
// import { createGameGateway } from './game'
// const httpServer = http.createServer(app)
// const io = createGameGateway(httpServer)
// httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))