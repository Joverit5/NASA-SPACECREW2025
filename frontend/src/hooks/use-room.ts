"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Room } from "@/lib/types"

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRoom = useCallback(async () => {
    if (!roomId) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Room not found")
          setRoom(null)
          return
        }
        throw new Error("Failed to fetch room")
      }

      const data = await response.json()
      setRoom(data.room)
      setError(null)
    } catch (err) {
      console.error("[v0] Error fetching room:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch room")
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // Initial fetch
  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  // Polling every 2 seconds
  useEffect(() => {
    if (!roomId) return

    intervalRef.current = setInterval(() => {
      fetchRoom()
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [roomId, fetchRoom])

  const toggleReady = useCallback(
    async (playerId: string) => {
      if (!roomId) return

      try {
        const response = await fetch(`/api/rooms/${roomId}/ready`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        })

        if (!response.ok) {
          throw new Error("Failed to toggle ready status")
        }

        // Immediately fetch updated room state
        await fetchRoom()
      } catch (err) {
        console.error("[v0] Error toggling ready:", err)
      }
    },
    [roomId, fetchRoom],
  )

  const sendMessage = useCallback(
    async (playerId: string, playerName: string, text: string) => {
      if (!roomId) return

      try {
        const response = await fetch(`/api/rooms/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId, playerName, text }),
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }
      } catch (err) {
        console.error("[v0] Error sending message:", err)
      }
    },
    [roomId],
  )

  const getMessages = useCallback(async () => {
    if (!roomId) return []

    try {
      const response = await fetch(`/api/rooms/${roomId}/messages`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      return data.messages || []
    } catch (err) {
      console.error("[v0] Error fetching messages:", err)
      return []
    }
  }, [roomId])

  return {
    room,
    isLoading,
    error,
    toggleReady,
    sendMessage,
    getMessages,
    refetch: fetchRoom,
  }
}
