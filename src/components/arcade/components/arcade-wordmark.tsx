import type { CSSProperties } from "react";
import { cx } from "@/utils/cx";
import { wordmarkLetters } from "../assets";

export interface ArcadeWordmarkProps {
    /**
     * `enter`: letters slam in one by one and settle into the exact logo lockup.
     * `float`: letters idle-float (no entrance).
     * `static`: no motion (also what reduced-motion users get).
     */
    motion?: "enter" | "float" | "static";
    /** After the entrance, keep the letters gently bobbing instead of resting in the lockup. */
    idleFloat?: boolean;
    /** Delay before the first letter enters, in ms. */
    startDelayMs?: number;
    className?: string;
}

/**
 * Aspect ratio of the static logo (`assets/layers/arcade-logo.webp`, trimmed to its artwork).
 * The wordmark box uses the same ratio so it can swap 1:1 with the static logo.
 */
export const WORDMARK_ASPECT = 2085 / 733;

/**
 * Where each letter sits in the static logo, as % of the logo box.
 * Measured by template-matching each letter layer against `arcade logo 1.png`
 * (see HANDOFF.md). If the letter art is re-exported, re-measure and update here.
 * Later letters stack on top of earlier ones, as in the logo.
 */
const LETTER_LAYOUT: { left: number; top: number; width: number }[] = [
    { left: 0.67, top: 16.1, width: 28.87 }, // A (ice)
    { left: 19.57, top: 18.28, width: 23.06 }, // R (cyan)
    { left: 35.2, top: 19.1, width: 23.69 }, // C (magenta)
    { left: 44.8, top: 13.92, width: 22.79 }, // A (yellow)
    { left: 59.86, top: 9.0, width: 25.07 }, // D (pink)
    { left: 78.18, top: 8.46, width: 21.86 }, // E (foil)
];

/**
 * The ARCADE wordmark built from six independent letter layers so each one can
 * animate on its own. Once the entrance finishes, the letters rest exactly in the
 * static logo's lockup.
 */
export const ArcadeWordmark = ({ motion = "enter", idleFloat = false, startDelayMs = 0, className }: ArcadeWordmarkProps) => {
    const floats = motion === "float" || (motion === "enter" && idleFloat);

    return (
        <div role="img" aria-label="Arcade" className={cx("relative w-full", className)} style={{ aspectRatio: WORDMARK_ASPECT }}>
            {wordmarkLetters.map((letter, index) => {
                const layout = LETTER_LAYOUT[index];
                const delay = startDelayMs + letter.delayMs;
                return (
                    <span
                        key={index}
                        className={cx("absolute block", floats && "animate-arcade-float")}
                        style={
                            {
                                left: `${layout.left}%`,
                                top: `${layout.top}%`,
                                width: `${layout.width}%`,
                                zIndex: index + 1,
                                // Float starts after the entrance finishes, offset per letter so they bob out of sync.
                                animationDelay: `${motion === "enter" ? delay + 900 : 0}ms`,
                                animationDuration: `${2.8 + index * 0.25}s`,
                            } as CSSProperties
                        }
                    >
                        <img
                            src={letter.src}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className={cx(
                                "block h-auto w-full drop-shadow-[0_14px_24px_rgb(5_0_24/0.85)] select-none",
                                motion === "enter" && "animate-arcade-letter-in",
                            )}
                            style={{ animationDelay: `${delay}ms` }}
                        />
                    </span>
                );
            })}
        </div>
    );
};
