import type { FC } from "react";
import { Check, Lock01, Trophy01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { DEFAULT_CYCLE_LENGTH, DEFAULT_MILESTONES, type StreakData, type StreakMilestone } from "./quiz-types";
import {
    clampStreak,
    formatMonthSpan,
    formatMonths,
    getMilestoneStatus,
    getMonthsToNextMilestone,
    getNextMilestone,
    getRailFillPercent,
    getStreakMonthStatus,
    sortMilestones,
    type MilestoneStatus,
} from "./streak-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StreakTrackerProps extends StreakData {
    /** `full` renders the whole cycle as a rail of months; `compact` renders a single summary row. */
    variant?: "full" | "compact";
    /** Milestone month to celebrate — plays a pop animation on that marker. */
    celebrateMilestone?: number;
    className?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Streak mark. Untitled UI ships no flame icon, so this is drawn as a solid
 * silhouette — the same treatment the wishlist heart uses in `product-details`,
 * which stays legible at the 20px size used here.
 */
const FlameIcon: FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
            fill="currentColor"
            d="M9.7 21.3A6.6 6.6 0 0 1 6 15.4c0-2.9 1.9-4.8 3.6-6.7C11.4 6.6 12.7 4.6 12.3 2c3 2.4 5.6 5.4 6.4 8.9.3-1 .3-2.1 0-3.1 2.1 2.6 2.6 6.4 1 9.4a7.3 7.3 0 0 1-5.6 3.9c1.1-1 1.6-2.5 1.3-3.9-.3-1.5-1.4-2.6-2.6-3.4-.6 1.4-.6 3 .1 4.4-1.4-.4-2.5-1.5-3.2-2.8-.6 1.5-.6 3.2 0 4.7z"
        />
    </svg>
);

/**
 * Node colours shared by plain months and milestone markers. Ring *offsets* are
 * applied at the call site instead, so they can shrink on narrow screens.
 */
const nodeStyles: Record<MilestoneStatus | "complete" | "active" | "upcoming", string> = {
    complete: "bg-brand-solid text-white",
    active: "bg-brand-50 text-brand-700 ring-2 ring-brand-solid",
    upcoming: "bg-gray-200 text-tertiary",
    earned: "bg-brand-solid text-white ring-2 ring-brand-100",
    next: "bg-brand-50 text-brand-700 ring-2 ring-brand-solid",
    locked: "bg-gray-200 text-fg-quaternary ring-2 ring-gray-300",
};

// ── Main component ────────────────────────────────────────────────────────────

export const StreakTracker: FC<StreakTrackerProps> = ({
    currentStreak,
    cycleLength = DEFAULT_CYCLE_LENGTH,
    milestones = DEFAULT_MILESTONES,
    lostStreak,
    variant = "full",
    celebrateMilestone,
    className,
}) => {
    const streak = clampStreak(currentStreak, cycleLength);
    const sorted = sortMilestones(milestones);
    const nextMilestone = getNextMilestone(sorted, streak);
    const monthsToNext = getMonthsToNextMilestone(sorted, streak);
    const isCycleComplete = streak >= cycleLength;

    // One-line status under the heading, in priority order.
    const statusMessage = (() => {
        if (isCycleComplete) {
            return `You finished the full ${formatMonthSpan(cycleLength)} run. Your streak starts over next month.`;
        }
        if (streak === 0) {
            return lostStreak
                ? `Your ${formatMonthSpan(lostStreak)} streak ended. Answer this month's quiz to start a new one.`
                : "Answer this month's quiz to start your streak.";
        }
        if (nextMilestone && monthsToNext !== null) {
            return `${formatMonths(monthsToNext)} to go until you earn ${nextMilestone.reward}.`;
        }
        return `Keep answering each month to grow your streak.`;
    })();

    // ── Compact variant ───────────────────────────────────────────────────────
    if (variant === "compact") {
        const progressPercent = nextMilestone ? (streak / nextMilestone.month) * 100 : 100;

        return (
            <div className={cx("rounded-xl border border-gray-200 px-4 py-3.5", className)}>
                <div className="flex items-center gap-3">
                    <div
                        className={cx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            streak > 0 ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-tertiary",
                        )}
                    >
                        <FlameIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">
                            {streak === 0 ? "No streak yet" : `${formatMonthSpan(streak)} streak`}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-tertiary">{statusMessage}</p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-brand-secondary tabular-nums">
                        {streak}/{cycleLength}
                    </p>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div
                        className="h-full rounded-full bg-brand-solid transition-[width] duration-700 ease-out"
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                        role="progressbar"
                        aria-valuenow={streak}
                        aria-valuemin={0}
                        aria-valuemax={cycleLength}
                        aria-label="Quiz streak progress"
                    />
                </div>
            </div>
        );
    }

    // ── Full variant ──────────────────────────────────────────────────────────
    const months = Array.from({ length: cycleLength }, (_, index) => index + 1);
    const milestoneByMonth = new Map(sorted.map((milestone) => [milestone.month, milestone]));

    // The rail spans node centres, so it is inset by half a column on each side.
    const halfColumn = 50 / cycleLength;

    return (
        <div className={cx("rounded-xl border border-gray-200 px-5 py-5", className)}>

            {/* ── Heading ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cx(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            streak > 0 ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-tertiary",
                        )}
                    >
                        <FlameIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-primary">
                            {streak === 0 ? "No streak yet" : `${formatMonthSpan(streak)} streak`}
                        </h3>
                        <p className="mt-0.5 text-sm text-tertiary">{statusMessage}</p>
                    </div>
                </div>

                <p className="shrink-0 pt-1 text-sm font-semibold text-brand-secondary tabular-nums">
                    {streak}/{cycleLength}
                </p>
            </div>

            {/* ── Month rail ───────────────────────────────────────────────── */}
            {/*
                Nodes shrink on narrow screens so a full 12-month cycle still fits
                without colliding. `minWidth` keeps them legible if the tracker is
                dropped into something narrower than a phone, scrolling rather than
                overlapping; on wider screens it never triggers.
            */}
            {/*
                `overflow-x-auto` promotes overflow-y from `visible` to `auto`, so this
                wrapper clips vertically too. The padding gives the milestone rings and
                the celebration halo (which scales to ~2.1x) room inside the clip box —
                without it, ringed markers are shaved flat at the top.
            */}
            <div className="mt-1 overflow-x-auto px-1.5 pt-6 scrollbar-hide">
                <div className="relative pb-9" style={{ minWidth: `${cycleLength * 1.5}rem` }}>

                    {/* Track + fill, centred on the node row (h-8 → 1rem) */}
                    <div
                        className="absolute top-4 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-gray-100"
                        style={{ left: `${halfColumn}%`, right: `${halfColumn}%` }}
                        aria-hidden="true"
                    >
                        <div
                            className="h-full rounded-full bg-brand-solid transition-[width] duration-700 ease-out"
                            style={{ width: `${getRailFillPercent(streak, cycleLength)}%` }}
                        />
                    </div>

                    <ol
                        className="relative flex list-none items-start"
                        aria-label={`Quiz streak: ${formatMonths(streak)} of ${cycleLength} complete`}
                    >
                        {months.map((month) => {
                            const milestone = milestoneByMonth.get(month);
                            const monthStatus = getStreakMonthStatus(month, streak);
                            const status: MilestoneStatus | typeof monthStatus = milestone
                                ? getMilestoneStatus(milestone, sorted, streak)
                                : monthStatus;
                            const isCelebrating = celebrateMilestone === month;
                            const isLastMonth = month === cycleLength;

                            // Milestones are always the larger marker; plain months are dots.
                            const nodeSize = milestone ? "h-6 w-6 sm:h-8 sm:w-8" : "h-4 w-4 sm:h-6 sm:w-6";

                            return (
                                <li key={month} className="relative flex flex-1 flex-col items-center">

                                    {/* Node */}
                                    <div className="relative flex h-8 items-center justify-center">
                                        {/* Celebration halo */}
                                        {isCelebrating && (
                                            <span
                                                aria-hidden="true"
                                                className={cx(
                                                    "absolute inset-0 m-auto rounded-full bg-brand-solid opacity-40 motion-safe:animate-[streak-halo_1.1s_ease-out_2]",
                                                    nodeSize,
                                                )}
                                            />
                                        )}

                                        {/* Breathing halo on the month in play */}
                                        {monthStatus === "active" && !isCelebrating && (
                                            <span
                                                aria-hidden="true"
                                                className={cx(
                                                    "absolute inset-0 m-auto rounded-full bg-brand-solid motion-safe:animate-[streak-pulse_2.2s_ease-in-out_infinite]",
                                                    nodeSize,
                                                )}
                                            />
                                        )}

                                        <span
                                            className={cx(
                                                "relative flex items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors duration-300",
                                                nodeSize,
                                                nodeStyles[status],
                                                milestone && "ring-offset-1 sm:ring-offset-2",
                                                isCelebrating && "motion-safe:animate-[streak-pop_0.5s_ease-out]",
                                            )}
                                            title={milestone ? `Month ${month} — ${milestone.reward}` : `Month ${month}`}
                                        >
                                            {milestone ? (
                                                status === "locked" ? (
                                                    <Lock01 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                ) : (
                                                    <Trophy01 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                )
                                            ) : (
                                                // Plain months are too small for a glyph on mobile — the
                                                // filled dot carries the state on its own.
                                                <span className="hidden sm:flex sm:items-center sm:justify-center">
                                                    {monthStatus === "complete" ? <Check className="h-3.5 w-3.5" /> : month}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Milestone reward label — edge-aligned on the final month so it stays in frame */}
                                    {milestone && (
                                        <span
                                            className={cx(
                                                "absolute top-10 whitespace-nowrap text-center text-[10px] leading-tight sm:text-xs",
                                                isLastMonth ? "right-0" : "left-1/2 -translate-x-1/2",
                                                status === "earned" ? "font-semibold text-brand-secondary" : "text-tertiary",
                                            )}
                                        >
                                            {milestone.reward}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>

            {/* ── Footnote ─────────────────────────────────────────────────── */}
            <p className="border-t border-gray-100 pt-4 text-xs text-tertiary">
                Answer the quiz every month to keep your streak alive. Miss a month and it resets to zero.
                Streaks also start over after {formatMonths(cycleLength)}.
            </p>
        </div>
    );
};

export type { StreakMilestone };
