export interface Player {
  id: string;
  name: string;
  assetA: number | null;
  assetB: number | null;
  submitted: boolean;
}

export interface GameResult {
  playerName: string;
  assetA: number;
  assetB: number;
  assetBPayout: number;
  totalPayout: number;
}

export interface Game {
  id: string;
  players: Player[];
  maxPlayers: number;
  status: "waiting" | "playing" | "finished";
  results: GameResult[] | null;
  createdAt: number;
}
