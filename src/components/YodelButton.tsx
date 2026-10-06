"use client";

import { useRef, useState } from "react";

// Purely-for-fun button: synthesizes a little alpine yodel in the browser —
// a voice-ish tone (sawtooth through vowel formant filters) with vibrato and
// the characteristic chest↔falsetto octave leaps. No audio files, works offline.

type Vowel = [number, number]; // [F1, F2] formant frequencies
const O: Vowel = [500, 900];
const A: Vowel = [700, 1150];
const AY: Vowel = [600, 1900];
const EE: Vowel = [300, 2300];
const OO: Vowel = [350, 820];

// [startOffset, freq, duration, vowel, falsetto]
const MELODY: [number, number, number, Vowel, boolean][] = [
  [0.0, 392, 0.22, O, false], // G4  "yo"
  [0.24, 523, 0.16, EE, false], // C5  "del"
  [0.42, 330, 0.18, A, false], // E4  "ay"
  [0.62, 784, 0.26, EE, true], // G5  "ee"  (falsetto leap)
  [0.92, 587, 0.2, OO, true], // D5  "oo"
  [1.14, 392, 0.24, O, false], // G4
  [1.46, 440, 0.2, O, false], // A4
  [1.68, 587, 0.16, EE, false], // D5
  [1.86, 349, 0.18, A, false], // F4
  [2.06, 880, 0.28, EE, true], // A5  (falsetto leap)
  [2.38, 659, 0.22, OO, true], // E5
  [2.62, 523, 0.36, O, false], // C5  (resolve)
];

export function YodelButton() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  function playNote(
    ctx: AudioContext,
    t: number,
    freq: number,
    dur: number,
    [f1, f2]: Vowel,
    falsetto: boolean,
  ) {
    const osc = ctx.createOscillator();
    osc.type = falsetto ? "sine" : "sawtooth";
    osc.frequency.setValueAtTime(freq, t);

    // vibrato
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = falsetto ? 6.5 : 5.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * (falsetto ? 0.02 : 0.012);
    lfo.connect(lfoGain).connect(osc.frequency);

    // vowel formants
    const b1 = ctx.createBiquadFilter();
    b1.type = "bandpass";
    b1.frequency.value = f1;
    b1.Q.value = 9;
    const b2 = ctx.createBiquadFilter();
    b2.type = "bandpass";
    b2.frequency.value = f2;
    b2.Q.value = 11;

    const mix = ctx.createGain();
    osc.connect(b1).connect(mix);
    osc.connect(b2).connect(mix);
    if (falsetto) {
      const direct = ctx.createGain();
      direct.gain.value = 0.5;
      osc.connect(direct).connect(mix);
    }

    // amplitude envelope
    const amp = ctx.createGain();
    const peak = falsetto ? 0.16 : 0.2;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(peak, t + 0.03);
    amp.gain.setValueAtTime(peak, t + dur * 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    mix.connect(amp).connect(ctx.destination);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }

  function yodel() {
    if (playing) return;
    setPlaying(true);
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = ctxRef.current ?? new AC();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const t0 = ctx.currentTime + 0.06;
      let end = 0;
      for (const [t, f, d, vowel, falsetto] of MELODY) {
        playNote(ctx, t0 + t, f, d, vowel, falsetto);
        end = Math.max(end, t + d);
      }
      window.setTimeout(() => setPlaying(false), (end + 0.4) * 1000);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <button
      onClick={yodel}
      disabled={playing}
      aria-label="Play a yodel"
      className="rounded-full border border-clay/40 px-4 py-2 text-sm text-pine transition hover:bg-sand/60 disabled:opacity-70"
    >
      {playing ? "🎶 Yodel-ay-ee-oo…" : "🏔️ Yodel!"}
    </button>
  );
}
