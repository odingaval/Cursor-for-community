"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const goToRoom = (id: string, name: string, role?: string) => {
    const params = new URLSearchParams({ name });
    if (role) params.set("role", role);
    router.push(`/room/${id}?${params.toString()}`);
  };

  const handleCreate = async () => {
    if (!userName.trim()) {
      setError("Enter your name in the first field, then click Create new room.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { room } = await createRoom(roomName.trim() || undefined);
      sessionStorage.setItem("cfc_userName", userName.trim());
      sessionStorage.setItem("cfc_lastRoomId", room.id);
      setOpening(true);
      setLoading(false);
      // Hard navigation avoids stale Next.js dev cache breaking client-side routing
      window.location.href = `/room/${room.id}?${new URLSearchParams({ name: userName.trim() }).toString()}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create room. Is the server running?");
      setLoading(false);
      setOpening(false);
    }
  };

  const handleJoin = () => {
    if (!userName.trim() || !joinId.trim()) {
      setError("Enter your name and room ID");
      return;
    }
    sessionStorage.setItem("cfc_userName", userName.trim());
    goToRoom(joinId.trim(), userName.trim());
  };

  const handleMentorJoin = () => {
    if (!userName.trim() || !joinId.trim()) {
      setError("Enter your name and room ID");
      return;
    }
    sessionStorage.setItem("cfc_userName", userName.trim());
    goToRoom(joinId.trim(), userName.trim(), "mentor");
  };

  if (opening) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-8 bg-[#0a0c10]">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-semibold">Opening your room…</h2>
          <p className="text-gray-400 text-sm">
            First load compiles the code editor and can take 30–60 seconds in dev mode.
            Please wait — the URL will change to <span className="text-accent font-mono">/room/…</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0a0c10] via-[#0f1419] to-[#0a0c10]">
      <div className="w-full max-w-lg space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20">
            Hackathons · Bootcamps · Communities
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Cursor for <span className="text-accent">Communities</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time multiplayer IDE with AI pair programming for your team.
          </p>
        </header>

        <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 space-y-5 shadow-xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Alex"
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-surface-border focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Room name (optional)</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Team Alpha"
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-surface-border focus:border-accent/50 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || opening}
            className="w-full py-3 rounded-lg bg-accent text-gray-900 font-semibold hover:bg-accent-muted transition disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create new room"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-raised text-gray-500">or join existing</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Room ID</label>
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="abc12345"
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-surface-border focus:border-accent/50 focus:outline-none font-mono"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoin}
              className="flex-1 py-2.5 rounded-lg border border-surface-border hover:bg-surface transition font-medium"
            >
              Join as member
            </button>
            <button
              onClick={handleMentorJoin}
              className="flex-1 py-2.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition font-medium"
            >
              Join as mentor
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        <ul className="grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
          <li>Live cursors</li>
          <li>AI context-aware</li>
          <li>Yjs CRDT sync</li>
        </ul>
      </div>
    </main>
  );
}
