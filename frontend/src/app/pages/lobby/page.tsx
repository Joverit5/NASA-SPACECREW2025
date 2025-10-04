"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Terminal, Users, Rocket } from "lucide-react"

export default function LobbyPage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [sessionCode, setSessionCode] = useState("")

  const handleCreateSession = () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }
    // Generate a random session ID
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase()
    router.push(`/pages/room/${sessionId}?name=${encodeURIComponent(playerName)}`)
  }

  const handleJoinSession = () => {
    if (!playerName.trim()) {
      alert("Please enter your name")
      return
    }
    if (!sessionCode.trim()) {
      alert("Please enter a session code")
      return
    }
    router.push(`/pages/room/${sessionCode.toUpperCase()}?name=${encodeURIComponent(playerName)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-blue-300 relative overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(96,165,250,0.1)_2px,rgba(96,165,250,0.1)_4px)]"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b-2 border-blue-400/30 px-8 py-4 bg-slate-900/50 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold tracking-wider text-blue-400">[SPATIUM]</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Rocket className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]" />
            <h1 className="text-4xl md:text-5xl font-bold text-blue-400">{">"} MISSION LOBBY</h1>
          </div>
          <p className="text-lg text-blue-200">{">"} Create or join a mission to start building your Mars habitat</p>
        </div>

        {/* Player Name Input */}
        <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 mb-8 shadow-[0_0_20px_rgba(96,165,250,0.3)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400">YOUR IDENTITY</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-blue-300 text-sm">
                {">"} PLAYER NAME:
              </Label>
              <Input
                id="playerName"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-950/80 border-2 border-blue-400/50 text-blue-300 placeholder:text-blue-400/30 font-mono focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Session */}
          <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-purple-400">CREATE MISSION</h3>
              </div>
              <p className="text-sm text-blue-200">{">"} Start a new mission and invite your crew</p>
              <Button
                onClick={handleCreateSession}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-mono font-bold border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                size="lg"
              >
                {">"} CREATE NEW SESSION
              </Button>
            </div>
          </div>

          {/* Join Session */}
          <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-cyan-400">JOIN MISSION</h3>
              </div>
              <p className="text-sm text-blue-200">{">"} Enter a session code to join your crew</p>
              <div className="space-y-2">
                <Label htmlFor="sessionCode" className="text-blue-300 text-sm">
                  {">"} SESSION CODE:
                </Label>
                <Input
                  id="sessionCode"
                  placeholder="Enter code..."
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="bg-slate-950/80 border-2 border-blue-400/50 text-blue-300 placeholder:text-blue-400/30 font-mono uppercase focus:border-cyan-400"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleJoinSession}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-mono font-bold border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                size="lg"
              >
                {">"} JOIN SESSION
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-8 text-center space-y-6 shadow-[0_0_20px_rgba(96,165,250,0.3)]">
          <h3 className="text-2xl font-bold text-blue-400">{">"} HOW IT WORKS</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-3xl text-cyan-400 font-bold">01</div>
              <p className="text-blue-200">{">"} Create or join a mission with up to 5 players</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl text-purple-400 font-bold">02</div>
              <p className="text-blue-200">{">"} Collaborate to design your 20×20 Mars habitat</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl text-blue-400 font-bold">03</div>
              <p className="text-blue-200">{">"} Face challenges and survive 30 mission days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-blue-400/30 mt-20 bg-slate-900/50 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center text-blue-400/60 text-sm">
          <p>{">"} © 2025 SPATIUM. ALL SYSTEMS OPERATIONAL.</p>
        </div>
      </footer>
    </div>
  )
}
