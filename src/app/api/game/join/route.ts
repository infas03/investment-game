import { NextRequest, NextResponse } from "next/server";
import { joinGame } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameId, playerName } = body;

  if (!gameId || !playerName) {
    return NextResponse.json(
      { error: "Game code and player name are required" },
      { status: 400 }
    );
  }

  const result = joinGame(gameId, playerName);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    gameId: result.game.id,
    playerId: result.playerId,
    status: result.game.status,
    players: result.game.players.map((p) => ({ name: p.name, submitted: p.submitted })),
    maxPlayers: result.game.maxPlayers,
  });
}
