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

/** The shared AudioContext (created lazily). Music and sound effects use the same one. */
export const audio = () => {
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

let noiseBuffer: AudioBuffer | null = null;
const noise = (a: AudioContext) => {
    if (!noiseBuffer || noiseBuffer.sampleRate !== a.sampleRate) {
        noiseBuffer = a.createBuffer(1, Math.ceil(a.sampleRate * 0.5), a.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
};

/**
 * A small reverb + echo "space" for sound effects that should ring out (the letter bells).
 * Built once per AudioContext. Same character as the music's bell sends, just lighter.
 */
let space: { ctx: AudioContext; input: GainNode } | null = null;
const fxSpace = (a: AudioContext) => {
    if (space?.ctx === a) return space.input;
    const input = a.createGain();
    // Reverb: 1.4s decaying-noise impulse, darkened.
    const ir = a.createBuffer(2, Math.ceil(a.sampleRate * 1.4), a.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    const conv = a.createConvolver();
    conv.buffer = ir;
    const verb = a.createGain();
    verb.gain.value = 0.5;
    const tone = a.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 3200;
    input.connect(conv).connect(tone).connect(verb).connect(a.destination);
    // Echo: a couple of soft repeats.
    const dl = a.createDelay(1);
    dl.delayTime.value = 0.21;
    const fb = a.createGain();
    fb.gain.value = 0.25;
    const echo = a.createGain();
    echo.gain.value = 0.35;
    input.connect(dl).connect(fb).connect(dl);
    dl.connect(echo).connect(a.destination);
    space = { ctx: a, input };
    return input;
};

/** Notes the letter bells climb through: A C D E G A (D minor pentatonic, the music's key). */
const LETTER_BELLS = [69, 72, 74, 76, 79, 81];

/** The music's cool-down "xylophone" bell: a sine strike with a faint metallic overtone. */
const bellStrike = (a: AudioContext, midi: number, t: number, peak = 0.07) => {
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const body = a.createOscillator();
    body.frequency.value = freq;
    body.connect(g);
    const shimmer = a.createOscillator();
    shimmer.frequency.value = freq * 3.01;
    const sg = a.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.3, t + 0.002);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    shimmer.connect(sg).connect(g);
    g.connect(a.destination);
    const send = a.createGain();
    send.gain.value = 0.8;
    g.connect(send).connect(fxSpace(a));
    for (const o of [body, shimmer]) {
        o.start(t);
        o.stop(t + 1);
    }
};

/**
 * Quick "schwift": a band-passed noise sweep that rises and snaps shut, then a bass thump
 * and a bell note where the letter lands. `step` moves the pitch up so a sequence climbs.
 * Skipped (not queued) if the browser hasn't allowed audio yet, so it never plays late.
 */
export const swoosh = (step = 0, delay = 0) => {
    if (!enabled) return;
    const a = audio();
    if (!a || a.state !== "running") return;
    const t0 = a.currentTime + delay;
    const len = 0.17;
    const lift = 1 + step * 0.09;

    const src = a.createBufferSource();
    src.buffer = noise(a);
    const band = a.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.6;
    band.frequency.setValueAtTime(700 * lift, t0);
    band.frequency.exponentialRampToValueAtTime(5200 * lift, t0 + len);
    const v = a.createGain();
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.exponentialRampToValueAtTime(0.22, t0 + len * 0.7);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    src.connect(band).connect(v).connect(a.destination);
    src.start(t0, Math.random() * 0.25);
    src.stop(t0 + len + 0.02);

    // Landing thump: a short sine that drops in pitch, like a soft kick drum.
    const tLand = t0 + len - 0.01;
    const thumpLen = 0.16;
    const bass = a.createOscillator();
    bass.type = "sine";
    bass.frequency.setValueAtTime(130 * (1 + step * 0.03), tLand);
    bass.frequency.exponentialRampToValueAtTime(48, tLand + thumpLen);
    const bv = a.createGain();
    bv.gain.setValueAtTime(0.0001, tLand);
    bv.gain.exponentialRampToValueAtTime(0.35, tLand + 0.008);
    bv.gain.exponentialRampToValueAtTime(0.0001, tLand + thumpLen);
    bass.connect(bv).connect(a.destination);
    bass.start(tLand);
    bass.stop(tLand + thumpLen + 0.02);

    // Bell note on the landing, climbing with each letter.
    bellStrike(a, LETTER_BELLS[Math.min(step, LETTER_BELLS.length - 1)], tLand);
};

export const sfx = {
    /** Warm up the audio context inside a click handler. */
    unlock: () => void audio(),
    drop: () => tone(300, 0.08, "sine", 0.04),
    peg: (row: number) => tone(520 + row * 55, 0.05, "triangle", 0.035),
    land: (big: boolean) => (big ? [523, 659, 784, 1047] : [659, 880]).forEach((n, i) => tone(n, 0.25, "square", 0.03, i * 0.07)),
    click: () => tone(440, 0.06, "triangle", 0.03),
    letterIn: (index: number) => swoosh(index),
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

export const isSoundEnabled = () => enabled;
export const subscribeSound = (listener: () => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
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
