import { NextRequest, NextResponse } from "next/server";
import { getGame } from "@/lib/game-store";

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json({ error: "Game code is required" }, { status: 400 });
  }

  const game = getGame(gameId);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({
    gameId: game.id,
    status: game.status,
    maxPlayers: game.maxPlayers,
    players: game.players.map((p) => ({ name: p.name, submitted: p.submitted })),
    results: game.results,
  });
}
