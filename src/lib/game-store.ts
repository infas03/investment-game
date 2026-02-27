import { Game, GameResult, Player } from "./types";

const games = new Map<string, Game>();

function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createGame(maxPlayers: number): Game {
  let code: string;
  do {
    code = generateGameCode();
  } while (games.has(code));

  const game: Game = {
    id: code,
    players: [],
    maxPlayers,
    status: "waiting",
    results: null,
    createdAt: Date.now(),
  };
  games.set(code, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  return games.get(id.toUpperCase());
}

export function joinGame(
  gameId: string,
  playerName: string
): { game: Game; playerId: string } | { error: string } {
  const game = games.get(gameId.toUpperCase());
  if (!game) return { error: "Game not found" };
  if (game.status !== "waiting") return { error: "Game has already started" };
  if (game.players.length >= game.maxPlayers) return { error: "Game is full" };

  const trimmedName = playerName.trim();
  if (!trimmedName) return { error: "Player name is required" };
  if (trimmedName.length > 20) return { error: "Name must be 20 characters or less" };

  const duplicate = game.players.some(
    (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) return { error: "A player with that name already exists" };

  const playerId = generatePlayerId();
  const player: Player = {
    id: playerId,
    name: trimmedName,
    assetA: null,
    assetB: null,
    submitted: false,
  };
  game.players.push(player);

  if (game.players.length === game.maxPlayers) {
    game.status = "playing";
  }

  return { game, playerId };
}

export function submitInvestment(
  gameId: string,
  playerId: string,
  assetA: number,
  assetB: number
): { game: Game } | { error: string } {
  const game = games.get(gameId.toUpperCase());
  if (!game) return { error: "Game not found" };
  if (game.status !== "playing") return { error: "Game is not in playing state" };

  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  if (player.submitted) return { error: "Already submitted" };

  if (!Number.isInteger(assetA) || !Number.isInteger(assetB)) {
    return { error: "Investments must be whole numbers" };
  }
  if (assetA < 0 || assetB < 0) {
    return { error: "Investments cannot be negative" };
  }
  if (assetA + assetB !== 100) {
    return { error: "Total investment must equal $100" };
  }

  player.assetA = assetA;
  player.assetB = assetB;
  player.submitted = true;

  const allSubmitted = game.players.every((p) => p.submitted);
  if (allSubmitted) {
    game.status = "finished";
    game.results = calculateResults(game);
  }

  return { game };
}

function calculateResults(game: Game): GameResult[] {
  const totalAssetBPool = game.players.reduce(
    (sum, p) => sum + (p.assetB ?? 0),
    0
  );
  const poolAfterIncrease = totalAssetBPool * 1.5;
  const perPlayerBPayout = poolAfterIncrease / game.players.length;

  return game.players.map((p) => ({
    playerName: p.name,
    assetA: p.assetA ?? 0,
    assetB: p.assetB ?? 0,
    assetBPayout: Math.round(perPlayerBPayout * 100) / 100,
    totalPayout:
      Math.round(((p.assetA ?? 0) + perPlayerBPayout) * 100) / 100,
  }));
}

// Cleanup old games every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  for (const [id, game] of games) {
    if (game.createdAt < cutoff) {
      games.delete(id);
    }
  }
}, 30 * 60 * 1000);
