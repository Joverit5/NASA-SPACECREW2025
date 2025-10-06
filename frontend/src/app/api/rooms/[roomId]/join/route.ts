import { NextRequest, NextResponse } from "next/server"
import { joinRoom } from "@/lib/room-store"

export async function POST(request: NextRequest, context: any) {
  try {
    const roomId = context?.params?.roomId
    console.log("[v0] Join room request for roomId:", roomId)

    const { playerName } = await request.json()
    console.log("[v0] Player name:", playerName)

    if (!playerName || !playerName.trim()) {
      console.log("[v0] Player name validation failed")
      return NextResponse.json({ error: "Player name is required" }, { status: 400 })
    }

    const result = await joinRoom(roomId, playerName.trim())
    console.log("[v0] Join room result:", result)

    if (!result.success) {
      console.log("[v0] Join room failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log("[v0] Player joined successfully:", result.player)
    return NextResponse.json({ player: result.player })
  } catch (error) {
    console.error("[v0] Error joining room:", error)
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
  }
}
