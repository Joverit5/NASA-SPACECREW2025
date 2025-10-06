import { NextRequest, NextResponse } from "next/server"
import { togglePlayerReady } from "@/lib/room-store"

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: NextRequest, context: any) {
  try {
    const roomId = context?.params?.roomId
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
