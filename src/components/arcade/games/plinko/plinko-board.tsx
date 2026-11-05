import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cx } from "@/utils/cx";
import type { PlinkoBoardConfig, PlinkoTier } from "../../api/types";
import { sfx } from "../../sound/arcade-sound";
import {
    type Drop,
    type PlinkoGeometry,
    ballPosition,
    binRect,
    buildDrop,
    computeGeometry,
    pegIndexAt,
    pegPosition,
    segmentDuration,
    stepPoint,
    positionOfBin,
} from "./plinko-engine";

/** Neon palette for the canvas (mirrors the arcade-* tokens in arcade-theme.css). */
const NEON: Record<PlinkoTier["color"] | "ice" | "ink", string> = {
    acid: "#eeff00",
    magenta: "#f000ec",
    cyan: "#00e7f2",
    pink: "#ff79e9",
    violet: "#a879ff",
    ice: "#e9f9ff",
    ink: "#0b0320",
};
const DISPLAY_FONT = '"Barlow Condensed", "Arial Narrow", Impact, sans-serif';
const MONO_FONT = '"JetBrains Mono", ui-monospace, monospace';

export interface PlinkoBoardHandle {
    /** Drop a ball that will land in `bin`. Call after the server has decided the prize. */
    drop: (id: string, bin: number) => void;
    /** Balls currently in the air. */
    inFlight: () => number;
}

export interface PlinkoBoardProps {
    board: PlinkoBoardConfig;
    /** Largest height the board may take, in CSS px. */
    maxHeight?: number;
    reducedMotion?: boolean;
    /** Fires when a ball lands. Reveal the prize here. */
    onLand?: (id: string, bin: number) => void;
    className?: string;
}

type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; c: string };
type Float = { x: number; y: number; text: string; c: string; life: number };

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

/**
 * Neon Plinko cabinet. Purely visual: it never decides outcomes. Call
 * `ref.drop(id, bin)` with the bin for the prize the server returned.
 */
export const PlinkoBoard = forwardRef<PlinkoBoardHandle, PlinkoBoardProps>(({ board, maxHeight = 600, reducedMotion, onLand, className }, ref) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [geo, setGeo] = useState<PlinkoGeometry | null>(null);

    // Mutable animation state lives in refs so the render loop never re-renders React.
    const g = useRef<PlinkoGeometry | null>(null);
    const drops = useRef<Drop[]>([]);
    const particles = useRef<Particle[]>([]);
    const floats = useRef<Float[]>([]);
    const pegHits = useRef(new Map<string, number>());
    const binHits = useRef(new Map<number, number>());
    const raf = useRef<number | null>(null);
    const last = useRef(0);
    const quietSince = useRef(0);
    const onLandRef = useRef(onLand);
    onLandRef.current = onLand;
    const reduced = () => !!reducedMotion || prefersReducedMotion();

    const tierFor = useCallback((k: number) => board.tiers[positionOfBin(board.rows, k)] ?? board.tiers[board.tiers.length - 1], [board]);

    /* ---------------- drawing ---------------- */
    const draw = useCallback(
        (now: number) => {
            const canvas = canvasRef.current;
            const G = g.current;
            if (!canvas || !G) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.clearRect(0, 0, G.W, G.H);

            // Chute
            ctx.save();
            ctx.shadowColor = NEON.cyan;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = NEON.cyan;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(G.cx - G.u * 0.75, G.top - G.u * 1.45);
            ctx.lineTo(G.cx - G.u * 0.32, G.top - G.u * 0.72);
            ctx.moveTo(G.cx + G.u * 0.75, G.top - G.u * 1.45);
            ctx.lineTo(G.cx + G.u * 0.32, G.top - G.u * 0.72);
            ctx.stroke();
            ctx.restore();

            // Pegs: rows alternate magenta / cyan like the comp
            for (let r = 0; r < G.rows; r++) {
                const base = r % 2 === 0 ? NEON.magenta : NEON.cyan;
                for (let j = 0; j < r + 3; j++) {
                    const { x, y } = pegPosition(G, r, j);
                    const hit = pegHits.current.get(`${r}-${j}`);
                    const k = hit ? Math.max(0, 1 - (now - hit) / 380) : 0;
                    if (k > 0) {
                        ctx.strokeStyle = base;
                        ctx.globalAlpha = 0.6 * k;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x, y, G.pegR * (1.5 + (1 - k) * 3), 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    ctx.save();
                    ctx.shadowColor = base;
                    ctx.shadowBlur = G.pegR * (3 + 4 * k);
                    const grad = ctx.createRadialGradient(x - G.pegR * 0.3, y - G.pegR * 0.3, 0, x, y, G.pegR * (1 + 0.4 * k));
                    grad.addColorStop(0, "#ffffff");
                    grad.addColorStop(0.35 - 0.2 * k, k > 0 ? "#ffffff" : base);
                    grad.addColorStop(1, base);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, G.pegR * (1 + 0.4 * k), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Bins
            for (let k = 0; k <= G.rows; k++) {
                const tier = tierFor(k);
                const col = NEON[tier.color];
                const hit = binHits.current.get(k);
                const t = hit ? Math.max(0, 1 - (now - hit) / 800) : 0;
                const b = binRect(G, k);
                const y = b.y + Math.sin(t * Math.PI) * G.u * 0.12;
                const rad = Math.min(8, G.u * 0.14);

                const fill = ctx.createLinearGradient(0, y, 0, y + b.h);
                fill.addColorStop(0, `${col}10`);
                fill.addColorStop(1, `${col}${t > 0 ? "cc" : "55"}`);
                ctx.save();
                ctx.shadowColor = col;
                ctx.shadowBlur = 8 + 22 * t;
                ctx.fillStyle = fill;
                roundRect(ctx, b.x, y, b.w, b.h, rad);
                ctx.fill();
                ctx.lineWidth = 1.5 + t;
                ctx.strokeStyle = col;
                ctx.stroke();
                ctx.restore();

                // Labels
                const fs = Math.max(11, Math.min(26, G.u * 0.46));
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = `400 ${Math.max(8, fs * 0.42)}px ${MONO_FONT}`;
                ctx.fillStyle = "rgba(233,249,255,0.7)";
                ctx.fillText(tier.caption, b.x + b.w / 2, y + b.h * 0.3);
                ctx.save();
                ctx.font = `italic 900 ${fs}px ${DISPLAY_FONT}`;
                // Shrink long labels ("GEAR") to fit inside the bin.
                const maxW = b.w * 0.84;
                const measured = ctx.measureText(tier.label).width;
                if (measured > maxW) ctx.font = `italic 900 ${(fs * maxW) / measured}px ${DISPLAY_FONT}`;
                ctx.shadowColor = col;
                ctx.shadowBlur = 10;
                ctx.fillStyle = t > 0.3 ? "#ffffff" : col;
                ctx.fillText(tier.label, b.x + b.w / 2, y + b.h * 0.64);
                ctx.restore();
            }

            // Sparks
            particles.current = particles.current.filter((p) => p.life > 0);
            for (const p of particles.current) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.14;
                p.life -= 0.022;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Balls with a light streak
            for (const d of drops.current) {
                const pos = ballPosition(G, d);
                d.trail.push(pos);
                if (d.trail.length > 10) d.trail.shift();
                if (d.trail.length > 1) {
                    ctx.save();
                    ctx.lineCap = "round";
                    for (let i = 1; i < d.trail.length; i++) {
                        const a = i / d.trail.length;
                        ctx.strokeStyle = `rgba(238,255,0,${0.28 * a})`;
                        ctx.lineWidth = G.ballR * 0.9 * a;
                        ctx.beginPath();
                        ctx.moveTo(d.trail[i - 1].x, d.trail[i - 1].y);
                        ctx.lineTo(d.trail[i].x, d.trail[i].y);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                ctx.save();
                ctx.shadowColor = NEON.acid;
                ctx.shadowBlur = G.ballR * 2.4;
                const grad = ctx.createRadialGradient(pos.x - G.ballR * 0.35, pos.y - G.ballR * 0.4, G.ballR * 0.1, pos.x, pos.y, G.ballR);
                grad.addColorStop(0, "#ffffff");
                grad.addColorStop(0.45, NEON.acid);
                grad.addColorStop(1, "#8f9a00");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, G.ballR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Floating "+500"
            floats.current = floats.current.filter((f) => f.life > 0);
            for (const f of floats.current) {
                f.y -= 0.7;
                f.life -= 0.012;
                ctx.save();
                ctx.globalAlpha = Math.min(1, f.life * 2);
                ctx.font = `italic 900 ${Math.max(18, G.u * 0.7)}px ${DISPLAY_FONT}`;
                ctx.textAlign = "center";
                ctx.shadowColor = f.c;
                ctx.shadowBlur = 14;
                ctx.fillStyle = "#ffffff";
                ctx.fillText(f.text, f.x, f.y);
                ctx.restore();
            }
        },
        [tierFor],
    );

    /* ---------------- simulation ---------------- */
    const land = useCallback(
        (d: Drop, now: number) => {
            const G = g.current!;
            binHits.current.set(d.bin, now);
            const tier = tierFor(d.bin);
            const col = NEON[tier.color];
            const p = stepPoint(G, { kind: "bin", off: d.bin - G.rows / 2 });
            if (!reduced()) {
                for (let i = 0; i < 22; i++)
                    particles.current.push({
                        x: p.x,
                        y: p.y,
                        vx: (Math.random() - 0.5) * 4.5,
                        vy: -Math.random() * 4.5 - 1,
                        r: Math.random() * 2.4 + 0.8,
                        life: 1,
                        c: i % 3 ? col : "#ffffff",
                    });
            }
            // Stack labels when several balls land close together so they don't overlap.
            const stacked = floats.current.filter((f) => f.life > 0.55).length;
            floats.current.push({
                x: p.x,
                y: p.y - G.binH * 0.7 - stacked * G.u * 0.6,
                text: tier.caption === "PTS" ? `+${tier.label}` : tier.label,
                c: col,
                life: 1,
            });
            onLandRef.current?.(d.id, d.bin);
        },
        [tierFor],
    );

    const step = useCallback(
        (dt: number, now: number) => {
            const G = g.current;
            if (!G) return;
            for (const d of drops.current) {
                d.t += dt / segmentDuration(d.seg, d.steps.length, reduced());
                while (d.t >= 1 && !d.done) {
                    d.t -= 1;
                    d.seg++;
                    const st = d.steps[d.seg];
                    const peg = pegIndexAt(st);
                    if (peg) {
                        pegHits.current.set(`${peg.r}-${peg.j}`, now);
                        sfx.peg(peg.r);
                    }
                    if (d.seg >= d.steps.length - 1) {
                        d.done = true;
                        d.seg = d.steps.length - 2;
                        d.t = 1;
                        land(d, now);
                    }
                }
            }
            drops.current = drops.current.filter((d) => !d.done);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [land],
    );

    const loop = useCallback(
        (now: number) => {
            const dt = Math.min(0.05, (now - last.current) / 1000);
            last.current = now;
            step(dt, now);
            draw(now);
            const busy = drops.current.length || particles.current.length || floats.current.length;
            if (busy) quietSince.current = now;
            // Keep running ~1s after the last activity so hit glows fade out, then sleep.
            if (now - quietSince.current < 1000) raf.current = requestAnimationFrame(loop);
            else raf.current = null;
        },
        [draw, step],
    );

    const wake = useCallback(() => {
        quietSince.current = performance.now();
        if (raf.current == null) {
            last.current = performance.now();
            raf.current = requestAnimationFrame(loop);
        }
    }, [loop]);

    useImperativeHandle(
        ref,
        () => ({
            drop: (id, bin) => {
                drops.current.push(buildDrop(id, board.rows, Math.max(0, Math.min(board.rows, bin))));
                sfx.drop();
                wake();
            },
            inFlight: () => drops.current.length,
        }),
        [board.rows, wake],
    );

    /* ---------------- sizing ---------------- */
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const fit = () => {
            const width = el.clientWidth;
            if (width < 50) return;
            const next = computeGeometry(width - 24, maxHeight, board.rows);
            g.current = next;
            setGeo(next);
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(el);
        return () => ro.disconnect();
    }, [board.rows, maxHeight]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !geo) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(geo.W * dpr);
        canvas.height = Math.round(geo.H * dpr);
        canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(performance.now());
        // Redraw once the display fonts arrive.
        document.fonts?.ready.then(() => draw(performance.now()));
    }, [geo, draw]);

    useEffect(() => () => void (raf.current && cancelAnimationFrame(raf.current)), []);

    const bins = board.rows + 1;
    return (
        <div ref={wrapRef} className={cx("flex w-full justify-center", className)}>
            {geo && (
                // Cabinet: design kit offset-block frame (cyan edge, magenta + purple blocks), cut to a trapezoid.
                // The blocks are drop-shadow filters on the edge layer only, so the pegs don't cast them.
                <div className="relative" style={{ width: geo.W + 24 }}>
                    <div aria-hidden="true" className="absolute inset-0 arcade-frame-filter">
                        <div className="size-full bg-arcade-cyan" style={{ clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)" }} />
                    </div>
                    <div
                        className="absolute inset-[2px] arcade-grid bg-[radial-gradient(ellipse_at_50%_20%,#2a0b63_0%,var(--color-arcade-ink)_70%)]"
                        style={{ clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)" }}
                    />
                    {/* Glass sheen */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-[2px] bg-[linear-gradient(105deg,rgb(255_255_255/0.08)_0%,transparent_22%,transparent_78%,rgb(255_255_255/0.06)_100%)]"
                        style={{ clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)" }}
                    />
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label={`Plinko board with ${bins} prize bins: ${board.tiers
                            .slice()
                            .reverse()
                            .map((t) => `${t.label} ${t.caption === "PTS" ? "points" : t.caption.toLowerCase()}`)
                            .join(", ")}`}
                        className="relative mx-auto block"
                        style={{ width: geo.W, height: geo.H }}
                    />
                </div>
            )}
        </div>
    );
});
PlinkoBoard.displayName = "PlinkoBoard";
