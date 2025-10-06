"use client"

import { useEffect, useState } from "react"

export function AnimatedSpatium() {
  const [activeLetters, setActiveLetters] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly activate 1-2 letters
      const numActive = Math.random() > 0.5 ? 1 : 2
      const indices: number[] = []
      for (let i = 0; i < numActive; i++) {
        indices.push(Math.floor(Math.random() * 7))
      }
      setActiveLetters(indices)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const letters = ["S", "P", "A", "T", "I", "U", "M"]

  return (
    <div className="flex items-center gap-0.5">
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`
            text-base sm:text-lg font-bold font-[family-name:var(--font-pixel)] transition-all duration-300
            ${activeLetters.includes(index) ? "text-cyan-400 -translate-y-1 scale-110" : "text-blue-400"}
          `}
          style={{
            textShadow: activeLetters.includes(index)
              ? "0 0 10px rgba(34,211,238,0.8), 0 0 20px rgba(34,211,238,0.4)"
              : "0 0 5px rgba(96,165,250,0.5)",
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
