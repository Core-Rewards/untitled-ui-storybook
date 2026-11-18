import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";
import type { SessionWinningsTotals } from "../api/use-session-winnings";

const COUNT_MS = 600;

/** Rolls the displayed number up to `target` whenever it grows. */
const useCountUp = (target: number, animate: boolean) => {
    const [shown, setShown] = useState(target);
    const current = useRef(target);

    useEffect(() => {
        const start = current.current;
        if (!animate || start === target) {
            current.current = target;
            return;
        }
        const startedAt = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / COUNT_MS);
            const value = Math.round(start + (target - start) * (1 - (1 - progress) ** 3));
            current.current = value;
            setShown(value);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, animate]);

    return animate ? shown : target;
};

export interface SessionWinningsProps {
    totals: SessionWinningsTotals;
    reducedMotion?: boolean;
    className?: string;
}

/**
 * "Won this session" strip for a game screen: points won in this game during the
 * visit, how many plays that took, and any non-points prizes. Hidden until the
 * first play lands.
 */
export const SessionWinnings = ({ totals, reducedMotion, className }: SessionWinningsProps) => {
    const points = useCountUp(totals.points, !reducedMotion);
    if (totals.plays === 0) return null;
    const showPoints = totals.points > 0 || totals.prizes === 0;

    return (
        <p
            className={cx(
                "flex w-full max-w-xl flex-wrap items-baseline justify-center gap-x-3 gap-y-1 bg-arcade-night/95 px-5 py-3 font-arcade-mono text-[11px] tracking-[0.18em] uppercase arcade-frame",
                className,
            )}
        >
            <span className="text-arcade-muted">Won this session</span>
            {/* A session of gear only reads "1 prize", not "0 pts + 1 prize". */}
            {showPoints && (
                <span className="text-xl leading-none font-bold tracking-[0.08em] text-arcade-acid tabular-nums">
                    {points.toLocaleString("en-US")} <span className="text-sm">pts</span>
                </span>
            )}
            {totals.prizes > 0 && (
                <span className="text-arcade-magenta">
                    {showPoints && "+ "}
                    {totals.prizes} {totals.prizes === 1 ? "prize" : "prizes"}
                </span>
            )}
            <span className="text-arcade-ice">
                {totals.plays} {totals.plays === 1 ? "play" : "plays"}
            </span>
        </p>
    );
};
