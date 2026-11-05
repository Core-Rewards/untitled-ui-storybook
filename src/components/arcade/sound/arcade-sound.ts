import { useSyncExternalStore } from "react";

/**
 * Tiny synthesized sound kit (Web Audio, no files), ported from the prototype.
 * Audio only starts after a user gesture (browser rule), which every play is.
 * The on/off choice is remembered per browser.
 */

const STORAGE_KEY = "arcade-sound";
let enabled = (() => {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
})();
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

const audio = () => {
    if (!ctx) {
        try {
            const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            ctx = new Ctor();
        } catch {
            ctx = null;
        }
    }
    if (ctx?.state === "suspended") void ctx.resume();
    return ctx;
};

export const tone = (freq: number, duration: number, type: OscillatorType = "sine", gain = 0.05, delay = 0) => {
    if (!enabled) return;
    const a = audio();
    if (!a) return;
    const o = a.createOscillator();
    const v = a.createGain();
    const t0 = a.currentTime + delay;
    o.type = type;
    o.frequency.value = freq;
    v.gain.setValueAtTime(gain, t0);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    o.connect(v).connect(a.destination);
    o.start(t0);
    o.stop(t0 + duration + 0.02);
};

export const sfx = {
    /** Warm up the audio context inside a click handler. */
    unlock: () => void audio(),
    drop: () => tone(300, 0.08, "sine", 0.04),
    peg: (row: number) => tone(520 + row * 55, 0.05, "triangle", 0.035),
    land: (big: boolean) => (big ? [523, 659, 784, 1047] : [659, 880]).forEach((n, i) => tone(n, 0.25, "square", 0.03, i * 0.07)),
    click: () => tone(440, 0.06, "triangle", 0.03),
};

export const setSoundEnabled = (on: boolean) => {
    enabled = on;
    try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
        /* storage unavailable: keep in memory */
    }
    listeners.forEach((l) => l());
};

export const useSoundEnabled = () =>
    useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => enabled,
        () => true,
    );
