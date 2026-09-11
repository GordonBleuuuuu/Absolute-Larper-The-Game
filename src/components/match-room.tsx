"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Match = {
  id: string;
  status: "lobby" | "playing" | "complete";
  host_user_id: string | null;
  team_score: number;
  required_score: number;
};

type MatchPlayer = {
  id: string;
  user_id: string;
  display_name: string;
  ready: boolean;
};

export function MatchRoom({ roomId }: { roomId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState("Checking the meadow gate...");
  const [isJoining, setIsJoining] = useState(false);

  const loadRoom = useCallback(async () => {
    const [{ data: matchData, error: matchError }, { data: playerData, error: playerError }] = await Promise.all([
      supabase.from("matches").select("id, status, host_user_id, team_score, required_score").eq("id", roomId).single(),
      supabase.from("match_players").select("id, user_id, display_name, ready").eq("match_id", roomId).order("display_name"),
    ]);

    if (matchError || playerError) {
      setNotice("Join this room to see its meadow roster.");
      return;
    }

    setMatch(matchData as Match);
    setPlayers((playerData ?? []) as MatchPlayer[]);
    setNotice("");
  }, [roomId, supabase]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      setUserId(data.user?.id ?? null);
      if (data.user) await loadRoom();
      else setNotice("Sign in on the home page before joining a multiplayer room.");
    }

    void load();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_players", filter: `match_id=eq.${roomId}` }, loadRoom)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${roomId}` }, loadRoom)
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loadRoom, roomId, supabase]);

  async function joinRoom() {
    if (!userId || displayName.trim().length < 2) {
      setNotice("Sign in, then choose a meadow name with at least two letters.");
      return;
    }

    setIsJoining(true);
    const { error } = await supabase.rpc("join_typing_room", {
      p_match_id: roomId,
      p_display_name: displayName.trim(),
    });
    setIsJoining(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    await loadRoom();
  }

  async function setReady(ready: boolean) {
    const { error } = await supabase.rpc("set_player_ready", { p_match_id: roomId, p_ready: ready });
    if (error) setNotice(error.message);
  }

  async function startRoom() {
    const { error } = await supabase.rpc("start_typing_room", { p_match_id: roomId });
    if (error) setNotice(error.message);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Invite link copied — send it to your typing pals.");
  }

  const myPlayer = players.find((player) => player.user_id === userId);
  const isHost = match?.host_user_id === userId;
  const readyPlayers = players.filter((player) => player.ready).length;

  if (!match) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8ef] p-6 text-center text-[#725f75]">
        <section className="w-full max-w-md rounded-[2rem] border-4 border-white bg-white/80 p-7 shadow-xl">
          <p className="text-4xl">✦</p>
          <h1 className="mt-3 font-[family-name:var(--font-fredoka)] text-3xl font-black">Find this meadow</h1>
          <p className="mt-3 text-sm font-semibold">{notice}</p>
          {userId && (
            <div className="mt-5">
              <label className="sr-only" htmlFor="room-name">Meadow name</label>
              <input id="room-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your meadow name" className="w-full rounded-2xl border-2 border-[#ead5e8] px-4 py-3 text-center font-bold outline-none focus:border-[#b795c8]" />
              <button onClick={joinRoom} disabled={isJoining} className="mt-3 w-full rounded-2xl bg-[#b48ed0] px-4 py-3 font-black text-white shadow-[0_5px_0_#8f6eaa]">{isJoining ? "Entering..." : "Join this room"}</button>
            </div>
          )}
          <Link href="/" className="mt-5 inline-block text-sm font-black text-[#a276a6] underline">Back to the meadow</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8ef] p-6 text-[#5f4e68]">
      <section className="mx-auto max-w-3xl rounded-[2.5rem] border-8 border-white bg-white/75 p-6 shadow-[0_18px_55px_rgba(108,86,122,0.18)] sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a182af]">Private multiplayer meadow</p>
            <h1 className="mt-2 font-[family-name:var(--font-fredoka)] text-4xl font-black">Word Bridge Room</h1>
          </div>
          <button onClick={copyInvite} className="rounded-2xl bg-[#f4d18a] px-4 py-3 text-sm font-black text-[#805e4c] shadow-[0_5px_0_#d9ae65]">Copy invite link</button>
        </div>

        <div className="mt-7 rounded-3xl bg-[#e7f4ec] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-black">Meadow roster</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#66917a]">{players.length}/6 pals · {readyPlayers} ready</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 font-bold">
                <span>{player.display_name}{player.user_id === match.host_user_id ? " ✦ host" : ""}</span>
                <span className={player.ready ? "text-[#5eaa78]" : "text-[#b49da8]"}>{player.ready ? "ready" : "waiting"}</span>
              </div>
            ))}
          </div>
        </div>

        {match.status === "lobby" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setReady(!myPlayer?.ready)} className="rounded-2xl bg-[#b48ed0] px-5 py-3 font-black text-white shadow-[0_5px_0_#8f6eaa]">
              {myPlayer?.ready ? "Not ready yet" : "I am ready!"}
            </button>
            {isHost && <button onClick={startRoom} className="rounded-2xl bg-[#eeac77] px-5 py-3 font-black text-white shadow-[0_5px_0_#c98555]">Start typing round</button>}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-[#f5e3fb] p-5 text-center font-black text-[#84608e]">The shared typing round is starting next!</div>
        )}

        {notice && <p className="mt-5 rounded-2xl bg-[#fff4d9] p-3 text-sm font-semibold text-[#8a6653]">{notice}</p>}
      </section>
    </main>
  );
}
