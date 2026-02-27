"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = (params.gameId as string).toUpperCase();
  const playerId = searchParams.get("playerId") || "";
  const playerName = searchParams.get("playerName") || "Player";

  const [assetA, setAssetA] = useState<string>("50");
  const [assetB, setAssetB] = useState<string>("50");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>("playing");
  const [results, setResults] = useState<null | Array<{
    playerName: string;
    assetA: number;
    assetB: number;
    assetBPayout: number;
    totalPayout: number;
  }>>(null);
  const [players, setPlayers] = useState<
    { name: string; submitted: boolean }[]
  >([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/status?gameId=${gameId}`);
      const data = await res.json();
      if (res.ok) {
        setGameStatus(data.status);
        setPlayers(data.players);
        if (data.results) {
          setResults(data.results);
        }
      }
    } catch {
      // silently fail polling
    }
  }, [gameId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  function handleAssetAChange(value: string) {
    const numStr = value.replace(/[^0-9]/g, "");
    if (numStr === "") {
      setAssetA("");
      setAssetB("100");
      return;
    }
    const num = Math.min(100, parseInt(numStr, 10));
    setAssetA(String(num));
    setAssetB(String(100 - num));
  }

  function handleAssetBChange(value: string) {
    const numStr = value.replace(/[^0-9]/g, "");
    if (numStr === "") {
      setAssetB("");
      setAssetA("100");
      return;
    }
    const num = Math.min(100, parseInt(numStr, 10));
    setAssetB(String(num));
    setAssetA(String(100 - num));
  }

  async function handleSubmit() {
    setError("");
    const a = parseInt(assetA, 10);
    const b = parseInt(assetB, 10);

    if (isNaN(a) || isNaN(b)) {
      setError("Please enter valid numbers");
      return;
    }
    if (a < 0 || b < 0) {
      setError("Investments cannot be negative");
      return;
    }
    if (a + b !== 100) {
      setError("Total must equal $100");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, playerId, assetA: a, assetB: b }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
      if (data.results) {
        setResults(data.results);
        setGameStatus("finished");
      }
    } catch {
      setError("Failed to submit investment");
    } finally {
      setLoading(false);
    }
  }

  if (results && gameStatus === "finished") {
    const totalPool = results.reduce((sum, r) => sum + r.assetB, 0);
    const poolAfterIncrease = totalPool * 1.5;
    const perPlayer = poolAfterIncrease / players.length;

    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Game Results</h1>
            <p className="text-gray-500 text-sm">Game {gameId}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Asset B Pool:</span>
                <span className="font-semibold">${totalPool.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pool after +50%:</span>
                <span className="font-semibold">
                  ${poolAfterIncrease.toFixed(2)}
                </span>
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
                  className={`rounded-lg p-3 ${
                    r.playerName === playerName
                      ? "bg-blue-50 border-2 border-primary"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">
                      {r.playerName}
                      {r.playerName === playerName && (
                        <span className="text-xs text-primary ml-1">(You)</span>
                      )}
                    </span>
                    <span className="text-lg font-bold text-success">
                      ${r.totalPayout.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Asset A: ${r.assetA.toFixed(2)} | Asset B invested: $
                    {r.assetB.toFixed(2)} | B payout: ${r.assetBPayout.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => router.push("/")}
              className="text-primary hover:underline text-sm"
            >
              Play Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Investment Submitted!</h2>
            <p className="text-gray-600 text-sm">
              Waiting for other players to submit their investments...
            </p>
            <div className="space-y-1">
              {players.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm px-2"
                >
                  <span>{p.name}</span>
                  <span
                    className={
                      p.submitted ? "text-success" : "text-gray-400"
                    }
                  >
                    {p.submitted ? "Submitted" : "Pending..."}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Make Your Investment</h1>
          <p className="text-gray-500 text-sm">
            Playing as <strong>{playerName}</strong> in game {gameId}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
          <p className="text-sm text-gray-600">
            You have <strong>$100</strong> to allocate between Asset A
            (riskless) and Asset B (pooled). Adjust the slider or enter amounts
            directly.
          </p>

          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={assetA || 0}
              onChange={(e) => handleAssetAChange(e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>All in Asset B</span>
              <span>All in Asset A</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Asset A (Riskless)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetA}
                  onChange={(e) => handleAssetAChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Returned as-is</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Asset B (Pooled)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetB}
                  onChange={(e) => handleAssetBChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Pooled + 50%, split equally</p>
            </div>
          </div>

          <div className="text-center text-sm">
            Total:{" "}
            <span
              className={`font-semibold ${
                (parseInt(assetA, 10) || 0) + (parseInt(assetB, 10) || 0) === 100
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              ${(parseInt(assetA, 10) || 0) + (parseInt(assetB, 10) || 0)}
            </span>{" "}
            / $100
          </div>

          {error && <p className="text-danger text-sm text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Investment"}
          </button>
        </div>
      </div>
    </main>
  );
}
