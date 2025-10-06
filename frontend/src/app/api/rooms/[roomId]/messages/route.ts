import { NextResponse } from "next/server"
import { getMessages, addMessage, getRoom } from "@/lib/room-store"
import type { ChatMessage } from "@/lib/types"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId
    const messages = getMessages(roomId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error getting messages:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId
    const message: ChatMessage = await request.json()

    const room = getRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    addMessage(roomId, message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error adding message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
