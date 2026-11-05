import type { PlinkoBoardConfig } from "../../api/types";
/**
 * Plinko geometry + ball paths (pure functions, no DOM).
 * Ported from the Rewards Arcade prototype. The OUTCOME is decided before the
 * ball drops: `buildDrop()` takes the target bin and builds a random-looking path
 * that is guaranteed to end there.
 */

export interface PlinkoGeometry {
    /** Canvas CSS width/height. */
    W: number;
    H: number;
    /** Horizontal peg spacing. */
    sx: number;
    /** Base unit for everything vertical. */
    u: number;
    top: number;
    rowGap: number;
    binY: number;
    binH: number;
    cx: number;
    pegR: number;
    ballR: number;
    rows: number;
}

/**
 * Fit the board inside `maxWidth` x `maxHeight`. The board keeps its own
 * proportions, so the returned `W` can be narrower than `maxWidth`.
 */
export const computeGeometry = (maxWidth: number, maxHeight: number, rows: number): PlinkoGeometry => {
    const u = Math.min(maxWidth / (rows + 3), maxHeight / (rows + 2.6));
    const sx = u;
    const W = u * (rows + 3);
    const top = u * 1.55;
    const rowGap = u * 0.95;
    const binY = top + (rows - 1) * rowGap + u * 0.62;
    const binH = u * 1.3;
    const H = binY + binH + u * 0.35;
    return { W, H, sx, u, top, rowGap, binY, binH, cx: W / 2, pegR: Math.max(2.5, u * 0.11), ballR: Math.max(5, u * 0.22), rows };
};

/** Pegs in row r: r + 3, centered. */
export const pegPosition = (g: PlinkoGeometry, r: number, j: number) => ({ x: g.cx + (j - (r + 2) / 2) * g.sx, y: g.top + r * g.rowGap });

/** Bin k of `rows + 1`. */
export const binRect = (g: PlinkoGeometry, k: number) => {
    const w = g.sx * 0.86;
    return { x: g.cx + (k - g.rows / 2) * g.sx - w / 2, y: g.binY, w, h: g.binH };
};

/** Position of bin k: 0 for the outer pair, `rows / 2` for the center bin. */
export const positionOfBin = (rows: number, k: number) => Math.min(k, rows - k);

/** Pick a bin at a position (left or right side at random). */
export const binForPosition = (rows: number, position: number, rng = Math.random) => {
    const options = [...new Set([position, rows - position])].filter((k) => k >= 0 && k <= rows);
    return options[Math.floor(rng() * options.length)] ?? Math.floor(rows / 2);
};

/** Pick a bin that holds this prize tier on the given board. Falls back to the center. */
export const binForTier = (board: PlinkoBoardConfig, tier: number, rng = Math.random) => {
    const position = board.tiers.findIndex((t) => t.tier === tier);
    return binForPosition(board.rows, position < 0 ? board.rows / 2 : position, rng);
};

type Step = { kind: "start"; jx: number } | { kind: "peg"; r: number; off: number; jx: number } | { kind: "bin"; off: number };

export interface Drop {
    id: string;
    bin: number;
    steps: Step[];
    seg: number;
    t: number;
    done: boolean;
    trail: { x: number; y: number }[];
}

/** A path of `rows` left/right bounces with exactly `bin` rights, shuffled. */
export const buildDrop = (id: string, rows: number, bin: number, rng = Math.random): Drop => {
    const path: number[] = Array.from({ length: rows }, (_, i) => (i < bin ? 1 : 0));
    for (let i = path.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [path[i], path[j]] = [path[j], path[i]];
    }
    const steps: Step[] = [{ kind: "start", jx: (rng() - 0.5) * 0.12 }];
    let off = 0;
    for (let r = 0; r < rows; r++) {
        steps.push({ kind: "peg", r, off, jx: (rng() - 0.5) * 0.05 });
        off += path[r] ? 0.5 : -0.5;
    }
    steps.push({ kind: "bin", off });
    return { id, bin, steps, seg: 0, t: 0, done: false, trail: [] };
};

export const stepPoint = (g: PlinkoGeometry, st: Step) => {
    if (st.kind === "start") return { x: g.cx + st.jx * g.sx, y: g.top - g.u * 1.05 };
    if (st.kind === "peg") return { x: g.cx + (st.off + st.jx) * g.sx, y: g.top + st.r * g.rowGap - g.pegR - g.ballR };
    return { x: g.cx + st.off * g.sx, y: g.binY + g.binH * 0.5 };
};

/** Seconds per segment: slower first fall and last drop into the bin. */
export const segmentDuration = (i: number, n: number, reduced: boolean) => (i === 0 ? 0.36 : i === n - 2 ? 0.34 : 0.19) * (reduced ? 0.4 : 1);

/** Ball position: gravity on the first fall, a hop arc between pegs. */
export const ballPosition = (g: PlinkoGeometry, d: Drop) => {
    const a = stepPoint(g, d.steps[d.seg]);
    const c = stepPoint(g, d.steps[Math.min(d.seg + 1, d.steps.length - 1)]);
    const t = d.t;
    if (d.seg === 0) return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t * t };
    const hop = g.rowGap * (d.seg === d.steps.length - 2 ? 0.28 : 0.4);
    return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t * t - hop * 4 * t * (1 - t) };
};

/** Peg index hit at a peg step (for glow). */
export const pegIndexAt = (st: Step) => (st.kind === "peg" ? { r: st.r, j: st.off + (st.r + 2) / 2 } : null);
