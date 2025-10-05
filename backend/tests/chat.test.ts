import { createServer } from "http"
import { Server } from "socket.io"
import Client, { type Socket as ClientSocket } from "socket.io-client"
import { ChatGateway } from "../src/chat/chat.gateway"
import { ChatService } from "../src/chat/chat.service"
import type { ChatMessage } from "../src/chat/chat.types"

interface JoinSuccessData {
  playerId: string
  playerName: string
  sessionId: string
}

interface JoinRejectedData {
  message: string
  reason: string
}

interface PlayerJoinedData {
  playerId: string
  name: string
}

interface PlayerLeftData {
  playerId: string
  name: string
}

interface ChatErrorData {
  message: string
}

interface ChatMessageBroadcast {
  playerId: string
  playerName: string
  text: string
  time: string
  sessionId?: string
}

describe("ChatGateway - Sistema de Chat con Validaciones", () => {
  let io: Server
  let httpServer: any
  let httpServerAddr: any
  let chatService: ChatService

  beforeAll((done) => {
    httpServer = createServer()
    io = new Server(httpServer)
    chatService = new ChatService()
    new ChatGateway(io, chatService)

    httpServer.listen(() => {
      httpServerAddr = httpServer.address()
      done()
    })
  })

  afterAll(() => {
    io.close()
    httpServer.close()
  })

  describe("Unirse a una sala", () => {
    let clientSocket: typeof ClientSocket

    afterEach(() => {
      if (clientSocket?.connected) {
        clientSocket.disconnect()
      }
    })

    it("debe permitir unirse exitosamente con nombre válido", (done) => {
      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)
      const sessionId = "sala-test-1"
      const playerName = "Isabella"

      clientSocket.on("join_success", (data: JoinSuccessData) => {
        expect(data.playerName).toBe(playerName)
        expect(data.sessionId).toBe(sessionId)
        expect(data.playerId).toBeDefined()
        done()
      })

      clientSocket.on("connect", () => {
        clientSocket.emit("join_session", {
          sessionId,
          player: { name: playerName },
        })
      })
    })

    it("debe recibir historial de mensajes al unirse", (done) => {
      const sessionId = "sala-test-2"

      // Primer cliente envía un mensaje
      const client1 = Client(`http://[::1]:${httpServerAddr.port}`)

      client1.on("connect", () => {
        client1.emit("join_session", {
          sessionId,
          player: { name: "Pedro" },
        })
      })

      client1.on("join_success", (data: JoinSuccessData) => {
        client1.emit("chat_message", {
          sessionId,
          playerId: data.playerId,
          text: "Mensaje histórico",
        })

        // Esperar un poco para que se guarde el mensaje
        setTimeout(() => {
          // Segundo cliente se une y debe recibir el historial
          clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

          clientSocket.on("chat_history", (history: ChatMessage[]) => {
            expect(history).toHaveLength(1)
            expect(history[0].text).toBe("Mensaje histórico")
            expect(history[0].playerName).toBe("Pedro")
            client1.disconnect()
            done()
          })

          clientSocket.on("connect", () => {
            clientSocket.emit("join_session", {
              sessionId,
              player: { name: "Luis" },
            })
          })
        }, 100)
      })
    })

    it("debe rechazar nombre duplicado sin desconectar", (done) => {
      const sessionId = "sala-test-3"
      const duplicateName = "Sutano"

      // Primer cliente con el nombre
      const client1 = Client(`http://[::1]:${httpServerAddr.port}`)

      client1.on("connect", () => {
        client1.emit("join_session", {
          sessionId,
          player: { name: duplicateName },
        })
      })

      client1.on("join_success", (data: JoinSuccessData) => {
        // Segundo cliente intenta usar el mismo nombre
        clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

        clientSocket.on("join_rejected", (data: JoinRejectedData) => {
          expect(data.reason).toBe("name_taken")
          expect(data.message).toContain("ocupado")
          expect(clientSocket.connected).toBe(true) // No debe desconectar
          client1.disconnect()
          done()
        })

        clientSocket.on("connect", () => {
          clientSocket.emit("join_session", {
            sessionId,
            player: { name: duplicateName },
          })
        })
      })
    })

    it("debe rechazar y desconectar cuando la sala está llena (5 jugadores)", (done) => {
      const sessionId = "sala-test-4"
      const clients: typeof ClientSocket[] = []

      let connectedCount = 0

      // Conectar 5 jugadores
      for (let i = 1; i <= 5; i++) {
        const client = Client(`http://[::1]:${httpServerAddr.port}`)
        clients.push(client)

        client.on("connect", () => {
          client.emit("join_session", {
            sessionId,
            player: { name: `Jugador${i}` },
          })
        })

        client.on("join_success", (data: JoinSuccessData) => {
          connectedCount++

          if (connectedCount === 5) {
            // Intentar conectar el 6to jugador
            clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

            clientSocket.on("join_rejected", (data: JoinRejectedData) => {
              expect(data.reason).toBe("room_full")
              expect(data.message).toContain("llena")
              expect(data.message).toContain("5 jugadores")
            })

            clientSocket.on("disconnect", () => {
              // Verificar que los 5 primeros siguen conectados
              expect(clients.every((c) => c.connected)).toBe(true)
              clients.forEach((c) => c.disconnect())
              done()
            })

            clientSocket.on("connect", () => {
              clientSocket.emit("join_session", {
                sessionId,
                player: { name: "Jugador6" },
              })
            })
          }
        })
      }
    })
  })

  describe("Envío de mensajes", () => {
    let clientSocket: typeof ClientSocket

    afterEach(() => {
      if (clientSocket?.connected) {
        clientSocket.disconnect()
      }
    })

    it("debe enviar y recibir mensajes correctamente", (done) => {
      const sessionId = "sala-test-5"
      const playerName = "Lau"
      const messageText = "Hola desde test"

      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

      clientSocket.on("connect", () => {
        clientSocket.emit("join_session", {
          sessionId,
          player: { name: playerName },
        })
      })

      clientSocket.on("join_success", (data: JoinSuccessData) => {
        clientSocket.on("chat_message_broadcast", (msg: ChatMessageBroadcast) => {
          expect(msg.playerName).toBe(playerName)
          expect(msg.text).toBe(messageText)
          expect(msg.playerId).toBe(data.playerId)
          expect(msg.time).toBeDefined()
          done()
        })

        clientSocket.emit("chat_message", {
          sessionId,
          playerId: data.playerId,
          text: messageText,
        })
      })
    })

    it("debe rechazar mensajes de jugadores no registrados", (done) => {
      const sessionId = "sala-test-6"

      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

      clientSocket.on("connect", () => {
        // Intentar enviar mensaje sin unirse primero
        clientSocket.emit("chat_message", {
          sessionId,
          playerId: "fake-player-id",
          text: "Mensaje no autorizado",
        })
      })

      clientSocket.on("chat_error", (data: ChatErrorData) => {
        expect(data.message).toContain("No estás registrado")
        done()
      })
    })

    it("debe rechazar mensajes vacíos o muy largos", (done) => {
      const sessionId = "sala-test-7"

      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

      clientSocket.on("connect", () => {
        clientSocket.emit("join_session", {
          sessionId,
          player: { name: "TestPlayer" },
        })
      })

      clientSocket.on("join_success", (data: JoinSuccessData) => {
        let errorCount = 0

        clientSocket.on("chat_error", (error: ChatErrorData) => {
          errorCount++
          expect(error.message).toContain("caracteres")

          if (errorCount === 2) {
            done()
          }
        })

        // Mensaje vacío
        clientSocket.emit("chat_message", {
          sessionId,
          playerId: data.playerId,
          text: "   ",
        })

        // Mensaje muy largo (>500 caracteres)
        clientSocket.emit("chat_message", {
          sessionId,
          playerId: data.playerId,
          text: "a".repeat(501),
        })
      })
    })
  })

  describe("Notificaciones de jugadores", () => {
    let client1: typeof ClientSocket
    let client2: typeof ClientSocket

    afterEach(() => {
      if (client1?.connected) client1.disconnect()
      if (client2?.connected) client2.disconnect()
    })

    it("debe notificar cuando un jugador se une", (done) => {
      const sessionId = "sala-test-8"

      client1 = Client(`http://[::1]:${httpServerAddr.port}`)

      client1.on("connect", () => {
        client1.emit("join_session", {
          sessionId,
          player: { name: "Primer Jugador" },
        })
      })

      client1.on("join_success", (data: JoinSuccessData) => {
        // Escuchar notificación de nuevo jugador
        client1.on("player_joined", (data: PlayerJoinedData) => {
          expect(data.name).toBe("Segundo Jugador")
          expect(data.playerId).toBeDefined()
          done()
        })

        // Segundo jugador se une
        client2 = Client(`http://[::1]:${httpServerAddr.port}`)

        client2.on("connect", () => {
          client2.emit("join_session", {
            sessionId,
            player: { name: "Segundo Jugador" },
          })
        })
      })
    })

    it("debe notificar cuando un jugador se va", (done) => {
      const sessionId = "sala-test-9"

      client1 = Client(`http://[::1]:${httpServerAddr.port}`)

      client1.on("connect", () => {
        client1.emit("join_session", {
          sessionId,
          player: { name: "Jugador Permanente" },
        })
      })

      client1.on("join_success", (data: JoinSuccessData) => {
        client2 = Client(`http://[::1]:${httpServerAddr.port}`)

        client2.on("connect", () => {
          client2.emit("join_session", {
            sessionId,
            player: { name: "Jugador Temporal" },
          })
        })

        client2.on("join_success", (data: JoinSuccessData) => {
          // Escuchar notificación de salida
          client1.on("player_left", (data: PlayerLeftData) => {
            expect(data.name).toBe("Jugador Temporal")
            expect(data.playerId).toBeDefined()
            done()
          })

          // Desconectar el segundo jugador
          client2.disconnect()
        })
      })
    })
  })

  describe("Validaciones de datos", () => {
    let clientSocket: typeof ClientSocket

    afterEach(() => {
      if (clientSocket?.connected) {
        clientSocket.disconnect()
      }
    })

    it("debe rechazar nombres muy largos", (done) => {
      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

      clientSocket.on("disconnect", () => {
        done()
      })

      clientSocket.on("connect", () => {
        clientSocket.emit("join_session", {
          sessionId: "sala-test-10",
          player: { name: "a".repeat(21) }, // Más de 20 caracteres
        })
      })
    })

    it("debe rechazar nombres vacíos", (done) => {
      clientSocket = Client(`http://[::1]:${httpServerAddr.port}`)

      clientSocket.on("disconnect", () => {
        done()
      })

      clientSocket.on("connect", () => {
        clientSocket.emit("join_session", {
          sessionId: "sala-test-11",
          player: { name: "   " }, // Solo espacios
        })
      })
    })
  })
})
