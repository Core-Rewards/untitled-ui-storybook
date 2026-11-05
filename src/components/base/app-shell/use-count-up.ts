import { useEffect, useRef, useState } from "react";

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Timing (ms) for the points-won counter. */
export const POINTS_GAIN_TIMING = { countUp: 900, hold: 3500, fadeOut: 1600 } as const;

/**
 * Animates a number from its previous value to `value` with an ease-out curve
 * (instant for reduced motion). Used for the points balance so it rolls up
 * alongside the "+N" counter.
 */
export const useCountUp = (value: number, duration: number = POINTS_GAIN_TIMING.countUp) => {
    const [display, setDisplay] = useState(value);
    const from = useRef(value);

    useEffect(() => {
        const start = from.current;
        if (start === value) return;
        const instant = prefersReducedMotion();
        const t0 = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const t = instant ? 1 : Math.min(1, (now - t0) / duration);
            const v = start + (value - start) * easeOutCubic(t);
            from.current = v;
            setDisplay(v);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return Math.round(display);
};
