import { NextResponse } from "next/server"
import { getRoom } from "@/lib/room-store"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId

    const room = getRoom(roomId)

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("[v0] Error getting room:", error)
    return NextResponse.json({ error: "Failed to get room" }, { status: 500 })
  }
}
