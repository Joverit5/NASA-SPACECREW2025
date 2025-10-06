import { NextResponse } from "next/server"
import { createRoom } from "@/lib/room-store"

export async function POST(request: Request) {
  console.log("[v0] API /api/rooms/create called")

  try {
    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { playerName } = body

    if (!playerName || !playerName.trim()) {
      console.log("[v0] Player name validation failed")
      return NextResponse.json({ error: "Player name is required" }, { status: 400 })
    }

    console.log("[v0] Creating room for player:", playerName)
    const { roomId, player } = await createRoom(playerName.trim())
    console.log("[v0] Room created successfully:", roomId, player)

    return NextResponse.json({ roomId, player })
  } catch (error) {
    console.error("[v0] Error in create room API:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}

export async function GET() {
  console.log("[v0] API /api/rooms/create GET called")
  return NextResponse.json({ message: "Create room API is working. Use POST to create a room." })
}
