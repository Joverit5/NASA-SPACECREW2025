import { NextRequest, NextResponse } from "next/server"
import { togglePlayerReady } from "@/lib/room-store"

export async function POST(request: NextRequest) {
  try {
    // Extraer el roomId desde la URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const roomId = pathParts[pathParts.indexOf("rooms") + 1] // obtiene el valor dinámico

    const { playerId } = await request.json()

    const updatedRoom = await togglePlayerReady(roomId, playerId)
    if (!updatedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    console.error("[v0] Error toggling ready:", error)
    return NextResponse.json({ error: "Failed to update ready status" }, { status: 500 })
  }
}
