"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Copy, Check, Crown, Users, Zap, Terminal } from "lucide-react"
import { LobbyChat } from "@/components/lobby-chat"
import { AnimatedSpatium } from "@/components/animated-spatium"
import { GameLoadingScreen } from "@/components/game-loading-screen"
import { useRoom } from "@/hooks/use-room"

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.id as string

  const searchParams = useSearchParams()
  const playerName = searchParams.get("name") || "Anonymous"
  const playerId = searchParams.get("playerId") || ""
  const isCreator = searchParams.get("creator") === "true"

  const { room, isLoading: roomLoading, error, toggleReady: toggleReadyAPI } = useRoom(sessionId)

  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (error === "Room not found") {
      alert("Room not found. Redirecting to lobby...")
      router.push("/pages/lobby")
    }
  }, [error, router])

  useEffect(() => {
    if (!sessionId || !playerName || isCreator || !room) return

    const isPlayerInRoom = room.players.some((p) => p.name === playerName)

    if (!isPlayerInRoom) {
      fetch(`/api/rooms/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            alert(data.error || "Failed to join room")
            router.push("/pages/lobby")
          }
        })
        .catch(() => {
          alert("Failed to join room")
          router.push("/pages/lobby")
        })
    }
  }, [sessionId, playerName, isCreator, room, router])

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleReady = () => {
    if (!playerId) return
    toggleReadyAPI(playerId)
  }

  const startGame = () => {
    setIsLoading(true)
    setTimeout(() => {
      setTimeout(() => {
        setIsLoading(false)
      }, 7000)
    }, 500)
  }

  const handleStartGame = () => {
    startGame()
  }

  if (roomLoading || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-blue-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400 mb-4">{">"} CONNECTING...</div>
          <div className="text-blue-400">Please wait while we connect you to the mission</div>
        </div>
      </div>
    )
  }

  const currentPlayer = room.players.find((p) => p.id === playerId || p.name === playerName)
  const allPlayersReady = room.players.every((p) => p.ready)
  const isRoomCreator = room.creatorId === (playerId || currentPlayer?.id)
  const isConnected = true // Always connected with API polling

  if (isLoading) {
    return <GameLoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-blue-300 relative overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(96,165,250,0.15)_2px,rgba(96,165,250,0.15)_4px)]"></div>
      </div>

      <div className="absolute inset-0 pointer-events-none crt-noise"></div>
      <div className="absolute inset-0 overflow-hidden opacity-5 animate-pulse"></div>
      <div className="absolute inset-0 pixel-grid pointer-events-none"></div>
      <div className="absolute inset-0 dither-pattern pointer-events-none"></div>

      <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="border-4 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 mb-6 shadow-[0_0_20px_rgba(96,165,250,0.3)] pixel-corners scanlines crt-noise phosphor-glow">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-blue-400 retro-glow" />
              <div>
                <div className="text-xs text-cyan-400 tracking-wider font-[family-name:var(--font-pixel)]">
                  {">"} MISSION LOBBY
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-400 font-[family-name:var(--font-pixel)]">[</span>
                  <AnimatedSpatium />
                  <span className="text-xl font-bold text-blue-400 font-[family-name:var(--font-pixel)]">]</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="border-4 border-cyan-400/50 bg-slate-800/80 px-4 py-2 pixel-corners scanlines pixel-shadow">
                <div className="text-xs text-cyan-400 mb-1 font-[family-name:var(--font-pixel)]">{">"} ROOM CODE</div>
                <div className="text-2xl font-bold text-cyan-400 tracking-widest font-[family-name:var(--font-pixel)] retro-glow">
                  {sessionId}
                </div>
              </div>
              <Button
                onClick={copySessionCode}
                size="sm"
                className="bg-blue-400 text-black hover:bg-blue-300 font-[family-name:var(--font-pixel)] font-bold border-4 border-blue-400 arcade-button pixel-shadow"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="border-4 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 shadow-[0_0_20px_rgba(96,165,250,0.3)] pixel-corners scanlines crt-noise">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-cyan-400 retro-glow" />
                <h2 className="text-lg font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-pixel)]">
                  {">"} STATUS
                </h2>
              </div>
              <div className="space-y-3 text-sm font-[family-name:var(--font-pixel)]">
                <div className="flex justify-between">
                  <span className="text-blue-300">{">"} SYS:</span>
                  <span
                    className={`font-bold ${isConnected ? "text-green-400 animate-pulse retro-glow" : "text-red-400"}`}
                  >
                    {isConnected ? "ON" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">{">"} PLY:</span>
                  <span className="text-cyan-400 font-bold">
                    {room.players.length}/{room.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">{">"} RDY:</span>
                  <span className="text-purple-400 font-bold">
                    {room.players.filter((p) => p.ready).length}/{room.players.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-4 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 shadow-[0_0_15px_rgba(96,165,250,0.3)] hidden lg:block pixel-corners h-[400px] scanlines crt-noise">
              <LobbyChat sessionId={sessionId} playerName={playerName} playerId={currentPlayer?.id || playerId} />
            </div>

            <div className="border-4 border-purple-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 shadow-[0_0_15px_rgba(168,139,250,0.2)] pixel-corners scanlines">
              <div className="text-xs text-purple-400 mb-2 font-bold font-[family-name:var(--font-pixel)]">
                {">"} CTRL
              </div>
              <div className="space-y-1 text-xs text-blue-300 font-[family-name:var(--font-pixel)]">
                <div>{">"} [R] RDY</div>
                <div>{">"} [S] GO</div>
                <div>{">"} [ESC] EXIT</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="border-4 border-cyan-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 shadow-[0_0_25px_rgba(34,211,238,0.3)] pixel-corners scanlines crt-noise phosphor-glow">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-cyan-400 retro-glow" />
                <h2 className="text-2xl font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-pixel)] retro-glow">
                  {">"} CREW
                </h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-cyan-400/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {room.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="border-4 border-blue-400/50 bg-slate-800/80 p-4 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] pixel-corners scanlines pixel-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {player.id === room.creatorId && (
                          <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse" />
                        )}
                        <div className="w-10 h-10 border-4 border-cyan-400 bg-slate-900 flex items-center justify-center text-lg font-bold text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] font-[family-name:var(--font-pixel)] pixel-shadow">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-bold text-cyan-400 font-[family-name:var(--font-pixel)]">
                            {player.name}
                          </div>
                          <div className="text-xs text-blue-400 font-[family-name:var(--font-pixel)]">P{index + 1}</div>
                        </div>
                      </div>
                      <Badge
                        className={
                          player.ready
                            ? "bg-green-500/20 text-green-400 border-3 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] font-[family-name:var(--font-pixel)] text-xs retro-glow"
                            : "bg-slate-700/50 text-blue-400 border-3 border-blue-400/50 font-[family-name:var(--font-pixel)] text-xs"
                        }
                      >
                        {player.ready ? "READY" : "WAIT"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-300 font-[family-name:var(--font-pixel)]">
                        <span>{">"} HP</span>
                        <span className="text-cyan-400">{player.hp}%</span>
                      </div>
                      <div className="h-3 bg-slate-900 border-3 border-blue-400/50">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                          style={{ width: `${player.hp}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}

                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="border-4 border-dashed border-blue-400/30 bg-slate-900/50 p-4 flex items-center justify-center pixel-corners scanlines"
                  >
                    <div className="text-center text-blue-400/50">
                      <div className="text-3xl mb-2">⬡</div>
                      <div className="text-xs uppercase tracking-wider font-[family-name:var(--font-pixel)]">EMPTY</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={toggleReady}
                  size="lg"
                  disabled={!isConnected}
                  className={
                    currentPlayer?.ready
                      ? "bg-slate-700 text-blue-400 hover:bg-slate-600 font-[family-name:var(--font-pixel)] font-bold border-4 border-blue-400 text-sm h-16 arcade-button pixel-shadow"
                      : "bg-blue-400 text-black hover:bg-blue-300 font-[family-name:var(--font-pixel)] font-bold border-4 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)] text-sm h-16 arcade-button pixel-shadow"
                  }
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {currentPlayer?.ready ? "NOT READY" : "READY!"}
                </Button>

                <Button
                  onClick={handleStartGame}
                  disabled={!isRoomCreator || !allPlayersReady || room.players.length < 1 || !isConnected}
                  size="lg"
                  className="bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-[family-name:var(--font-pixel)] font-bold border-4 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-sm h-16 arcade-button pixel-shadow"
                  title={
                    !isRoomCreator
                      ? "Only the room creator can start the game"
                      : !allPlayersReady
                        ? "All players must be ready"
                        : room.players.length < 1
                          ? "Need at least 1 player"
                          : "Click to launch mission!"
                  }
                >
                  <Terminal className="w-5 h-5 mr-2" />
                  LAUNCH
                </Button>
              </div>

              {!allPlayersReady && (
                <div className="mt-4 border-4 border-purple-400/50 bg-slate-800/80 p-4 text-center pixel-corners scanlines">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl animate-pulse">⏳</span>
                    <span className="text-purple-400 font-bold uppercase tracking-wide text-sm font-[family-name:var(--font-pixel)]">
                      MARK READY TO LAUNCH
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:hidden mb-6">
          <div className="border-4 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 shadow-[0_0_20px_rgba(96,165,250,0.3)] pixel-corners h-[300px] scanlines crt-noise">
            <LobbyChat sessionId={sessionId} playerName={playerName} playerId={currentPlayer?.id || playerId} />
          </div>
        </div>

        <div className="border-4 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 shadow-[0_0_20px_rgba(96,165,250,0.3)] pixel-corners scanlines crt-noise">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-[family-name:var(--font-pixel)]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 ${isConnected ? "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-red-400"}`}
                ></div>
                <span className={`font-bold ${isConnected ? "text-green-400" : "text-red-400"}`}>
                  {isConnected ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              <div className="text-blue-400/50">|</div>
              <div className="text-blue-300">
                MARS <span className="text-cyan-400 font-bold">HABITAT</span>
              </div>
            </div>
            <div className="text-blue-400/50">SPATIUM v1.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
