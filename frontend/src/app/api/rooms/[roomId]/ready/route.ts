import { NextResponse } from "next/server"
import { togglePlayerReady } from "@/lib/room-store"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 })
    }

    const room = togglePlayerReady(roomId, playerId)

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("[v0] Error toggling ready:", error)
    return NextResponse.json({ error: "Failed to toggle ready" }, { status: 500 })
  }
}
