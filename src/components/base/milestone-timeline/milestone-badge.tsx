import { useId } from "react";
import type { FC } from "react";
import { Check, CoinsStacked01, Gift01, Lock01 } from "@untitledui/icons";
import { cx, sortCx } from "@/utils/cx";
import type { MilestoneReward, MilestoneState } from "./milestone-timeline-types";

export type MilestoneBadgeSize = "sm" | "md" | "lg";

const PX: Record<MilestoneBadgeSize, number> = { sm: 44, md: 64, lg: 96 };

const styles = sortCx({
    pip: "absolute flex items-center justify-center rounded-full",
    ping: "absolute inset-0 rounded-full bg-brand-solid opacity-40 motion-safe:animate-[milestone-ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]",
});

/** SVG fills per state. Brand tokens, so the badge follows the theme. */
const palette = {
    earned: { disc: "var(--color-brand-600)", number: "#fff", caption: "var(--color-brand-200)" },
    next: {
        ring: "var(--color-bg-primary)",
        stroke: "var(--color-brand-400)",
        disc: "var(--color-brand-50)",
        number: "var(--color-brand-700)",
        caption: "var(--color-brand-600)",
    },
    upcoming: {
        ring: "var(--color-bg-tertiary)",
        stroke: "var(--color-border-secondary)",
        disc: "var(--color-bg-secondary)",
        number: "var(--color-fg-quaternary)",
        caption: "var(--color-fg-quaternary)",
    },
};

export interface MilestoneBadgeProps {
    /** The number on the badge, e.g. `5` for a 5-year milestone. */
    value: number;
    /** Word under the number, e.g. `YEARS`. Hidden at `sm`. */
    caption?: string;
    state: MilestoneState;
    /** Product milestones get a solid brand ring; points milestones a brushed-metal one. */
    rewardType?: MilestoneReward["type"];
    size?: MilestoneBadgeSize;
    /** Screen-reader name, e.g. `5-year milestone, reward ready to redeem`. */
    label: string;
    className?: string;
}

/**
 * Numbered medallion for a milestone. Earned milestones are solid brand with
 * the number in white, the next one is outlined, and later ones are muted. A
 * reward waiting to be redeemed pulses and carries a gift (or coins) pip.
 */
export const MilestoneBadge: FC<MilestoneBadgeProps> = ({ value, caption, state, rewardType = "product", size = "md", label, className }) => {
    const uid = useId().replace(/:/g, "");
    const d = PX[size];
    const earned = state === "redeemed" || state === "ready" || state === "reached";
    const showCaption = size !== "sm" && caption;
    const digits = String(value).length;
    const pip = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-6";
    const pipIcon = size === "sm" ? "size-2.5" : size === "lg" ? "size-4" : "size-3.5";
    const colors = earned ? palette.earned : palette[state === "next" ? "next" : "upcoming"];
    const ReadyIcon = rewardType === "points" ? CoinsStacked01 : Gift01;

    return (
        <span role="img" aria-label={label} className={cx("relative inline-flex shrink-0", className)} style={{ width: d, height: d }}>
            {state === "ready" && <span className={styles.ping} aria-hidden="true" />}

            <svg viewBox="0 0 100 100" width={d} height={d} className="relative" aria-hidden="true">
                <defs>
                    <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="var(--color-brand-50)" />
                        <stop offset=".45" stopColor="var(--color-brand-300)" />
                        <stop offset=".7" stopColor="var(--color-brand-100)" />
                        <stop offset="1" stopColor="var(--color-brand-500)" />
                    </linearGradient>
                    <clipPath id={`clip-${uid}`}>
                        <circle cx="50" cy="50" r="40" />
                    </clipPath>
                </defs>

                {/* Ring */}
                {earned ? (
                    <circle cx="50" cy="50" r="48" fill={rewardType === "points" ? `url(#metal-${uid})` : "var(--color-brand-300)"} />
                ) : state === "next" ? (
                    <circle cx="50" cy="50" r="46" fill={palette.next.ring} stroke={palette.next.stroke} strokeWidth="3" strokeDasharray="6 5" />
                ) : (
                    <circle cx="50" cy="50" r="47" fill={palette.upcoming.ring} stroke={palette.upcoming.stroke} strokeWidth="2" />
                )}

                {/* Disc, with a diagonal sheen once earned */}
                <circle cx="50" cy="50" r="40" fill={colors.disc} />
                {earned && (
                    <g clipPath={`url(#clip-${uid})`}>
                        <polygon points="18,4 34,4 58,56 50,72" fill="#fff" opacity=".14" />
                    </g>
                )}

                <text
                    x="50"
                    y={showCaption ? 57 : 60}
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontWeight={800}
                    fontSize={digits >= 3 ? 28 : digits === 2 ? 34 : 40}
                    fill={colors.number}
                >
                    {value}
                </text>
                {showCaption && (
                    <text
                        x="50"
                        y="74"
                        textAnchor="middle"
                        fontFamily="Inter, sans-serif"
                        fontWeight={700}
                        fontSize="9"
                        letterSpacing="1.5"
                        fill={colors.caption}
                        // Long words squeeze to fit inside the disc rather than spilling over the ring.
                        {...(caption.length > 7 ? { textLength: 56, lengthAdjust: "spacingAndGlyphs" } : {})}
                    >
                        {caption}
                    </text>
                )}
            </svg>

            {state === "ready" && (
                <span className={cx(styles.pip, "-top-0.5 -right-0.5 bg-primary shadow-sm ring-2 ring-bg-brand-solid", pip)}>
                    <ReadyIcon className={cx("text-brand-secondary", pipIcon)} aria-hidden="true" />
                </span>
            )}
            {state === "redeemed" && (
                <span className={cx(styles.pip, "-right-0.5 -bottom-0.5 bg-brand-solid ring-2 ring-bg-primary", pip)}>
                    <Check className={cx("text-white", pipIcon)} strokeWidth={3} aria-hidden="true" />
                </span>
            )}
            {state === "upcoming" && size !== "sm" && (
                <span className={cx(styles.pip, "-right-0.5 -bottom-0.5 bg-primary ring-1 ring-secondary", pip)}>
                    <Lock01 className={cx("text-fg-quaternary", pipIcon)} aria-hidden="true" />
                </span>
            )}
        </span>
    );
};
