"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RoomResponse = { match_id?: string };

export function MultiplayerLobby() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [notice, setNotice] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (active) setIsSignedIn(Boolean(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  function validateName() {
    if (displayName.trim().length < 2) {
      setNotice("Choose a meadow name with at least two letters.");
      return false;
    }

    if (!isSignedIn) {
      setNotice("Use the email box in the header first, then return here.");
      return false;
    }

    return true;
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateName()) return;

    setIsWorking(true);
    const { data, error } = await supabase.rpc("create_typing_room", {
      p_display_name: displayName.trim(),
    });
    setIsWorking(false);

    const response = data as RoomResponse | null;
    if (error || !response?.match_id) {
      setNotice(error?.message ?? "The meadow could not make a room just yet.");
      return;
    }

    router.push(`/room/${response.match_id}`);
  }

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateName()) return;

    const roomReference = roomId.trim();
    const isUuid = /^[0-9a-f-]{36}$/i.test(roomReference);
    const isShortCode = /^[a-z0-9]{6}$/i.test(roomReference);
    if (!isUuid && !isShortCode) {
      setNotice("Paste a six-character invite code or full room ID.");
      return;
    }

    setIsWorking(true);
    const { data, error } = isUuid
      ? await supabase.rpc("join_typing_room", { p_match_id: roomReference, p_display_name: displayName.trim() })
      : await supabase.rpc("join_typing_room_by_code", { p_room_code: roomReference, p_display_name: displayName.trim() });
    setIsWorking(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    const response = data as RoomResponse | null;
    router.push(`/room/${response?.match_id ?? roomReference}`);
  }

  return (
    <section className="rounded-[2rem] border-4 border-white bg-[#fff4d9] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
      <p className="text-sm font-black text-[#8a6653]">Multiplayer meadow</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#aa8878]">Create a private room, invite friends, and ready up together.</p>

      <label className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-[#a47a69]" htmlFor="display-name">Meadow name</label>
      <input
        id="display-name"
        value={displayName}
        maxLength={32}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="e.g. MoonBunny"
        className="mt-2 w-full rounded-2xl border-2 border-[#f1d6bd] bg-white/80 px-3 py-2 text-sm font-bold text-[#765a63] outline-none focus:border-[#d8a987]"
      />

      <form onSubmit={createRoom}>
        <button disabled={isWorking} className="mt-3 w-full rounded-2xl bg-[#e7a972] px-4 py-3 font-black text-white shadow-[0_5px_0_#bd8253] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-70">
          Create a room ✦
        </button>
      </form>

      <div className="my-4 border-t border-dashed border-[#e7c8af]" />

      <form onSubmit={joinRoom}>
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-[#a47a69]" htmlFor="room-id">Join with invite code</label>
        <input
          id="room-id"
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          placeholder="e.g. A1B2C3"
          className="mt-2 w-full rounded-2xl border-2 border-[#f1d6bd] bg-white/80 px-3 py-2 text-xs font-bold text-[#765a63] outline-none focus:border-[#d8a987]"
        />
        <button disabled={isWorking} className="mt-3 w-full rounded-2xl border-2 border-[#dca576] bg-white/70 px-4 py-2.5 text-sm font-black text-[#a76e45] transition hover:bg-white disabled:cursor-wait disabled:opacity-70">
          Join room
        </button>
      </form>

      {notice && <p className="mt-3 rounded-xl bg-white/75 p-2 text-xs font-semibold text-[#8a6653]">{notice}</p>}
    </section>
  );
}
