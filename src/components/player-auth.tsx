"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PlayerAuth() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [playerEmail, setPlayerEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlayer() {
      const { data } = await supabase.auth.getUser();
      if (active) setPlayerEmail(data.user?.email ?? null);
    }

    void loadPlayer();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setPlayerEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setNotice("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setIsSending(false);
    setNotice(error ? error.message : "Magic link sent — check your inbox to enter the meadow.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setNotice("You left the meadow safely.");
  }

  if (playerEmail) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white bg-white/75 py-1 pl-3 pr-1 text-xs font-bold shadow-sm">
        <span className="max-w-28 truncate text-[#74617b]">{playerEmail}</span>
        <button onClick={signOut} className="rounded-full bg-[#e7d8ef] px-3 py-1.5 text-[#745882] transition hover:bg-[#dac1e7]">
          Leave
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <form onSubmit={sendMagicLink} className="flex items-center gap-2 rounded-2xl border border-white bg-white/75 p-1 shadow-sm">
        <label className="sr-only" htmlFor="player-email">Email address</label>
        <input
          id="player-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email for multiplayer"
          className="min-w-0 bg-transparent px-2 py-1.5 text-xs font-semibold text-[#69566f] outline-none placeholder:text-[#ad98b0] sm:w-44"
        />
        <button disabled={isSending} className="rounded-xl bg-[#a995d5] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#9780c6] disabled:cursor-wait disabled:opacity-70">
          {isSending ? "Sending..." : "Join"}
        </button>
      </form>
      {notice && <p className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white/95 p-2 text-right text-[11px] font-semibold text-[#806896] shadow-lg">{notice}</p>}
    </div>
  );
}
