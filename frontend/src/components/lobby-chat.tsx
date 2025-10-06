"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Send } from "lucide-react"
import { useRoom } from "@/hooks/use-room"
import type { ChatMessage } from "@/lib/types"

interface LobbyChatProps {
  sessionId: string
  playerName: string
  playerId: string
}

export function LobbyChat({ sessionId, playerName, playerId }: LobbyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      playerId: "system",
      playerName: "SYSTEM",
      text: "Welcome to the lobby!",
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { sendMessage, getMessages } = useRoom(sessionId)

  useEffect(() => {
    const fetchMessages = async () => {
      const fetchedMessages = await getMessages()
      console.log("[v0] Fetched messages in LobbyChat:", fetchedMessages.length)
      if (fetchedMessages.length > 0) {
        setMessages([
          {
            playerId: "system",
            playerName: "SYSTEM",
            text: "Welcome to the lobby!",
            timestamp: Date.now(),
          },
          ...fetchedMessages,
        ])
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)

    return () => clearInterval(interval)
  }, [getMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    console.log("[v0] Sending message:", inputValue.trim())
    await sendMessage(playerId, playerName, inputValue.trim())
    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b-6 border-cyan-400/50 pb-3 mb-3">
        <div className="text-sm font-bold text-cyan-400 tracking-wider font-[family-name:var(--font-pixel)]">
          {">"} COMMS
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={`${msg.timestamp}-${index}`}
            className={`border-4 p-2 pixel-corners ${
              msg.playerId === "system"
                ? "border-purple-400/50 bg-purple-900/20"
                : msg.playerId === playerId
                  ? "border-cyan-400/50 bg-cyan-900/20"
                  : "border-blue-400/50 bg-blue-900/20"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-6 h-6 border-4 flex items-center justify-center text-xs font-bold font-[family-name:var(--font-pixel)] flex-shrink-0 ${
                  msg.playerId === "system"
                    ? "border-purple-400 bg-purple-900 text-purple-400"
                    : msg.playerId === playerId
                      ? "border-cyan-400 bg-cyan-900 text-cyan-400"
                      : "border-blue-400 bg-blue-900 text-blue-400"
                }`}
              >
                {msg.playerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-bold mb-1 font-[family-name:var(--font-pixel)] ${
                    msg.playerId === "system"
                      ? "text-purple-400"
                      : msg.playerId === playerId
                        ? "text-cyan-400"
                        : "text-blue-400"
                  }`}
                >
                  {msg.playerName}
                </div>
                <div className="text-xs text-blue-200 break-words font-[family-name:var(--font-pixel)] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type..."
          maxLength={100}
          className="flex-1 bg-slate-900 border-4 border-blue-400/50 text-blue-200 placeholder:text-blue-400/30 font-[family-name:var(--font-pixel)] text-xs h-10 focus-visible:ring-0 focus-visible:border-cyan-400 pixel-corners"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputValue.trim()}
          className="bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-[family-name:var(--font-pixel)] font-bold border-4 border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed h-10 w-10 p-0 arcade-button"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
