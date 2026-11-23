import { useEffect } from "react";
import { audio, isSoundEnabled, subscribeSound } from "./arcade-sound";

/**
 * "Neon Afterhours": the Arcade's background loop, synthesized live with Web Audio (no files).
 *
 * Punchy synthwave at 108 BPM in D minor, with a touch of swing. One loop is 32 bars (~71s)
 * in four 8-bar sections, so it builds and then settles instead of staying hyped:
 *   A  "doors open"   opens with the ARCADE letters' bell run, then builds fast: chord stabs,
 *                     8th-note bass, kick, hats and a chip arpeggio from bar 1; 8th hats at bar 3;
 *                     backbeat, rolling 16th bass and 16th arp at bar 5
 *   B  "lights up"    everything at full strength, extra stab pushing into each bar, bouncy bell hook
 *   C  "high score"   + gliding pulse lead (bells sparkle an octave above its long notes), offbeat
 *                     stabs, octave-jumping bass, 16th hats (the peak)
 *   D  "cool down"    stabs and snare drop out for a soft triangle chord, sub bass and bell melody
 *
 * The bell (a sine "xylophone" with a metallic overtone) is the theme's signature sound; the
 * same run plays when the ARCADE letters land on the Enter screen (see arcade-sound.ts).
 *
 * Synths: saw/pulse chord stabs, a squelchy sequencer bass, a 12.5% pulse "chip" arpeggio
 * and a 25% pulse lead, so it sounds like an arcade cabinet run through a synthwave rig.
 *
 * Chords (2 bars each): Dm9 | Bbmaj9 | Gm9 | A7sus4 > A7
 *
 * One shared player: every screen asks for it with `useArcadeMusic()`, so moving between
 * screens (or routes) keeps the loop playing without restarting. It follows the arcade
 * sound toggle, pauses while the tab is hidden, and waits for the first click/tap/key
 * when the browser hasn't allowed audio yet.
 */

const BPM = 108;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const BAR = 16;
const LOOP_BARS = 32;
const SWING = 0.08; // delay on off-beat 16ths, as a share of a 16th
const LOOKAHEAD_S = 0.2;
const TICK_MS = 50;
const VOLUME = 0.32;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Two bars per chord. `pad` is the voicing, `bass` the root. A7sus4 resolves to A7 in its second bar. */
const CHORDS: { pad: number[]; bass: number }[] = [
    { pad: [53, 57, 60, 64], bass: 38 }, // Dm9      F A C E  / D
    { pad: [53, 57, 60, 62], bass: 34 }, // Bbmaj9   F A C D  / Bb
    { pad: [53, 57, 58, 62], bass: 31 }, // Gm9      F A Bb D / G
    { pad: [52, 55, 57, 62], bass: 33 }, // A7sus4   E G A D  / A
];
const A7 = [52, 55, 57, 61]; // E G A C#

const chordAt = (bar: number) => {
    const c = CHORDS[Math.floor((bar % 8) / 2)];
    return bar % 8 === 7 ? { ...c, pad: A7 } : c;
};

/** Lead melody over 8 bars: [16th step, midi note, length in 16ths]. */
const MELODY: [number, number, number][] = [
    [4, 69, 2],
    [6, 72, 2],
    [8, 74, 6],
    [14, 72, 2],
    [16, 76, 8],
    [24, 74, 4],
    [28, 72, 4],
    [32, 74, 6],
    [38, 72, 2],
    [40, 69, 8],
    [48, 65, 4],
    [52, 67, 4],
    [56, 69, 8],
    [64, 70, 6],
    [70, 69, 2],
    [72, 67, 4],
    [76, 69, 4],
    [80, 74, 12],
    [92, 77, 4],
    [96, 76, 8],
    [104, 74, 4],
    [108, 76, 4],
    [112, 73, 12],
    [124, 69, 4],
];

/** Bell countermelody for the cool-down: long, sparse notes. */
/** The ARCADE letters' run (A C D E G A), as 16ths at the top of section A. */
const BELL_RUN = [69, 72, 74, 76, 79, 81];

/**
 * Section B bell hook, per bar: [step, index into the chord's bell tones (2 octaves, low to high)].
 * The first bar of each chord bounces in the stabs' 3+3+2 rhythm, the second answers more sparsely.
 */
const BELL_HOOK: [number, number][][] = [
    [
        [0, 4],
        [3, 2],
        [6, 4],
        [10, 6],
        [12, 5],
    ],
    [
        [2, 6],
        [8, 4],
        [11, 3],
        [14, 2],
    ],
];

const BELLS: [number, number][] = [
    [0, 76],
    [12, 72],
    [16, 74],
    [32, 77],
    [44, 74],
    [48, 72],
    [64, 74],
    [76, 70],
    [80, 69],
    [96, 76],
    [108, 74],
    [112, 73],
];

/** Arpeggio order over the chord tones across two octaves (8 notes), one entry per 16th. */
const ARP = [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 4, 3, 1];

type Section = "A" | "B" | "C" | "D";
const sectionAt = (bar: number): Section => (["A", "B", "C", "D"] as const)[Math.floor(bar / 8) % 4];

/** Filter brightness per section, so the loop opens up and closes again. */
const BRIGHTNESS: Record<Section, number> = {
    A: 1500,
    B: 1800,
    C: 2500,
    D: 1000,
};

interface Rig {
    ctx: AudioContext;
    master: GainNode;
    music: GainNode; // dry bus into master
    reverb: GainNode; // send
    delay: GainNode; // send
    noise: AudioBuffer;
    pulse12: PeriodicWave; // thin 8-bit pulse
    pulse25: PeriodicWave; // classic chiptune pulse
}

/** Band-limited pulse wave with the given duty cycle (0.5 = square). */
const pulseWave = (ctx: AudioContext, duty: number) => {
    const real = new Float32Array(64);
    const imag = new Float32Array(64);
    for (let k = 1; k < 64; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(real, imag);
};

let rig: Rig | null = null;

const buildRig = (ctx: AudioContext): Rig => {
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);

    const music = ctx.createGain();
    music.connect(master);

    // Reverb: a generated 1.6s decaying-noise impulse, darkened.
    const ir = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 1.6), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const reverb = ctx.createGain();
    reverb.gain.value = 0.55;
    const verbTone = ctx.createBiquadFilter();
    verbTone.type = "lowpass";
    verbTone.frequency.value = 3200;
    reverb.connect(conv).connect(verbTone).connect(master);

    // Delay: dotted 8th, with a darkening filter in the feedback path.
    const delay = ctx.createGain();
    const dl = ctx.createDelay(2);
    dl.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.22;
    const fbTone = ctx.createBiquadFilter();
    fbTone.type = "lowpass";
    fbTone.frequency.value = 2400;
    delay.connect(dl).connect(fbTone).connect(fb).connect(dl);
    fbTone.connect(master);
    fbTone.connect(reverb);

    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    return { ctx, master, music, reverb, delay, noise, pulse12: pulseWave(ctx, 0.125), pulse25: pulseWave(ctx, 0.25) };
};

/** Gain envelope node: quick attack, hold, release. */
const env = (r: Rig, t: number, peak: number, attack: number, hold: number, release: number) => {
    const g = r.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    return g;
};

const send = (r: Rig, node: AudioNode, dry = 1, verb = 0, echo = 0) => {
    const tap = (dest: AudioNode, amount: number) => {
        if (amount <= 0) return;
        const g = r.ctx.createGain();
        g.gain.value = amount;
        node.connect(g).connect(dest);
    };
    tap(r.music, dry);
    tap(r.reverb, verb);
    tap(r.delay, echo);
};

const osc = (r: Rig, type: OscillatorType | PeriodicWave, freq: number, t: number, end: number, detune = 0) => {
    const o = r.ctx.createOscillator();
    if (typeof type === "string") o.type = type;
    else o.setPeriodicWave(type);
    o.frequency.value = freq;
    o.detune.value = detune;
    o.start(t);
    o.stop(end);
    return o;
};

// ---------- Instruments ----------

/** Syncopated chord stab: detuned saws plus a pulse, with a fast filter "pluck". */
const stab = (r: Rig, notes: number[], t: number, cutoff: number, level: number) => {
    const lp = r.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 2.5;
    lp.frequency.setValueAtTime(cutoff * 2.2, t);
    lp.frequency.exponentialRampToValueAtTime(cutoff * 0.45, t + 0.18);
    const g = env(r, t, 0.032 * level, 0.003, 0.04, 0.16);
    const end = t + 0.25;
    for (const n of notes) {
        osc(r, "sawtooth", hz(n), t, end, -10).connect(lp);
        osc(r, "sawtooth", hz(n), t, end, 10).connect(lp);
        osc(r, r.pulse25, hz(n + 12), t, end).connect(lp);
    }
    lp.connect(g);
    send(r, g, 0.9, 0.3, 0.35);
};

/** Soft triangle chord, only in the cool-down, so that section breathes. */
const glow = (r: Rig, notes: number[], t: number, dur: number) => {
    const g = env(r, t, 0.03, 0.3, Math.max(0, dur - 0.3), 0.5);
    for (const n of notes) {
        osc(r, "triangle", hz(n), t, t + dur + 0.6, -6).connect(g);
        osc(r, "triangle", hz(n), t, t + dur + 0.6, 6).connect(g);
    }
    send(r, g, 1, 0.6);
};

/** Rolling sequencer bass: a short saw with a squelchy filter blip, plus a sine sub for weight. */
const seqBass = (r: Rig, midi: number, t: number, accent: number) => {
    const lp = r.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 7;
    lp.frequency.setValueAtTime(300 + 1100 * accent, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + 0.09);
    const g = env(r, t, 0.13 * (0.6 + 0.4 * accent), 0.003, 0.03, 0.08);
    osc(r, "sawtooth", hz(midi), t, t + 0.14).connect(lp);
    const sub = r.ctx.createGain();
    sub.gain.value = 0.9;
    osc(r, "sine", hz(midi), t, t + 0.14)
        .connect(sub)
        .connect(lp);
    lp.connect(g);
    send(r, g, 1);
};

/** Long, round sub notes for the cool-down. */
const subBass = (r: Rig, midi: number, t: number, len: number, level: number) => {
    const dur = len * STEP;
    const g = env(r, t, 0.2 * level, 0.01, Math.max(0, dur - 0.1), 0.1);
    osc(r, "sine", hz(midi), t, t + dur + 0.15).connect(g);
    const top = r.ctx.createGain();
    top.gain.value = 0.25;
    osc(r, "triangle", hz(midi + 12), t, t + dur + 0.15)
        .connect(top)
        .connect(g);
    send(r, g, 1);
};

/** 8-bit style arpeggio: a thin 12.5% pulse, very short, into the echo. */
const chipArp = (r: Rig, midi: number, t: number, level: number) => {
    const g = env(r, t, 0.022 * level, 0.002, 0.015, 0.06);
    osc(r, r.pulse12, hz(midi), t, t + 0.1).connect(g);
    send(r, g, 0.8, 0.15, 0.45);
};

/** Pulse lead that glides from the previous note, with vibrato swelling in. */
let lastLead = 0;
const lead = (r: Rig, midi: number, t: number, len: number) => {
    const dur = Math.min(len, 6) * STEP; // long melody notes are clipped so the lead stays punchy
    const from = lastLead || midi;
    lastLead = midi;
    const vib = r.ctx.createOscillator();
    vib.frequency.value = 5.5;
    const vibDepth = r.ctx.createGain();
    vibDepth.gain.setValueAtTime(0, t);
    vibDepth.gain.linearRampToValueAtTime(12, t + Math.min(0.3, dur)); // in cents
    vib.connect(vibDepth);
    vib.start(t);
    vib.stop(t + dur + 0.3);
    const lp = r.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3400;
    const g = env(r, t, 0.05, 0.01, Math.max(0, dur - 0.06), 0.16);
    for (const [wave, transpose, level, detune] of [
        [r.pulse25, 0, 1, 0],
        ["sawtooth", 0, 0.35, 7],
        ["sine", -12, 0.4, 0],
    ] as const) {
        const o = osc(r, wave, hz(from + transpose), t, t + dur + 0.3, detune);
        o.frequency.setValueAtTime(hz(from + transpose), t);
        o.frequency.exponentialRampToValueAtTime(hz(midi + transpose), t + 0.045); // glide
        vibDepth.connect(o.detune);
        const v = r.ctx.createGain();
        v.gain.value = level;
        o.connect(v).connect(lp);
    }
    lp.connect(g);
    send(r, g, 0.9, 0.4, 0.3);
};

const bell = (r: Rig, midi: number, t: number, level = 1) => {
    const g = env(r, t, 0.04 * level, 0.004, 0, 0.9);
    osc(r, "sine", hz(midi), t, t + 1.0).connect(g);
    const shimmer = env(r, t, 0.012, 0.002, 0, 0.6);
    osc(r, "sine", hz(midi) * 3.01, t, t + 0.8)
        .connect(shimmer)
        .connect(g);
    send(r, g, 0.7, 0.8, 0.4);
};

const kick = (r: Rig, t: number, level = 1) => {
    const o = r.ctx.createOscillator();
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.28);
    o.start(t);
    o.stop(t + 0.36);
    const g = env(r, t, 0.3 * level, 0.004, 0.02, 0.3);
    o.connect(g);
    send(r, g, 1);
};

const noiseHit = (r: Rig, t: number, type: BiquadFilterType, freq: number, peak: number, decay: number, verb: number) => {
    const src = r.ctx.createBufferSource();
    src.buffer = r.noise;
    const f = r.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = type === "bandpass" ? 1.2 : 0.7;
    const g = env(r, t, peak, 0.002, 0, decay);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
    send(r, g, 1, verb);
};

const hat = (r: Rig, t: number, level: number) => noiseHit(r, t, "highpass", 7500, 0.025 * level, 0.045, 0.1);

const snare = (r: Rig, t: number) => {
    noiseHit(r, t, "bandpass", 1900, 0.07, 0.17, 0.7);
    const body = env(r, t, 0.04, 0.002, 0, 0.09);
    osc(r, "triangle", 190, t, t + 0.12).connect(body);
    send(r, body, 1, 0.3);
};

// ---------- Sequencer ----------

/** Schedule everything that starts on one 16th-note step of the loop. */
const playStep = (r: Rig, step: number, t: number) => {
    const bar = Math.floor(step / BAR);
    const s = step % BAR; // step within the bar
    const inPhrase = step % (BAR * 8); // step within the 8-bar section
    const sec = sectionAt(bar);
    const chord = chordAt(bar);
    const bright = BRIGHTNESS[sec];
    const barInSection = bar % 8;
    // Section A layers in quickly so the loop gets moving within a few seconds.
    const introBuilt = sec === "A" && barInSection >= 4;

    // Chords: syncopated stabs (3+3+2 feel), offbeat stabs at the peak, a soft glow in the cool-down.
    const stabSteps: Record<Section, number[]> = { A: [0, 6, 12], B: [0, 6, 12, 14], C: [2, 6, 10, 14], D: [] };
    if (stabSteps[sec].includes(s)) stab(r, chord.pad, t, bright, sec === "A" ? (introBuilt ? 0.85 : 0.65) : 1);
    if (sec === "D" && s === 0 && (bar % 2 === 0 || barInSection >= 6)) glow(r, chord.pad, t, STEP * (barInSection >= 6 ? 14 : 30));

    // Bass: 8th pulse to start, rolling 16ths once the intro is built, round sub notes in the cool-down.
    if (sec === "D") {
        if (s === 0) subBass(r, chord.bass, t, 7, 0.75);
        if (s === 8) subBass(r, chord.bass, t, 6, 0.6);
    } else if (sec === "A" && !introBuilt) {
        if (s % 2 === 0) seqBass(r, chord.bass + (s === 14 ? 12 : 0), t, s % 4 === 0 ? 1 : 0.5);
    } else {
        const interval = sec === "C" ? (s % 4 === 2 ? 12 : s === 15 ? 7 : 0) : s === 14 ? 12 : 0;
        seqBass(r, chord.bass + interval, t, s % 4 === 0 ? 1 : s % 2 === 0 ? 0.55 : 0.3);
    }

    // Chip arpeggio over two octaves of the chord: 8ths at first, 16ths at full tilt.
    const tones = [...chord.pad.map((n) => n + 12), ...chord.pad.map((n) => n + 24)];
    const arpEvery = (sec === "A" && !introBuilt) || sec === "D" ? 2 : 1;
    const arpLevel = sec === "A" ? (introBuilt ? 0.8 : 0.6) : sec === "D" ? 0.55 : sec === "C" ? 0.7 : 0.9;
    if (s % arpEvery === 0) chipArp(r, tones[ARP[s]], t, arpLevel);

    // Lead melody (C), with bells an octave up on its long notes for sparkle.
    if (sec === "C")
        for (const [at, note, len] of MELODY)
            if (inPhrase === at) {
                lead(r, note, t, len);
                if (len >= 6) bell(r, note + 12, t, 0.5);
            }

    // Bells: the letters' run to open A, a bouncy hook through B, the melody in D.
    if (sec === "A" && barInSection === 0 && s < BELL_RUN.length) bell(r, BELL_RUN[s], t, 0.8);
    if (sec === "B") {
        const bellTones = [...chord.pad.map((n) => n + 12), ...chord.pad.map((n) => n + 24)];
        for (const [at, idx] of BELL_HOOK[bar % 2]) if (s === at) bell(r, bellTones[idx], t, s === 0 ? 0.85 : 0.65);
    }
    if (sec === "D") for (const [at, note] of BELLS) if (inPhrase === at) bell(r, note, t);

    // Drums: steady backbeat (snare on 2 and 4) from halfway through A to the end of C.
    const kicks: Record<Section, number[]> = {
        A: introBuilt ? [0, 8, 10] : [0, 8],
        B: [0, 8, 10],
        C: [0, 6, 8, 10],
        D: barInSection >= 6 ? [0] : [0, 8],
    };
    if (kicks[sec].includes(s)) kick(r, t, sec === "D" ? 0.6 : sec === "A" ? 0.95 : s === 6 ? 0.6 : 1);
    if ((introBuilt || sec === "B" || sec === "C") && (s === 4 || s === 12)) snare(r, t);
    if (sec === "A" && barInSection === 3 && (s === 14 || s === 15)) snare(r, t); // pickup into the backbeat
    if (sec === "C" && barInSection === 7 && (s === 13 || s === 14 || s === 15)) snare(r, t); // fill into the cool-down

    if (sec === "C") hat(r, t, s % 4 === 2 ? 1 : 0.45);
    else if ((sec === "B" || (sec === "A" && barInSection >= 2)) && s % 2 === 0) hat(r, t, s % 4 === 2 ? 1 : 0.4);
    else if (s % 4 === 2 && !(sec === "D" && barInSection >= 6)) hat(r, t, sec === "D" ? 0.6 : 0.9);
};

// ---------- Transport ----------

let users = 0;
let timer: number | undefined;
let step = 0;
let nextTime = 0;
let stopTimer: number | undefined;
let waitingForGesture = false;
let unsubscribe: (() => void) | undefined;

const shouldPlay = () => users > 0 && isSoundEnabled() && (typeof document === "undefined" || document.visibilityState === "visible");

const tick = () => {
    if (!rig) return;
    const { ctx } = rig;
    // If the tab was throttled and we fell behind, skip ahead instead of firing a burst of notes.
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
        const swing = step % 2 === 1 ? SWING * STEP : 0;
        playStep(rig, step, nextTime + swing);
        nextTime += STEP;
        step = (step + 1) % (LOOP_BARS * BAR);
    }
};

const fade = (to: number, seconds: number) => {
    if (!rig) return;
    const g = rig.master.gain;
    const now = rig.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + seconds);
};

const onGesture = () => {
    removeGestureListeners();
    sync();
};
const addGestureListeners = () => {
    if (waitingForGesture) return;
    waitingForGesture = true;
    for (const e of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(e, onGesture, { capture: true });
};
const removeGestureListeners = () => {
    if (!waitingForGesture) return;
    waitingForGesture = false;
    for (const e of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(e, onGesture, { capture: true });
};

const start = () => {
    const ctx = audio();
    if (!ctx) return;
    if (ctx.state !== "running") {
        // Either still waking up, or autoplay is blocked: then start on the first click/tap/key.
        addGestureListeners();
        void ctx.resume().then(() => {
            if (ctx.state === "running" && shouldPlay()) start();
        });
        return;
    }
    removeGestureListeners();
    if (!rig || rig.ctx !== ctx) rig = buildRig(ctx);
    window.clearTimeout(stopTimer);
    if (timer === undefined) {
        nextTime = ctx.currentTime + 0.1;
        timer = window.setInterval(tick, TICK_MS);
        tick();
    }
    fade(VOLUME, step === 0 ? 1.5 : 1); // short fade-in from the top, quicker when resuming
};

const pause = () => {
    removeGestureListeners();
    if (timer === undefined) return;
    fade(0, 0.6);
    window.clearTimeout(stopTimer);
    stopTimer = window.setTimeout(() => {
        window.clearInterval(timer);
        timer = undefined;
        if (users === 0) step = 0; // left the arcade: start from the top next time
    }, 700);
};

const sync = () => (shouldPlay() ? start() : pause());

const onVisibility = () => sync();

/** Ask for the arcade music while a screen is mounted. */
export const acquireMusic = () => {
    users++;
    if (users === 1) {
        unsubscribe = subscribeSound(sync);
        document.addEventListener("visibilitychange", onVisibility);
    }
    sync();
    return () => {
        users--;
        // Small grace period so a screen change (unmount, then mount) doesn't stop the loop.
        window.setTimeout(() => {
            if (users > 0) return;
            unsubscribe?.();
            unsubscribe = undefined;
            document.removeEventListener("visibilitychange", onVisibility);
            sync();
        }, 250);
    };
};

/** Plays the arcade loop while the calling component is mounted. Safe to call from every screen. */
export const useArcadeMusic = (enabled = true) => {
    useEffect(() => (enabled ? acquireMusic() : undefined), [enabled]);
};
