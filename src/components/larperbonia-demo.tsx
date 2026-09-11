"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

const WORDS = [
  "moss",
  "lantern",
  "firefly",
  "moonbeam",
  "teacup",
  "petal",
  "cozy",
  "starlight",
  "meadow",
  "cloudberry",
];

const GOAL = 50;
const COMBO_TRIGGER = 5;
const PLANK_COUNT = 10;

export function LarperboniaDemo() {
  const [wordIndex, setWordIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [teamCoins, setTeamCoins] = useState(16);
  const [combo, setCombo] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [boosted, setBoosted] = useState(false);
  const [showPia, setShowPia] = useState(false);
  const [message, setMessage] = useState("Type the glowing meadow word to gather mooncoins.");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWord = WORDS[wordIndex];
  const progress = Math.min(100, Math.round((teamCoins / GOAL) * 100));
  const planksBuilt = Math.min(
    PLANK_COUNT,
    Math.floor((teamCoins / GOAL) * PLANK_COUNT),
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeWord]);

  useEffect(() => {
    if (!boosted) return;

    const timeout = window.setTimeout(() => setBoosted(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [boosted]);

  function celebrateCombo(nextCombo: number) {
    if (nextCombo % COMBO_TRIGGER !== 0) return;

    setShowPia(true);
    window.setTimeout(() => setShowPia(false), 2000);
  }

  function handleTyping(event: ChangeEvent<HTMLInputElement>) {
    const nextTyped = event.target.value.toLowerCase().replace(/[^a-z]/g, "");

    if (!activeWord.startsWith(nextTyped)) {
      setMistakes((count) => count + 1);
      setMessage("A firefly bonked the wrong letter. Try that bit again!");
      return;
    }

    setTyped(nextTyped);

    if (nextTyped !== activeWord) return;

    const earned = Math.max(2, Math.ceil(activeWord.length / 3));
    const nextCombo = combo + 1;

    setTeamCoins((coins) => Math.min(GOAL, coins + earned));
    setCombo(nextCombo);
    setWordsCompleted((count) => count + 1);
    setMessage(`Perfect! ${earned} mooncoins floated into the bridge basket.`);
    setTyped("");
    setWordIndex((index) => (index + 1) % WORDS.length);
    celebrateCombo(nextCombo);
  }

  function useFocusBloom() {
    setBoosted(true);
    setMessage("Focus Bloom active — your next word is sparkling extra brightly.");
    inputRef.current?.focus();
  }

  function resetRound() {
    setWordIndex(0);
    setTyped("");
    setTeamCoins(16);
    setCombo(0);
    setWordsCompleted(0);
    setMistakes(0);
    setShowPia(false);
    setMessage("Fresh meadow, fresh bridge. Type the glowing word to begin!");
    inputRef.current?.focus();
  }

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
            <span className="mr-2 text-[#f0a8ba]">●</span> Word Bridge practice
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

            <div
              aria-label={`${planksBuilt} of ${PLANK_COUNT} bridge planks built`}
              className="absolute left-1/2 top-[43%] h-32 w-[76%] -translate-x-1/2"
              role="img"
            >
              <div className="absolute left-0 right-0 top-5 h-2 rounded-full bg-[#9b6959]" />
              <div className="absolute left-0 right-0 bottom-6 h-2 rounded-full bg-[#9b6959]" />
              <div className="relative flex h-full items-center gap-1.5 px-1 pt-2">
                {Array.from({ length: PLANK_COUNT }, (_, index) => {
                  const isBuilt = index < planksBuilt;

                  return (
                    <div
                      className={`h-16 flex-1 rounded-xl border-4 transition-all duration-500 ${
                        isBuilt
                          ? "scale-100 border-[#9e674f] bg-[#e9bd88] shadow-[0_7px_0_#b77d63]"
                          : "scale-75 border-dashed border-[#8fbea2]/70 bg-white/25 opacity-45"
                      }`}
                      key={index}
                    />
                  );
                })}
              </div>
            </div>

            <div className="absolute left-[17%] top-[47%] grid h-20 w-20 place-items-center rounded-[2rem] border-4 border-[#f7d88d] bg-[#ffca64] text-4xl shadow-[0_8px_0_#d69e45]">
              🧺
            </div>
            <p className="absolute left-[10%] top-[65%] rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#8a6a79] shadow-sm">
              Bridge basket · {planksBuilt}/{PLANK_COUNT} planks
            </p>

            <div className={`absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 transition-transform ${boosted ? "scale-125 -translate-y-12" : ""}`}>
              <div className="relative grid h-24 w-24 place-items-center rounded-[2.1rem] border-4 border-white bg-[#f6a9b9] text-5xl shadow-[0_10px_0_#c87690]">
                🐰
                <span className="absolute -bottom-8 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm">
                  You {boosted ? "— focused!" : "— little larper"}
                </span>
              </div>
            </div>

            <div className="absolute right-[20%] top-[48%] grid h-18 w-18 place-items-center rounded-3xl border-4 border-white bg-[#ac9ee1] p-3 text-3xl shadow-[0_8px_0_#7f75b5]">
              🐸
            </div>

            <div className="absolute bottom-8 left-1/2 w-[min(92%,560px)] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a57a9f]">Type this meadow word</p>
              <div className="mt-2 flex justify-center gap-1 text-3xl font-black tracking-[0.12em] text-[#6e5880] sm:text-4xl">
                {activeWord.split("").map((letter, index) => (
                  <span key={`${letter}-${index}`} className={index < typed.length ? "text-[#ef9aad]" : ""}>
                    {letter}
                  </span>
                ))}
              </div>
              <label className="sr-only" htmlFor="word-input">Type the word {activeWord}</label>
              <input
                ref={inputRef}
                id="word-input"
                value={typed}
                onChange={handleTyping}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                className="mt-4 w-full rounded-2xl border-2 border-[#dfc3e5] bg-[#fffafc] px-4 py-3 text-center text-lg font-black tracking-[0.12em] text-[#6b557c] outline-none transition focus:border-[#b993ce] focus:ring-4 focus:ring-[#e8cfee]/70"
                placeholder="type here..."
              />
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
                Every correctly typed word sends mooncoins to the basket.
              </p>
            </section>

            <section className="rounded-[2rem] border-4 border-white bg-[#dff2fc] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#7295ae]">Typing garden</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/75 p-3 text-center">
                  <p className="text-2xl font-black text-[#5f7e97]">{combo}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#829fb3]">Combo</p>
                </div>
                <div className="rounded-2xl bg-white/75 p-3 text-center">
                  <p className="text-2xl font-black text-[#5f7e97]">{wordsCompleted}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#829fb3]">Words</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-[#7295ae]">Little bumps: {mistakes}</p>
            </section>

            <section className="rounded-[2rem] border-4 border-white bg-[#f3e5fb] p-5 shadow-[0_15px_35px_rgba(108,86,122,0.12)]">
              <p className="text-sm font-black text-[#806896]">Kindness kit</p>
              <button onClick={useFocusBloom} className="mt-3 w-full rounded-2xl bg-[#b59bd4] px-4 py-3 font-black text-white shadow-[0_5px_0_#9079ae] transition hover:-translate-y-0.5 hover:bg-[#a98bc9] active:translate-y-1 active:shadow-none">
                Focus bloom ✿
              </button>
              <button onClick={resetRound} className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#c7a8d2] bg-white/60 px-4 py-2 text-xs font-bold text-[#9776a4] transition hover:bg-white">
                Restart practice round
              </button>
            </section>
          </aside>
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-sm font-semibold text-[#947c93]">{message}</p>
      </section>

      {showPia && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#b152a4]/45 p-6 backdrop-blur-sm">
          <div className="animate-pulse rounded-[3rem] border-8 border-white bg-[#ffe77b] px-10 py-12 text-center shadow-[0_0_80px_25px_rgba(255,244,167,0.9)]">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-[#d67fae]">Five-word streak</p>
            <p className="mt-3 font-[family-name:var(--font-fredoka)] text-5xl font-black leading-none text-[#bc4f98] sm:text-7xl">
              Absolute Pia
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
