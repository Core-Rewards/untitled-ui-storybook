import type { ReactNode } from "react";

// ── Goal definition ───────────────────────────────────────────────────────────

/**
 * What the goal measures. Sets the default number formatting and copy:
 * `currency` formats as money, `quantity` and `custom` append `unit`, `percent`
 * appends "%", and `points` appends the points label.
 */
export type GoalType = "currency" | "quantity" | "percent" | "points" | "custom";

/** A noun in both forms, so counts read naturally ("1 enrollment", "12 enrollments"). */
export type GoalUnit = {
    singular: string;
    plural: string;
};

/** Context passed to a custom `formatValue`. */
export type GoalFormatContext = {
    /** `true` for the short labels under tier markers: "$25K" rather than "$25,000", and counts without their unit. */
    compact: boolean;
};

// ── Tiers & rewards ───────────────────────────────────────────────────────────

export type GoalReward = {
    /** Points awarded when the tier is reached. */
    points?: number;
    /** A non-points reward, shown alongside or instead of points (e.g. "Trip entry"). */
    label?: string;
};

export type GoalTier = {
    /** Stable identifier, used as the React key and passed back through `onTierReached`. */
    id: string;
    /** Progress value at which this tier unlocks. Tiers can be passed in any order. */
    threshold: number;
    /** Tier name (e.g. "Silver", "Tier 2", "Stretch"). */
    label: string;
    /** What reaching the tier pays out. */
    reward?: GoalReward;
    /** Callout shown once the tier is reached (e.g. "You've unlocked Silver!"). */
    message?: string;
    /** Replaces the default trophy on this tier's marker once it is reached. */
    icon?: ReactNode;
};

/** Where a tier sits relative to current progress. */
export type TierStatus = "achieved" | "next" | "locked";

export type ResolvedTier = GoalTier & { status: TierStatus };

/**
 * How tier rewards add up. `cumulative` pays every tier reached (Gold also pays
 * Bronze and Silver); `highest` pays only the highest tier reached.
 */
export type RewardMode = "cumulative" | "highest";

/**
 * Continuous earning past a threshold, on top of tier rewards. For example,
 * `{ points: 1, every: 10 }` on a currency goal pays 1 point for every $10 over
 * the target.
 */
export type PointsPerUnit = {
    /** Points paid for each full `every` units. */
    points: number;
    /** Size of each earning step, in goal units. */
    every: number;
    /** Value earning starts counting from. Defaults to the goal target. */
    from?: number;
    /** Upper limit on points earned this way. */
    max?: number;
};

// ── Time period & pace ────────────────────────────────────────────────────────

export type GoalPeriod = {
    /** Period name shown in the header (e.g. "Q3 2026"). */
    label?: string;
    start: Date | string;
    end: Date | string;
};

/** Where `now` falls relative to the goal period. */
export type PeriodPhase = "upcoming" | "active" | "ended";

export type PeriodInfo = {
    phase: PeriodPhase;
    label?: string;
    start: Date;
    end: Date;
    /** Share of the period already elapsed, from 0 to 1. */
    elapsedFraction: number;
    /** Whole days left, counting today. `0` once the period has ended. */
    daysLeft: number;
};

/** Progress compared to where a straight line from start to target says it should be by now. */
export type PaceStatus = "ahead" | "on-track" | "behind";

export type PaceInfo = {
    status: PaceStatus;
    /** Where progress should be by now to finish exactly on target. */
    expectedValue: number;
    /** Where progress will land by the period end if the current rate holds. */
    projectedValue: number;
};

// ── Status & messaging ────────────────────────────────────────────────────────

/**
 * Overall goal state, in priority order: a closed period is `ended`; one that
 * hasn't opened is `upcoming`; otherwise `completed` once the target is reached,
 * `not-started` with no progress, and `in-progress` in between.
 */
export type GoalStatus = "upcoming" | "not-started" | "in-progress" | "completed" | "ended";

/**
 * Message templates for each status. They accept these tokens:
 * `{value}`, `{target}`, `{percent}`, `{remaining}`, `{nextTier}`, `{nextThreshold}`,
 * `{reward}`, `{currentTier}`, `{earned}`, `{potential}`, `{daysLeft}`,
 * `{startDate}` and `{endDate}`. A token with nothing to fill it renders empty.
 */
export type GoalMessages = Partial<Record<"upcoming" | "notStarted" | "inProgress" | "completed" | "ended", string>>;

/** Everything the meter has worked out, passed to `renderMessage`. */
export type GoalMeterState = {
    status: GoalStatus;
    value: number;
    startValue: number;
    target: number;
    /** Progress toward the target as a whole percentage. Can exceed 100. */
    percent: number;
    tiers: ResolvedTier[];
    /** Highest tier reached, or `null` before the first. */
    currentTier: GoalTier | null;
    /** First tier not yet reached, or `null` once every tier is reached. */
    nextTier: GoalTier | null;
    /** Distance to the next tier (or the target, past the last tier). `null` once the target is reached. */
    remaining: number | null;
    /** Tier points plus any points-per-unit bonus earned so far. */
    pointsEarned: number;
    /** Tier points still available from tiers not yet reached. */
    pointsAvailable: number;
    /** The points-per-unit share of `pointsEarned`. */
    bonusPoints: number;
    period: PeriodInfo | null;
    pace: PaceInfo | null;
    /** Formats a number the same way the meter does. */
    formatValue: (value: number) => string;
};

// ── Display ───────────────────────────────────────────────────────────────────

/** `linear` is a bar with tier markers, `segmented` is one block per tier, `radial` is a ring gauge. */
export type GoalMeterVariant = "linear" | "segmented" | "radial";

export type GoalMeterSize = "sm" | "md" | "lg";

/** `card` is the full bordered panel with header, messages and points; `inline` is just the meter. */
export type GoalMeterLayout = "card" | "inline";
