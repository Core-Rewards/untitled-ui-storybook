import { useEffect, useState } from "react";
import { cx } from "@/utils/cx";
import { formatNumber } from "@/utils/format";
import { POINTS_GAIN_TIMING, easeOutCubic, prefersReducedMotion } from "./use-count-up";

/** One "points won" event. A new `id` plays the animation again. */
export interface PointsAward {
    id: number;
    amount: number;
}

/** One run of the pill: flash in, count 0 → amount, hold, fade out, then unmount itself. */
const GainPill = ({ amount, className }: { amount: number; className?: string }) => {
    const [count, setCount] = useState(0);
    const [phase, setPhase] = useState<"in" | "out" | "done">("in");

    useEffect(() => {
        const { countUp, hold, fadeOut } = POINTS_GAIN_TIMING;
        const instant = prefersReducedMotion();
        const t0 = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const t = instant ? 1 : Math.min(1, (now - t0) / countUp);
            setCount(amount * easeOutCubic(t));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        const toOut = window.setTimeout(() => setPhase("out"), countUp + hold);
        const toDone = window.setTimeout(() => setPhase("done"), countUp + hold + fadeOut);
        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(toOut);
            window.clearTimeout(toDone);
        };
    }, [amount]);

    if (phase === "done") return null;
    return (
        <span
            aria-hidden="true"
            className={cx(
                "inline-flex shrink-0 items-center rounded-full bg-success-secondary px-2 py-0.5 text-sm font-semibold text-success-primary tabular-nums",
                "transition-opacity ease-out motion-safe:animate-points-flash",
                phase === "out" ? "opacity-0" : "opacity-100",
                className,
            )}
            style={{ transitionDuration: `${POINTS_GAIN_TIMING.fadeOut}ms` }}
        >
            +{formatNumber(Math.round(count))}
        </span>
    );
};

/**
 * "+250" next to the points balance: flashes in, counts up to the amount won,
 * holds, then fades out slowly. Pass a new `award` (new `id`) for each finished
 * play or batch of plays. An award that was already there when this mounted
 * (e.g. the mobile drawer opening) does not replay.
 */
export const PointsGain = ({ award, className }: { award?: PointsAward | null; className?: string }) => {
    const [mountedWithId] = useState(award?.id);
    const isNew = !!award && award.amount > 0 && award.id !== mountedWithId;
    return (
        <>
            {isNew && <GainPill key={award.id} amount={award.amount} className={className} />}
            <span className="sr-only" aria-live="polite">
                {isNew ? `You won ${formatNumber(award.amount)} points.` : ""}
            </span>
        </>
    );
};
