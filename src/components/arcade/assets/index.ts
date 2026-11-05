/**
 * Optimized Arcade art (WebP). Source PNGs live in the design folder `assets/`.
 * Vite fingerprints these on build; the platform can also serve them from a CDN
 * by replacing these imports with URLs.
 */
import type { GameKind } from "../api/types";
import clawMachine from "./games/claw-machine.webp";
import plinko from "./games/plinko.webp";
import scratchAndWin from "./games/scratch-and-win.webp";
import arcadeLogo from "./layers/arcade-logo.webp";
import floor from "./layers/floor.webp";
import grunge from "./layers/grunge.webp";
import shards from "./layers/shards.webp";
import letterA1 from "./letters/letter-01-A-ice.webp";
import letterR from "./letters/letter-02-R-cyan.webp";
import letterC from "./letters/letter-03-C-magenta.webp";
import letterA2 from "./letters/letter-04-A-yellow.webp";
import letterD from "./letters/letter-05-D-pink.webp";
import letterE from "./letters/letter-06-E-foil.webp";

export const layers = { arcadeLogo, floor, grunge, shards };

/** Order, timing and color from `assets/arcade-letters/letters.json`. */
export const wordmarkLetters = [
    { glyph: "A", src: letterA1, delayMs: 0, color: "#E9F9FF" },
    { glyph: "R", src: letterR, delayMs: 100, color: "#00E7F2" },
    { glyph: "C", src: letterC, delayMs: 200, color: "#F000EC" },
    { glyph: "A", src: letterA2, delayMs: 300, color: "#EEFF00" },
    { glyph: "D", src: letterD, delayMs: 400, color: "#F000EC" },
    { glyph: "E", src: letterE, delayMs: 500, color: "#FF79E9" },
] as const;

export const gameArt: Record<GameKind, string> = {
    "claw-machine": clawMachine,
    plinko,
    "scratch-and-win": scratchAndWin,
};
