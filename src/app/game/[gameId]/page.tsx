"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface GameStatus {
  gameId: string;
  status: "waiting" | "playing" | "finished";
  maxPlayers: number;
  players: { name: string; submitted: boolean }[];
  results: null | Array<{
    playerName: string;
    assetA: number;
    assetB: number;
    assetBPayout: number;
    totalPayout: number;
  }>;
}

export default function GameLobby() {
  const params = useParams();
  const router = useRouter();
  const gameId = (params.gameId as string).toUpperCase();
  const [game, setGame] = useState<GameStatus | null>(null);
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/status?gameId=${gameId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setGame(data);
    } catch {
      setError("Failed to fetch game status");
    }
  }, [gameId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleJoin() {
    if (!playerName.trim()) {
      setJoinError("Please enter your name");
      return;
    }
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, playerName: playerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error);
        return;
      }
      router.push(
        `/game/${gameId}/play?playerId=${data.playerId}&playerName=${encodeURIComponent(playerName.trim())}`
      );
    } catch {
      setJoinError("Failed to join game");
    } finally {
      setJoining(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-primary hover:underline"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">Game Lobby</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Game Code:</span>
            <button
              onClick={copyCode}
              className="text-2xl font-mono font-bold tracking-widest text-primary hover:text-primary-hover transition-colors"
              title="Click to copy"
            >
              {gameId}
            </button>
            {copied && (
              <span className="text-xs text-success">Copied!</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Share this code with other players
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="font-semibold mb-2">
              Players ({game.players.length}/{game.maxPlayers})
            </h2>
            <div className="space-y-2">
              {game.players.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{p.name}</span>
                  {p.submitted && (
                    <span className="ml-auto text-xs text-success font-medium">
                      Submitted
                    </span>
                  )}
                </div>
              ))}
              {Array.from({ length: game.maxPlayers - game.players.length }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 opacity-40"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                      ?
                    </div>
                    <span className="text-gray-400">Waiting for player...</span>
                  </div>
                )
              )}
            </div>
          </div>

          {game.status === "waiting" && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-medium text-sm">Join this game</h3>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {joinError && (
                <p className="text-danger text-sm">{joinError}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join Game"}
              </button>
            </div>
          )}

          {game.status === "playing" && (
            <div className="border-t pt-4 text-center">
              <p className="text-gray-600 text-sm">
                Game in progress. Waiting for all players to submit investments...
              </p>
            </div>
          )}

          {game.status === "finished" && game.results && (
            <div className="border-t pt-4">
              <ResultsSummary
                results={game.results}
                playerCount={game.players.length}
              />
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}

function ResultsSummary({
  results,
  playerCount,
}: {
  results: Array<{
    playerName: string;
    assetA: number;
    assetB: number;
    assetBPayout: number;
    totalPayout: number;
  }>;
  playerCount: number;
}) {
  const totalPool = results.reduce((sum, r) => sum + r.assetB, 0);
  const poolAfterIncrease = totalPool * 1.5;
  const perPlayer = poolAfterIncrease / playerCount;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Results</h2>

      <div className="bg-blue-50 rounded-lg p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Total Asset B Pool:</span>
          <span className="font-semibold">${totalPool.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Pool after +50%:</span>
          <span className="font-semibold">${poolAfterIncrease.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Each player receives from B:</span>
          <span className="font-semibold">${perPlayer.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">{r.playerName}</span>
              <span className="text-lg font-bold text-success">
                ${r.totalPayout.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Asset A: ${r.assetA.toFixed(2)} + Asset B payout: $
              {r.assetBPayout.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
