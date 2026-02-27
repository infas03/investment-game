import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { maxPlayers } = body;

  if (!maxPlayers || maxPlayers < 2 || maxPlayers > 4) {
    return NextResponse.json(
      { error: "Number of players must be between 2 and 4" },
      { status: 400 }
    );
  }

  const game = createGame(maxPlayers);
  return NextResponse.json({ gameId: game.id, maxPlayers: game.maxPlayers });
}
