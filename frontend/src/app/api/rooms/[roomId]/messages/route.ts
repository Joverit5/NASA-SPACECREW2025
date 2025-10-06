import { NextResponse } from "next/server"
import { getMessages, addMessage, getRoom } from "@/lib/room-store"
import type { ChatMessage } from "@/lib/types"

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const messages = await getMessages(roomId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error getting messages:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const body = await request.json()

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const message: ChatMessage = {
      playerId: body.playerId,
      playerName: body.playerName,
      text: body.text,
      timestamp: Date.now(),
    }

    await addMessage(roomId, message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
