"use client"

import { use, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Copy, Check, Crown } from "lucide-react"
import type { Player } from "@/lib/types"

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params)
  const searchParams = useSearchParams()
  const playerName = searchParams.get("name") || "Anonymous"

  const isCreator = searchParams.get("creator") === "true"
  const currentPlayerId = "1"

  const [players, setPlayers] = useState<Player[]>([{ id: "1", name: playerName, ready: false, hp: 100 }])
  const [copied, setCopied] = useState(false)

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleReady = () => {
    setPlayers((prev) => prev.map((p) => (p.id === currentPlayerId ? { ...p, ready: !p.ready } : p)))
  }

  const currentPlayer = players.find((p) => p.id === currentPlayerId)
  const allPlayersReady = players.every((p) => p.ready)

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#89b4fa] relative overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(137,180,250,0.1)_2px,rgba(137,180,250,0.1)_4px)]"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 text-center">
          <pre className="text-[#cba6f7] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-[0_0_20px_rgba(203,166,247,0.5)]">
            {`
 ███████╗██████╗  █████╗ ████████╗██╗██╗   ██╗███╗   ███╗
 ██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██║██║   ██║████╗ ████║
 ███████╗██████╔╝███████║   ██║   ██║██║   ██║██╔████╔██║
 ╚════██║██╔═══╝ ██╔══██║   ██║   ██║██║   ██║██║╚██╔╝██║
 ███████║██║     ██║  ██║   ██║   ██║╚██████╔╝██║ ╚═╝ ██║
 ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝     ╚═╝
`}
          </pre>
          <div className="mt-4 text-[#94e2d5] text-sm md:text-base">Mission Room loaded in 0.5ms</div>
        </div>

        <div className="w-full max-w-4xl bg-[#181825]/90 backdrop-blur-sm border-2 border-[#89b4fa]/30 rounded-lg p-6 md:p-8 shadow-[0_0_30px_rgba(137,180,250,0.2)]">
          {/* Session Code Display */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-[#89b4fa]/20">
            <div className="flex items-center gap-3">
              <span className="text-[#f38ba8] text-lg md:text-xl">●</span>
              <div>
                <div className="text-xs text-[#89b4fa]/70">SESSION CODE</div>
                <div className="text-xl md:text-2xl font-bold text-[#cba6f7]">{sessionId}</div>
              </div>
            </div>
            <Button
              onClick={copySessionCode}
              variant="outline"
              size="sm"
              className="border-2 border-[#89b4fa] text-[#89b4fa] hover:bg-[#89b4fa]/10 bg-transparent font-mono"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Menu Options - Neovim style */}
          <div className="space-y-3 mb-8">
            {/* Crew Members Section */}
            <div className="group">
              <div className="flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors cursor-pointer border-2 border-transparent hover:border-[#89b4fa]/30">
                <div className="flex items-center gap-4">
                  <span className="text-[#89b4fa] text-xl">👥</span>
                  <span className="text-[#cdd6f4] text-base md:text-lg">Crew Members</span>
                </div>
                <span className="text-[#f38ba8] text-sm">u</span>
              </div>

              {/* Players List */}
              <div className="ml-12 mt-2 space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-[#11111b]/50 rounded border border-[#89b4fa]/20"
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && isCreator && (
                        <Crown className="w-4 h-4 text-[#f9e2af] drop-shadow-[0_0_10px_rgba(249,226,175,0.7)]" />
                      )}
                      <span className="text-[#cdd6f4] text-sm md:text-base">{player.name}</span>
                    </div>
                    <Badge
                      variant={player.ready ? "default" : "secondary"}
                      className={
                        player.ready
                          ? "bg-[#a6e3a1] text-[#11111b] border-[#a6e3a1] text-xs"
                          : "bg-[#313244] text-[#89b4fa] border-[#313244] text-xs"
                      }
                    >
                      {player.ready ? "READY" : "NOT READY"}
                    </Badge>
                  </div>
                ))}
                {players.length < 5 && (
                  <div className="text-center py-4 text-[#89b4fa]/50 border border-dashed border-[#89b4fa]/20 rounded text-sm">
                    Waiting for more players... ({players.length}/5)
                  </div>
                )}
              </div>
            </div>

            {/* Ready Toggle */}
            <button
              onClick={toggleReady}
              className="w-full flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors border-2 border-transparent hover:border-[#89b4fa]/30"
            >
              <div className="flex items-center gap-4">
                <span className="text-[#a6e3a1] text-xl">✓</span>
                <span className="text-[#cdd6f4] text-base md:text-lg">
                  {currentPlayer?.ready ? "Mark Not Ready" : "Mark Ready"}
                </span>
              </div>
              <span className="text-[#f38ba8] text-sm">r</span>
            </button>

            {/* Start Mission */}
            <button
              onClick={() => {
                if (isCreator && allPlayersReady && players.length >= 2) {
                  console.log("Starting mission...")
                }
              }}
              disabled={!isCreator || !allPlayersReady || players.length < 2}
              className="w-full flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors border-2 border-transparent hover:border-[#89b4fa]/30 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                !isCreator
                  ? "Only the room creator can start the mission"
                  : !allPlayersReady
                    ? "All players must be ready"
                    : players.length < 2
                      ? "Need at least 2 players"
                      : ""
              }
            >
              <div className="flex items-center gap-4">
                <span className="text-[#cba6f7] text-xl">🚀</span>
                <span className="text-[#cdd6f4] text-base md:text-lg">Start Mission</span>
              </div>
              <span className="text-[#f38ba8] text-sm">s</span>
            </button>

            {/* Habitat Designer */}
            <div className="flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors cursor-pointer border-2 border-transparent hover:border-[#89b4fa]/30">
              <div className="flex items-center gap-4">
                <span className="text-[#94e2d5] text-xl">🏗️</span>
                <span className="text-[#cdd6f4] text-base md:text-lg">Habitat Designer</span>
              </div>
              <span className="text-[#f38ba8] text-sm">h</span>
            </div>

            {/* Config */}
            <div className="flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors cursor-pointer border-2 border-transparent hover:border-[#89b4fa]/30">
              <div className="flex items-center gap-4">
                <span className="text-[#f9e2af] text-xl">⚙️</span>
                <span className="text-[#cdd6f4] text-base md:text-lg">Config</span>
              </div>
              <span className="text-[#f38ba8] text-sm">c</span>
            </div>

            {/* Quit */}
            <div className="flex items-center justify-between p-4 hover:bg-[#89b4fa]/5 rounded transition-colors cursor-pointer border-2 border-transparent hover:border-[#89b4fa]/30">
              <div className="flex items-center gap-4">
                <span className="text-[#f38ba8] text-xl">🚪</span>
                <span className="text-[#cdd6f4] text-base md:text-lg">Quit</span>
              </div>
              <span className="text-[#f38ba8] text-sm">q</span>
            </div>
          </div>

          {/* Status Bar - Neovim style */}
          <div className="mt-6 pt-4 border-t-2 border-[#89b4fa]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-4">
              <span className="text-[#a6e3a1]">NORMAL</span>
              <span className="text-[#89b4fa]/70">|</span>
              <span className="text-[#cdd6f4]">Room: {sessionId}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#89b4fa]/70">Players: {players.length}/5</span>
              <span className="text-[#89b4fa]/70">|</span>
              <span className="text-[#94e2d5]">
                Ready: {players.filter((p) => p.ready).length}/{players.length}
              </span>
            </div>
          </div>

          {/* Info Message */}
          {!isCreator && (
            <div className="mt-4 text-center text-sm text-[#89b4fa]/70 border border-[#89b4fa]/20 rounded p-3 bg-[#11111b]/50">
              ⚡ Waiting for the mission commander to start the mission...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
