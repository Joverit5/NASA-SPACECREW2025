import { NextResponse } from "next/server"
import { joinRoom } from "@/lib/room-store"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId
    const { playerName } = await request.json()

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 })
    }

    const result = joinRoom(roomId, playerName.trim())

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ player: result.player })
  } catch (error) {
    console.error("[v0] Error joining room:", error)
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
  }
}
