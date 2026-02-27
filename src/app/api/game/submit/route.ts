import { NextRequest, NextResponse } from "next/server";
import { submitInvestment } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gameId, playerId, assetA, assetB } = body;

  if (!gameId || !playerId || assetA === undefined || assetB === undefined) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const result = submitInvestment(gameId, playerId, assetA, assetB);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const game = result.game;

  return NextResponse.json({
    gameId: game.id,
    status: game.status,
    players: game.players.map((p) => ({ name: p.name, submitted: p.submitted })),
    results: game.results,
  });
}
