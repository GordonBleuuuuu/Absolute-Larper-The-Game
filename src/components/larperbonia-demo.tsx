"use client";

import { useEffect, useState } from "react";

const GOAL = 30;

export function LarperboniaDemo() {
  const [carriedCoins, setCarriedCoins] = useState(4);
  const [teamCoins, setTeamCoins] = useState(16);
  const [boosted, setBoosted] = useState(false);
  const [showPia, setShowPia] = useState(false);
  const [message, setMessage] = useState("The bridge needs a few more mooncoins.");

  useEffect(() => {
    if (!boosted) return;

    const timeout = window.setTimeout(() => setBoosted(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [boosted]);

  function gatherCoins() {
    const found = Math.floor(Math.random() * 3) + 1;
    setCarriedCoins((coins) => coins + found);
    setMessage(`You tucked ${found} mooncoin${found === 1 ? "" : "s"} into your pouch.`);
  }

  function depositCoins() {
    if (carriedCoins === 0) {
      setMessage("Your little pouch is empty. Go gather by the fireflies!");
      return;
    }

    const deposited = Math.min(carriedCoins, 5);
    setCarriedCoins((coins) => coins - deposited);
    setTeamCoins((coins) => Math.min(GOAL, coins + deposited));
    setMessage(`${deposited} mooncoins reached the bridge basket. Cozy teamwork!`);
  }

  function trySpeedBloom() {
    setBoosted(true);
    setMessage("A gentle speed bloom is making your slippers sparkle.");
  }

  function triggerPiaPreview() {
    setShowPia(true);
    window.setTimeout(() => setShowPia(false), 2000);
  }

  const progress = Math.round((teamCoins / GOAL) * 100);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8ef] px-4 py-7 text-[#54465b] sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#fed7e2]/70 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#cbe6ff]/80 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-[#fce7ad]/50 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#a995d5] text-2xl shadow-[0_8px_0_#7c6aa8]">
              ✦
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#9f83b7]">
                Moonlit meadow
              </p>
              <h1 className="font-[family-name:var(--font-fredoka)] text-2xl font-black tracking-tight text-[#5a4964] sm:text-3xl">
                Larperbonia Simulator
              </h1>
            </div>
          </div>

          <div className="rounded-full border border-white bg-white/75 px-4 py-2 text-sm font-bold shadow-sm">
            <span className="mr-2 text-[#f0a8ba]">●</span> 3 cozy pals online
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] border-8 border-white bg-[#bce7d5] shadow-[0_18px_55px_rgba(108,86,122,0.18)]">
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[#91cda6]" />
            <div className="absolute left-[10%] top-[14%] h-28 w-28 rounded-full bg-[#d5f3f8] opacity-80 blur-xl" />
            <div className="absolute right-[16%] top-[20%] text-4xl text-[#fff7ba] drop-shadow-[0_0_8px_#fff7ba]">✦</div>
            <div className="absolute left-[20%] top-[31%] text-2xl text-[#fff7ba] drop-shadow-[0_0_8px_#fff7ba]">✦</div>
            <div className="absolute right-[34%] top-[10%] text-xl text-[#fff7ba] drop-shadow-[0_0_8px_#fff7ba]">✦</div>

            <div className="absolute left-[8%] bottom-[20%] h-32 w-32 rounded-full bg-[#5d9876] shadow-[inset_-12px_-10px_0_#498167]" />
            <div className="absolute left-[13%] bottom-[29%] h-20 w-20 rounded-full bg-[#6cab82]" />
            <div className="absolute right-[10%] bottom-[16%] h-36 w-36 rounded-full bg-[#609977] shadow-[inset_-12px_-10px_0_#4b8065]" />
            <div className="absolute right-[17%] bottom-[31%] h-20 w-20 rounded-full bg-[#76ae88]" />

            <div className="absolute left-1/2 top-[42%] h-28 w-[72%] -translate-x-1/2 rounded-[50%] border-y-8 border-[#a06b59] bg-[#e8bd8f] shadow-[0_12px_0_rgba(90,67,71,0.12)]" />
            <div className="absolute left-1/2 top-[51%] h-5 w-[71%] -translate-x-1/2 rounded-full bg-[#cc9477]" />

            <div className="absolute left-[17%] top-[47%] grid h-20 w-20 place-items-center rounded-[2rem] border-4 border-[#f7d88d] bg-[#ffca64] text-4xl shadow-[0_8px_0_#d69e45]">
              🧺
            </div>
            <p className="absolute left-[10%] top-[65%] rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#8a6a79] shadow-sm">
              Bridge basket
            </p>

            <div className={`absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 transition-transform ${boosted ? "scale-125 -translate-y-12" : ""}`}>
              <div className="relative grid h-24 w-24 place-items-center rounded-[2.1rem] border-4 border-white bg-[#f6a9b9] text-5xl shadow-[0_10px_0_#c87690]">
                🐰
                <span className="absolute -bottom-8 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm">
                  You {boosted ? "— speedy!" : "— little larper"}
                </span>
              </div>
            </div>

            <div className="absolute right-[20%] top-[48%] grid h-18 w-18 place-items-center rounded-3xl border-4 border-white bg-[#ac9ee1] p-3 text-3xl shadow-[0_8px_0_#7f75b5]">
              🐸
            </div>
            <div className="absolute bottom-8 left-1/2 w-[min(92%,540px)] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/85 px-5 py-4 text-center text-sm font-bold shadow-lg backdrop-blur">
              {message}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border-4 border-white bg-[#fffdf8] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-[#89718e]">Build the bridge</p>
                <span className="rounded-full bg-[#fae9af] px-3 py-1 text-xs font-black text-[#8e7050]">
                  {teamCoins}/{GOAL}
                </span>
              </div>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#eee4dd]">
                <div className="h-full rounded-full bg-linear-to-r from-[#f6b4c2] via-[#e6a7d3] to-[#a79ddd] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#9c879a]">
                Gather mooncoins and gently drop them into the basket.
              </p>
            </section>

            <section className="rounded-[2rem] border-4 border-white bg-[#dff2fc] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#7295ae]">Your pouch</p>
                  <p className="mt-1 text-3xl font-black text-[#5f7e97]">{carriedCoins} <span className="text-lg">☾</span></p>
                </div>
                <span className="text-4xl">👜</span>
              </div>
              <button onClick={gatherCoins} className="mt-4 w-full rounded-2xl bg-[#91b9d8] px-4 py-3 font-black text-white shadow-[0_5px_0_#6d95b6] transition hover:-translate-y-0.5 hover:bg-[#7eabc9] active:translate-y-1 active:shadow-none">
                Gather mooncoins
              </button>
              <button onClick={depositCoins} className="mt-3 w-full rounded-2xl bg-[#f3b36e] px-4 py-3 font-black text-white shadow-[0_5px_0_#cb8e52] transition hover:-translate-y-0.5 hover:bg-[#e9a661] active:translate-y-1 active:shadow-none">
                Deposit up to 5
              </button>
            </section>

            <section className="rounded-[2rem] border-4 border-white bg-[#f3e5fb] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
              <p className="text-sm font-black text-[#806896]">Kindness kit</p>
              <button onClick={trySpeedBloom} className="mt-3 w-full rounded-2xl bg-[#b59bd4] px-4 py-3 font-black text-white shadow-[0_5px_0_#9079ae] transition hover:-translate-y-0.5 hover:bg-[#a98bc9] active:translate-y-1 active:shadow-none">
                Send speed bloom ✿
              </button>
              <button onClick={triggerPiaPreview} className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#c7a8d2] bg-white/60 px-4 py-2 text-xs font-bold text-[#9776a4] transition hover:bg-white">
                Test celebration overlay
              </button>
            </section>
          </aside>
        </div>
      </section>

      {showPia && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#b152a4]/45 p-6 backdrop-blur-sm">
          <div className="animate-pulse rounded-[3rem] border-8 border-white bg-[#ffe77b] px-10 py-12 text-center shadow-[0_0_80px_25px_rgba(255,244,167,0.9)]">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#d67fae]">Meadow mastery</p>
            <p className="mt-3 font-[family-name:var(--font-fredoka)] text-5xl font-black leading-none text-[#bc4f98] sm:text-7xl">
              Absolute Pia
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
