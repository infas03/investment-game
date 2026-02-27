"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(`/game/${data.gameId}`);
    } catch {
      setError("Failed to create game");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError("");
    if (!gameCode.trim()) {
      setError("Please enter a game code");
      return;
    }
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gameCode.trim().toUpperCase(), playerName: playerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(
        `/game/${data.gameId}/play?playerId=${data.playerId}&playerName=${encodeURIComponent(playerName.trim())}`
      );
    } catch {
      setError("Failed to join game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Investment Game</h1>
          <p className="text-gray-600 text-sm">
            A multiplayer game exploring how individual investment decisions
            affect collective outcomes.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {mode === "menu" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("create")}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors"
              >
                Create New Game
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full border-2 border-primary text-primary py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Join Game
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-2">How It Works</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>
                    <strong>Asset A (Riskless):</strong> Your investment is returned to you as-is.
                  </li>
                  <li>
                    <strong>Asset B (Pooled):</strong> All players&apos; Asset B investments are pooled,
                    increased by 50%, then split equally among all players.
                  </li>
                  <li>Each player starts with $100 to allocate between the two assets.</li>
                </ul>
              </div>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Create New Game</h2>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Players
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        maxPlayers === n
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Game"}
              </button>
              <button
                onClick={() => {
                  setMode("menu");
                  setError("");
                }}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                Back
              </button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Join Game</h2>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Game Code
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 5-letter code"
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Game"}
              </button>
              <button
                onClick={() => {
                  setMode("menu");
                  setError("");
                }}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
