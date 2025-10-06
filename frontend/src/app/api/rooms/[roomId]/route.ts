import { NextResponse } from "next/server"
import { getRoom } from "@/lib/room-store"

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params

    const room = await getRoom(roomId)

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error getting room:", error)
    return NextResponse.json({ error: "Failed to get room" }, { status: 500 })
  }
}
