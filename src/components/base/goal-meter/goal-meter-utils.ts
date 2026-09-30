import type {
    GoalFormatContext,
    GoalPeriod,
    GoalReward,
    GoalStatus,
    GoalTier,
    GoalType,
    GoalUnit,
    PaceInfo,
    PeriodInfo,
    PointsPerUnit,
    ResolvedTier,
    RewardMode,
    TierStatus,
} from "./goal-meter-types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_POINTS_LABEL: GoalUnit = { singular: "point", plural: "points" };

const DEFAULT_UNITS: Partial<Record<GoalType, GoalUnit>> = {
    quantity: { singular: "unit", plural: "units" },
};

// ── Tiers ─────────────────────────────────────────────────────────────────────

/** Tiers sorted by threshold, so callers can pass them in any order. */
export const sortTiers = (tiers: GoalTier[]): GoalTier[] => [...tiers].sort((a, b) => a.threshold - b.threshold);

/** The goal target: `target` when given, otherwise the highest tier threshold. */
export const resolveTarget = (tiers: GoalTier[], target?: number): number =>
    target ?? sortTiers(tiers).at(-1)?.threshold ?? 0;

/** Id of the implicit tier added at the target when no tier sits there. */
export const GOAL_TIER_ID = "__goal";

/**
 * Sorted tiers ready to render. When no tier sits at the target (including a
 * goal with no tiers at all), an implicit "Goal" tier is appended there, so
 * every variant always has a marker for the finish line.
 */
export const resolveTiers = (tiers: GoalTier[] | undefined, target: number): GoalTier[] => {
    const sorted = sortTiers(tiers ?? []);
    const top = sorted.at(-1);
    return !top || target > top.threshold ? [...sorted, { id: GOAL_TIER_ID, threshold: target, label: "Goal" }] : sorted;
};

export const getTierStatus = (tier: GoalTier, sortedTiers: GoalTier[], value: number): TierStatus => {
    if (value >= tier.threshold) return "achieved";
    return getNextTier(sortedTiers, value)?.id === tier.id ? "next" : "locked";
};

export const withTierStatus = (sortedTiers: GoalTier[], value: number): ResolvedTier[] =>
    sortedTiers.map((tier) => ({ ...tier, status: getTierStatus(tier, sortedTiers, value) }));

/** The highest tier reached, or `null` before the first. */
export const getCurrentTier = (sortedTiers: GoalTier[], value: number): GoalTier | null =>
    sortedTiers.filter((tier) => value >= tier.threshold).at(-1) ?? null;

/** The first tier not yet reached, or `null` once every tier is reached. */
export const getNextTier = (sortedTiers: GoalTier[], value: number): GoalTier | null =>
    sortedTiers.find((tier) => value < tier.threshold) ?? null;

/** Tiers crossed on the way up from `from` to `to`, lowest first. Empty when progress went down. */
export const getTiersCrossed = (sortedTiers: GoalTier[], from: number, to: number): GoalTier[] =>
    sortedTiers.filter((tier) => from < tier.threshold && to >= tier.threshold);

// ── Progress ──────────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** How far `value` sits between `start` and `end`, from 0 to 1. */
export const getFraction = (value: number, start: number, end: number): number =>
    end <= start ? (value >= end ? 1 : 0) : clamp((value - start) / (end - start), 0, 1);

/** Progress toward the target as a whole percentage, floored so 99.6% never reads as 100%. Can exceed 100. */
export const getPercentOfGoal = (value: number, start: number, target: number): number => {
    if (target <= start) return value >= target ? 100 : 0;
    return Math.max(0, Math.floor(((value - start) / (target - start)) * 100));
};

/**
 * Progress past the target as a share of one full goal, from 0 to 1. Drives the
 * second "lap" drawn over a full meter: 112% of goal is an overflow of 0.12.
 */
export const getOverflowFraction = (value: number, start: number, target: number): number =>
    value <= target || target <= start ? 0 : clamp((value - target) / (target - start), 0, 1);

// ── Rewards ───────────────────────────────────────────────────────────────────

const tierPoints = (tier: GoalTier) => tier.reward?.points ?? 0;

/** Tier points earned at `value` under the given reward mode. */
export const getTierPointsEarned = (sortedTiers: GoalTier[], value: number, mode: RewardMode): number => {
    const achieved = sortedTiers.filter((tier) => value >= tier.threshold);
    if (mode === "highest") return achieved.length > 0 ? tierPoints(achieved.at(-1)!) : 0;
    return achieved.reduce((sum, tier) => sum + tierPoints(tier), 0);
};

/** The most tier points the goal can pay out. */
export const getTierPointsPotential = (sortedTiers: GoalTier[], mode: RewardMode): number =>
    getTierPointsEarned(sortedTiers, Number.POSITIVE_INFINITY, mode);

/** Points earned through a points-per-unit rule. */
export const getUnitPoints = (value: number, rule: PointsPerUnit | undefined, target: number): number => {
    if (!rule || rule.every <= 0) return 0;
    const from = rule.from ?? target;
    const steps = Math.floor(Math.max(0, value - from) / rule.every);
    const points = steps * rule.points;
    return rule.max === undefined ? points : Math.min(points, rule.max);
};

// ── Period & pace ─────────────────────────────────────────────────────────────

/**
 * Accepts a `Date` or a date string. A bare "YYYY-MM-DD" is read as local time
 * (not UTC, which would shift it a day west of Greenwich), and a period end with
 * no time of day runs to the end of that day, so the last day counts in full.
 */
export const toDate = (value: Date | string, edge: "start" | "end"): Date => {
    const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
    const isMidnight =
        date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
    if (edge === "end" && isMidnight) date.setHours(23, 59, 59, 999);
    return date;
};

export const getPeriodInfo = (period: GoalPeriod | undefined, now: Date): PeriodInfo | null => {
    if (!period) return null;
    const start = toDate(period.start, "start");
    const end = toDate(period.end, "end");
    const time = now.getTime();
    const phase = time < start.getTime() ? "upcoming" : time > end.getTime() ? "ended" : "active";
    const span = end.getTime() - start.getTime();

    return {
        phase,
        label: period.label,
        start,
        end,
        elapsedFraction: span <= 0 ? 1 : clamp((time - start.getTime()) / span, 0, 1),
        daysLeft: phase === "ended" ? 0 : Math.ceil((end.getTime() - Math.max(time, start.getTime())) / DAY_MS),
    };
};

/**
 * Compares progress to a straight line from `start` at the period open to
 * `target` at the period close. `tolerance` is the share of the full goal that
 * still counts as on track either side of that line.
 */
export const getPace = (
    value: number,
    start: number,
    target: number,
    period: PeriodInfo | null,
    tolerance: number,
): PaceInfo | null => {
    if (!period || period.phase !== "active" || target <= start) return null;
    const span = target - start;
    const expectedValue = start + span * period.elapsedFraction;
    const projectedValue = period.elapsedFraction > 0 ? start + (value - start) / period.elapsedFraction : value;
    const gap = value - expectedValue;
    const status = gap > span * tolerance ? "ahead" : gap < -span * tolerance ? "behind" : "on-track";
    return { status, expectedValue, projectedValue };
};

export const getGoalStatus = (value: number, start: number, target: number, period: PeriodInfo | null): GoalStatus => {
    if (period?.phase === "ended") return "ended";
    if (period?.phase === "upcoming") return "upcoming";
    if (value >= target) return "completed";
    if (value <= start) return "not-started";
    return "in-progress";
};

// ── Formatting ────────────────────────────────────────────────────────────────

export type ValueFormatOptions = {
    goalType: GoalType;
    unit?: GoalUnit;
    currency: string;
    locale?: string;
    pointsLabel: GoalUnit;
    formatValue?: (value: number, context: GoalFormatContext) => string;
};

const pluralize = (count: number, unit: GoalUnit) => (count === 1 ? unit.singular : unit.plural);

/**
 * Formats a goal value for display. Values are rounded to what the goal type can
 * actually hold, which also keeps the count-up animation from flashing decimals.
 */
export const formatGoalValue = (value: number, options: ValueFormatOptions, compact = false): string => {
    if (options.formatValue) return options.formatValue(value, { compact });

    const { goalType, locale, currency } = options;
    const notation = compact ? "compact" : "standard";

    if (goalType === "currency") {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            notation,
            maximumFractionDigits: compact ? 1 : 0,
        }).format(Math.round(value));
    }

    if (goalType === "percent") {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`;
    }

    const rounded = Math.round(value);
    const number = new Intl.NumberFormat(locale, { notation, maximumFractionDigits: compact ? 1 : 0 }).format(rounded);
    // Compact labels sit under tier markers, next to a headline that already names the unit.
    const unit = goalType === "points" ? (options.unit ?? options.pointsLabel) : (options.unit ?? DEFAULT_UNITS[goalType]);
    return unit && !compact ? `${number} ${pluralize(rounded, unit)}` : number;
};

export const formatPoints = (points: number, label: GoalUnit, locale?: string): string =>
    `${new Intl.NumberFormat(locale).format(points)} ${pluralize(points, label)}`;

/** "500 points", "Trip entry", or "500 points + Trip entry". Empty when the tier pays nothing. */
export const formatReward = (reward: GoalReward | undefined, label: GoalUnit, locale?: string): string =>
    [reward?.points ? formatPoints(reward.points, label, locale) : null, reward?.label].filter(Boolean).join(" + ");

/** "1 point for every $10 over goal". */
export const formatUnitRule = (rule: PointsPerUnit, target: number, options: ValueFormatOptions): string => {
    const from = rule.from ?? target;
    const over = from === target ? "over goal" : `over ${formatGoalValue(from, options)}`;
    return `${formatPoints(rule.points, options.pointsLabel, options.locale)} for every ${formatGoalValue(rule.every, options)} ${over}`;
};

export const formatShortDate = (date: Date, locale?: string): string =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);

/** "12 days left" / "Last day" / "Ended Sep 30" / "Starts Oct 1". */
export const formatPeriodCountdown = (period: PeriodInfo, locale?: string): string => {
    if (period.phase === "upcoming") return `Starts ${formatShortDate(period.start, locale)}`;
    if (period.phase === "ended") return `Ended ${formatShortDate(period.end, locale)}`;
    return period.daysLeft <= 1 ? "Last day" : `${period.daysLeft} days left`;
};

// ── Messages ──────────────────────────────────────────────────────────────────

/** Replaces `{token}` placeholders. Unknown or empty tokens render as nothing. */
export const fillTemplate = (template: string, tokens: Record<string, string>): string =>
    template
        .replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? "")
        .replace(/\s{2,}/g, " ")
        .trim();
