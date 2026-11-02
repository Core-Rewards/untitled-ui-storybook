import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { Play } from "@untitledui/icons";
import { usePrefersReducedMotion } from "@/components/base/carousel/use-prefers-reduced-motion";
import { cx, sortCx } from "@/utils/cx";
import type { Supplier } from "./supplier-types";
import { supplierInitials } from "./supplier-utils";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: "relative aspect-square w-full",
    // The stage fades in once the first frame has placed every logo, so nothing flashes at the centre.
    stage: "absolute inset-0 opacity-0 transition-opacity duration-300 ease-out [contain:layout_paint] data-[ready]:opacity-100 motion-reduce:transition-none",
    // Logos are JPGs on white, so the tile stays white in dark mode too (as on SupplierCard).
    tile: [
        "absolute top-1/2 left-1/2 flex aspect-[348/200] w-(--tile-w) items-center justify-center overflow-hidden",
        "rounded-lg bg-white shadow-xs ring-1 ring-black/5 will-change-transform",
    ].join(" "),
    tileHovered: "shadow-lg ring-black/10",
    image: "pointer-events-none size-full object-contain select-none",
    fallback: "text-sm font-semibold tracking-tight text-quaternary",
    toggle: [
        "absolute right-0 bottom-0 z-[200] inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-fg-secondary",
        "shadow-xs ring-1 ring-primary transition duration-150 ease-linear ring-inset hover:bg-primary_hover",
        "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
    ].join(" "),
});

// ── Geometry ──────────────────────────────────────────────────────────────────

/** Fixed forward tilt so the poles show and the sphere reads as 3D, not a flat ring. */
const TILT = (-14 * Math.PI) / 180;
/** Logo width as a share of the sphere radius. */
const TILE_RATIO = 0.42;
/** Front-most scale is 1; the far side shrinks to this. */
const MIN_SCALE = 0.5;
const HOVER_SCALE = 1.3;
/** Logos further back than this can't be hovered, so the pointer only catches the front face. */
const HOVER_DEPTH = 0.5;
/** A slot can take a new logo only while this far back, where it is all but invisible. */
const SWAP_DEPTH = 0.3;
/** How many queued logos to load ahead of the slots that will need them. */
const PRELOAD_AHEAD = 4;

/** Evenly spread points on a unit sphere (Fibonacci lattice). */
function fibonacciSphere(count: number): [number, number, number][] {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, i) => {
        const y = 1 - ((i + 0.5) / count) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        return [Math.cos(theta) * r, y, Math.sin(theta) * r];
    });
}

/**
 * The furthest back each point ever gets as the sphere turns. Points near the
 * poles never reach the very back, so each slot swaps near its own low point.
 */
function minDepths(points: [number, number, number][]): Float32Array {
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);
    return Float32Array.from(points, ([, y]) => (y * sinT - Math.sqrt(1 - y * y) * cosT + 1) / 2);
}

function shuffled<T>(items: T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

const PauseGlyph = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4">
        <path d="M9 5v14M15 5v14" />
    </svg>
);

// ── Logo ──────────────────────────────────────────────────────────────────────

const SphereLogo: FC<{ supplier: Supplier }> = ({ supplier }) => {
    const [failed, setFailed] = useState(false);
    if (!supplier.logoSrc || failed) return <span className={styles.fallback}>{supplierInitials(supplier.name)}</span>;
    return (
        <img
            src={supplier.logoSrc}
            alt=""
            width={348}
            height={200}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            className={styles.image}
        />
    );
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface SupplierSphereProps {
    suppliers: Supplier[];
    /** How many logos ride the sphere. More than ~48 starts to crowd. */
    maxLogos?: number;
    /** Rotation speed in degrees per second. */
    speed?: number;
    /** Pick a fresh random set (and order) of logos on each mount. Off keeps the given order. */
    shuffle?: boolean;
    /**
     * Cycle every supplier through the sphere, not just the first `maxLogos`.
     * A slot takes the next logo while it is on the far side, so the new one
     * fades in as it turns to the front. Logos load only as they're queued.
     */
    cycle?: boolean;
    /** How far the sphere spills past its box on every side, as a share of the box (0.1 = 10%). The pause button stays inside the box. */
    bleed?: number;
    className?: string;
}

/**
 * Supplier logos riding a slowly turning sphere. Hovering a logo stops the
 * spin and enlarges it. With `cycle`, a fixed set of slots works through the
 * whole supplier list, swapping logos while they're out of sight. Positions are written straight to each tile's
 * transform from one requestAnimationFrame loop, so React never re-renders
 * while it turns. The loop sleeps while the sphere is off screen, paused or
 * at rest. Reduced motion shows a still sphere.
 *
 * The sphere is decorative (`aria-hidden`); the surrounding copy should say
 * what it shows.
 */
export const SupplierSphere = ({ suppliers, maxLogos = 40, speed = 9, shuffle = true, cycle = true, bleed = 0, className }: SupplierSphereProps) => {
    const reducedMotion = usePrefersReducedMotion();
    const [userPaused, setUserPaused] = useState(false);
    const [ready, setReady] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    // Every supplier with a logo, in the order the slots work through them.
    const pool = useMemo(() => {
        const withLogos = suppliers.filter((s) => s.logoSrc);
        return shuffle ? shuffled(withLogos) : withLogos;
    }, [suppliers, shuffle]);
    const slotCount = Math.min(maxLogos, pool.length);
    const points = useMemo(() => fibonacciSphere(slotCount), [slotCount]);
    const lowPoints = useMemo(() => minDepths(points), [points]);

    // Which supplier sits in each slot. Only changes when a slot swaps on the far side.
    const [slots, setSlots] = useState(() => pool.slice(0, slotCount));
    const queue = useRef({
        next: slotCount,
        /** Load state per supplier id; a logo only goes on the sphere once it's `ready`. */
        status: new Map<string, "loading" | "ready" | "failed">(),
        /** Set once a slot has swapped on this pass round the back; cleared when it comes back to the front. */
        swapped: new Uint8Array(slotCount),
        slots: [] as Supplier[],
    });
    queue.current.slots = slots;

    useEffect(() => {
        setSlots(pool.slice(0, slotCount));
        queue.current.next = slotCount;
        queue.current.swapped = new Uint8Array(slotCount);
    }, [pool, slotCount]);

    const canCycle = cycle && pool.length > slotCount;
    const cycleRef = useRef(canCycle);
    cycleRef.current = canCycle;

    const stageRef = useRef<HTMLDivElement>(null);
    const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Everything the frame loop reads lives in one mutable object, so changing it never re-renders.
    const sim = useRef({
        angle: 0,
        velocity: 0,
        radius: 0,
        visible: false,
        running: false,
        hovered: null as number | null,
        hoverAmount: new Float32Array(0),
        zIndex: new Int16Array(0),
        interactive: new Uint8Array(0),
        kick: () => {},
    });

    const spinning = !reducedMotion && !userPaused;
    const targetVelocity = spinning && hovered === null ? (speed * Math.PI) / 180 : 0;

    // The frame loop reads these through refs so changing them never restarts it.
    const targetVelocityRef = useRef(targetVelocity);
    const reducedMotionRef = useRef(reducedMotion);

    useEffect(() => {
        const s = sim.current;
        s.hoverAmount = new Float32Array(points.length);
        s.zIndex = new Int16Array(points.length).fill(-1);
        s.interactive = new Uint8Array(points.length).fill(2);
        // Start at a random angle so return visits don't open on the same face.
        s.angle = shuffle ? Math.random() * Math.PI * 2 : 0;
        // Open already at full speed; the ease is only for braking on hover and spinning back up.
        s.velocity = targetVelocityRef.current;
    }, [points, shuffle]);

    useEffect(() => {
        const s = sim.current;
        const stage = stageRef.current;
        if (!stage) return;
        const q = queue.current;

        const preload = (supplier: Supplier) => {
            if (q.status.has(supplier.id)) return;
            q.status.set(supplier.id, "loading");
            const img = new Image();
            img.src = supplier.logoSrc!;
            // decode() resolves once the image can paint without a hitch, so the swap never shows a blank tile.
            img.decode().then(
                () => q.status.set(supplier.id, "ready"),
                () => q.status.set(supplier.id, "failed"),
            );
        };

        /** Puts the next ready logo into slot `i`. Returns false when it has to wait for one to load. */
        const swapSlot = (i: number) => {
            const showing = new Set(q.slots.map((x) => x.id));
            for (let tries = 0; tries < pool.length; tries++) {
                const candidate = pool[q.next % pool.length];
                const state = q.status.get(candidate.id);
                if (showing.has(candidate.id) || state === "failed") {
                    q.next++;
                    continue;
                }
                if (state !== "ready") {
                    preload(candidate);
                    return false;
                }
                q.next++;
                setSlots((current) => current.map((x, j) => (j === i ? candidate : x)));
                for (let k = 0; k < PRELOAD_AHEAD; k++) preload(pool[(q.next + k) % pool.length]);
                return true;
            }
            return false;
        };

        let frame = 0;
        let last = 0;
        const cosT = Math.cos(TILT);
        const sinT = Math.sin(TILT);

        const draw = (now: number) => {
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
            last = now;

            // Ease speed toward its target, so a hover brakes and a release spins back up rather than snapping.
            const target = targetVelocityRef.current;
            s.velocity += (target - s.velocity) * Math.min(1, dt * 4);
            if (Math.abs(target - s.velocity) < 1e-4) s.velocity = target;
            s.angle += s.velocity * dt;

            const cosA = Math.cos(s.angle);
            const sinA = Math.sin(s.angle);
            const R = s.radius;
            const ease = reducedMotionRef.current ? 1 : Math.min(1, dt * 10);
            // At rest only once it has actually stopped. On the first frame dt is 0, so velocity alone would read as stopped.
            let settled = s.velocity === 0 && target === 0;

            for (let i = 0; i < points.length; i++) {
                const tile = tileRefs.current[i];
                if (!tile) continue;
                const [px, py, pz] = points[i];

                // Spin about Y, then tilt about X.
                const x = px * cosA + pz * sinA;
                const z1 = -px * sinA + pz * cosA;
                const y = py * cosT - z1 * sinT;
                const z = py * sinT + z1 * cosT;
                const depth = (z + 1) / 2; // 0 = far side, 1 = nearest

                // Swap the logo near this slot's furthest point back, then wait for it to come round before swapping again.
                if (cycleRef.current && s.velocity !== 0) {
                    if (!q.swapped[i] && depth < SWAP_DEPTH && depth < lowPoints[i] + 0.04) {
                        if (swapSlot(i)) q.swapped[i] = 1;
                    } else if (q.swapped[i] && depth > HOVER_DEPTH) {
                        q.swapped[i] = 0;
                    }
                }

                const hoverTarget = s.hovered === i ? 1 : 0;
                const h = s.hoverAmount[i] + (hoverTarget - s.hoverAmount[i]) * ease;
                s.hoverAmount[i] = Math.abs(hoverTarget - h) < 1e-3 ? hoverTarget : h;
                if (s.hoverAmount[i] !== hoverTarget) settled = false;
                const hv = s.hoverAmount[i];

                const scale = (MIN_SCALE + (1 - MIN_SCALE) * depth) * (1 + (HOVER_SCALE - 1) * hv);
                // Smoothstep fade: the front face stays solid and the far side drops to a faint hint.
                const f = Math.min(1, Math.max(0, (depth - 0.2) / 0.6));
                const opacity = 0.05 + 0.95 * f * f * (3 - 2 * f);
                tile.style.transform = `translate3d(${(x * R).toFixed(2)}px, ${(y * R).toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
                tile.style.opacity = (opacity + (1 - opacity) * hv).toFixed(3);

                // Only touch z-index and pointer-events when they change; most frames they don't.
                const zi = hv > 0 ? 200 : Math.round(depth * 100);
                if (s.zIndex[i] !== zi) {
                    s.zIndex[i] = zi;
                    tile.style.zIndex = String(zi);
                }
                const interactive = depth > HOVER_DEPTH ? 1 : 0;
                if (s.interactive[i] !== interactive) {
                    s.interactive[i] = interactive;
                    tile.style.pointerEvents = interactive ? "auto" : "none";
                }
            }

            if (settled || !s.visible) {
                s.running = false;
                last = 0;
                return;
            }
            frame = requestAnimationFrame(draw);
        };

        s.kick = () => {
            if (s.running || !s.visible || !s.radius) return;
            s.running = true;
            frame = requestAnimationFrame(draw);
        };

        const resize = new ResizeObserver(([entry]) => {
            const size = Math.min(entry.contentRect.width, entry.contentRect.height);
            // Leave room for a front logo's half-width at the rim.
            s.radius = size / (2 + TILE_RATIO * 1.15);
            stage.style.setProperty("--tile-w", `${s.radius * TILE_RATIO}px`);
            // Repaint one frame at the new size even when at rest.
            if (!s.running && s.visible) {
                s.running = true;
                frame = requestAnimationFrame(draw);
            }
            setReady(true);
        });
        resize.observe(stage);

        const intersection = new IntersectionObserver(([entry]) => {
            s.visible = entry.isIntersecting;
            if (s.visible) {
                s.running = true;
                frame = requestAnimationFrame(draw);
            }
        });
        intersection.observe(stage);

        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            intersection.disconnect();
            s.running = false;
            s.kick = () => {};
        };
    }, [points, lowPoints, pool]);

    useEffect(() => {
        targetVelocityRef.current = targetVelocity;
        reducedMotionRef.current = reducedMotion;
        sim.current.hovered = hovered;
        sim.current.kick();
    }, [targetVelocity, reducedMotion, hovered]);

    return (
        <div className={cx(styles.root, className)}>
            <div
                ref={stageRef}
                className={styles.stage}
                style={bleed ? { inset: `${-bleed * 100}%` } : undefined}
                data-ready={ready || undefined}
                aria-hidden="true"
                onPointerLeave={() => setHovered(null)}
            >
                {slots.map((supplier, i) => (
                    // Keyed by slot so the tile (and the transform the loop writes to it) survives a swap.
                    <div
                        key={i}
                        ref={(el) => {
                            tileRefs.current[i] = el;
                        }}
                        title={supplier.name}
                        className={cx(styles.tile, hovered === i && styles.tileHovered)}
                        onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(i)}
                        onPointerLeave={() => setHovered((current) => (current === i ? null : current))}
                    >
                        <SphereLogo key={supplier.id} supplier={supplier} />
                    </div>
                ))}
            </div>

            {/* Anything that moves on its own needs a pause control (WCAG 2.2.2). */}
            {!reducedMotion && (
                <button
                    type="button"
                    className={styles.toggle}
                    aria-label={userPaused ? "Play supplier logo animation" : "Pause supplier logo animation"}
                    aria-pressed={userPaused}
                    onClick={() => setUserPaused((p) => !p)}
                >
                    {userPaused ? <Play aria-hidden="true" className="size-4" /> : <PauseGlyph />}
                </button>
            )}
        </div>
    );
};
