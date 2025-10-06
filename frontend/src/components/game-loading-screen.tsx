"use client"

import { useEffect, useState } from "react"

export function GameLoadingScreen() {
  const [dots, setDots] = useState("")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        return prev + 1
      })
    }, 70)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pantalla%20de%20carga-HfXIhJ1g6qt7Av3BBzNRZV6P39kSPT.png')",
          imageRendering: "pixelated",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-between p-8">
        {/* Top: Loading text */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-pixel)] mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              LOADING{dots}
            </h1>

            <div className="w-64 md:w-80 h-2 bg-black/40 border-2 border-white/60 mx-auto backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bottom: Minimal info */}
        <div className="space-y-3 text-center">
          <p className="text-sm md:text-base text-white/90 font-[family-name:var(--font-pixel)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {">"} SPATIUM-X7 | CREW: 2-5 | FUEL: ANTIMATTER
          </p>
          <p className="text-xs md:text-sm text-white/80 font-[family-name:var(--font-pixel)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {">"} Complete missions and manage your stats to win
          </p>
        </div>
      </div>
    </div>
  )
}
