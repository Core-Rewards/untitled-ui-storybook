import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties, type FC, type ReactNode } from "react";
import { Check, Lock01, TrendDown01, TrendUp01, Trophy01 } from "@untitledui/icons";
import { Badge, type BadgeColor } from "@/components/base/badges/badge";
import { usePrefersReducedMotion } from "@/components/base/carousel/use-prefers-reduced-motion";
import { cx } from "@/utils/cx";
import type {
    GoalFormatContext,
    GoalMessages,
    GoalMeterLayout,
    GoalMeterSize,
    GoalMeterState,
    GoalMeterVariant,
    GoalPeriod,
    GoalStatus,
    GoalTier,
    GoalType,
    GoalUnit,
    PaceStatus,
    PointsPerUnit,
    ResolvedTier,
    RewardMode,
} from "./goal-meter-types";
import {
    DEFAULT_POINTS_LABEL,
    GOAL_TIER_ID,
    fillTemplate,
    formatGoalValue,
    formatPeriodCountdown,
    formatPoints,
    formatReward,
    formatShortDate,
    formatUnitRule,
    getCurrentTier,
    getFraction,
    getGoalStatus,
    getNextTier,
    getOverflowFraction,
    getPace,
    getPercentOfGoal,
    getPeriodInfo,
    getTierPointsEarned,
    getTierPointsPotential,
    getTiersCrossed,
    getUnitPoints,
    resolveTarget,
    resolveTiers,
    withTierStatus,
    type ValueFormatOptions,
} from "./goal-meter-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoalMeterProps {
    // Goal definition
    /** Heading for the card layout, and the meter's accessible name (e.g. "Q3 Sales Goal"). */
    title?: string;
    /** Supporting line under the title (e.g. "Sell $50K in accessories this quarter"). */
    description?: string;
    /** What the goal measures. Sets the default formatting. Defaults to `quantity`. */
    goalType?: GoalType;
    /** Unit noun for `quantity` and `custom` goals (e.g. enrollment / enrollments). */
    unit?: GoalUnit;
    /** ISO 4217 code for `currency` goals. Defaults to `USD`. */
    currency?: string;
    /** Locale for numbers and dates. Defaults to the browser locale. */
    locale?: string;
    /** Replaces the built-in number formatting everywhere the meter shows a value. */
    formatValue?: (value: number, context: GoalFormatContext) => string;

    // Progress
    /** Current progress. */
    value: number;
    /** Baseline the goal is measured from. Defaults to 0. */
    startValue?: number;
    /** The finish line. Defaults to the highest tier threshold. */
    target?: number;
    /**
     * Last value the viewer saw. The meter animates up from here, shows the gain,
     * and celebrates any tier crossed since.
     */
    previousValue?: number;
    /** Keep counting past 100% (drawn as a second lap on the meter) instead of stopping at the target. */
    allowOverachievement?: boolean;

    // Tiers & points
    /** Reward tiers. Can be passed in any order. */
    tiers?: GoalTier[];
    /** Whether reaching a tier also pays the tiers below it. Defaults to `cumulative`. */
    rewardMode?: RewardMode;
    /** Name of the rewards currency. Defaults to point / points. */
    pointsLabel?: GoalUnit;
    /** Continuous earning past a threshold (the target by default), on top of tier rewards. */
    pointsPerUnit?: PointsPerUnit;

    // Period & pace
    /** The window the goal runs in. Adds a countdown and enables pace tracking. */
    period?: GoalPeriod;
    /** The current time. Defaults to now; pass a fixed date for stable previews and tests. */
    now?: Date;
    /** Compare progress to where it should be by now, with a badge and a marker. Needs `period`. */
    showPace?: boolean;
    /** Share of the goal either side of the pace line that still counts as on track. Defaults to 0.05. */
    paceTolerance?: number;
    /** Forces a status instead of working it out from `value`, `target` and `period`. */
    status?: GoalStatus;

    // Messaging
    /** Replaces the default message for one or more statuses. Supports `{token}` placeholders. */
    messages?: GoalMessages;
    /** Full control over the status message. Receives the computed state and the default message. */
    renderMessage?: (state: GoalMeterState, defaultMessage: string) => ReactNode;

    // Display
    /** Defaults to `linear`. */
    variant?: GoalMeterVariant;
    /** Defaults to `md`. */
    size?: GoalMeterSize;
    /** `card` is the full panel; `inline` is just the meter, for tables and lists. Defaults to `card`. */
    layout?: GoalMeterLayout;
    /** Show tier markers and their labels. Defaults to `true`. */
    showTierMarkers?: boolean;
    /** Show the value and percentage. Defaults to `true`. */
    showValues?: boolean;
    /** Show tier rewards and the points summary. Defaults to `true`. */
    showRewards?: boolean;

    // Behavior
    /** Count up and fill on mount and whenever `value` changes. Skipped for reduced motion. Defaults to `true`. */
    animate?: boolean;
    /** Play a celebration on tiers crossed since `previousValue` or the last render. Defaults to `true`. */
    celebrate?: boolean;
    /** Called once for each tier crossed, lowest first. */
    onTierReached?: (tier: GoalTier) => void;

    className?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const sizes = {
    sm: { track: "h-1.5", row: "h-3", node: "size-3", icon: "size-2.5", inset: "mx-2", value: "text-lg", ring: 112, stroke: 10, center: "text-lg" },
    md: { track: "h-2.5", row: "h-6", node: "size-6", icon: "size-3.5", inset: "mx-3", value: "text-display-xs", ring: 148, stroke: 12, center: "text-display-xs" },
    lg: { track: "h-3.5", row: "h-8", node: "size-8", icon: "size-4", inset: "mx-4", value: "text-display-sm", ring: 184, stroke: 16, center: "text-display-sm" },
} as const;

/** Half of each node size, in px, for nudging edge labels flush with their marker. */
const nodeHalfPx: Record<GoalMeterSize, number> = { sm: 6, md: 12, lg: 16 };

const nodeStyles: Record<ResolvedTier["status"], string> = {
    achieved: "bg-brand-solid text-white ring-2 ring-brand-100",
    next: "bg-primary text-brand-secondary ring-2 ring-brand-solid",
    locked: "bg-quaternary text-fg-quaternary ring-2 ring-bg-primary",
};

const paceBadge: Record<PaceStatus, { label: string; color: BadgeColor }> = {
    ahead: { label: "Ahead of pace", color: "success" },
    "on-track": { label: "On track", color: "brand" },
    behind: { label: "Behind pace", color: "warning" },
};

const ANIMATION_MS = 900;

/**
 * A number that eases toward `target` whenever it changes, starting from
 * `initial` on mount. Returns `target` directly when animation is off.
 */
function useAnimatedNumber(target: number, initial: number, enabled: boolean): number {
    const [display, setDisplay] = useState(enabled ? initial : target);
    const displayRef = useRef(display);

    useEffect(() => {
        if (!enabled) {
            displayRef.current = target;
            return;
        }
        const from = displayRef.current;
        if (from === target) return;

        const startedAt = performance.now();
        let frame = requestAnimationFrame(function tick(time) {
            const progress = Math.min(1, (time - startedAt) / ANIMATION_MS);
            const eased = 1 - (1 - progress) ** 3;
            displayRef.current = from + (target - from) * eased;
            setDisplay(displayRef.current);
            if (progress < 1) frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [target, enabled]);

    return enabled ? display : target;
}

/** Tier labels read "Silver", but the implicit finish-line tier reads "your goal" in sentences. */
const tierName = (tier: GoalTier) => (tier.id === GOAL_TIER_ID ? "your goal" : tier.label);

type MessageContext = {
    status: GoalStatus;
    nextTier: GoalTier | null;
    currentTier: GoalTier | null;
    isSingleGoal: boolean;
    hasPotential: boolean;
    hasBonusRule: boolean;
};

const getDefaultTemplate = ({ status, nextTier, currentTier, isSingleGoal, hasPotential, hasBonusRule }: MessageContext) => {
    const rewardClause = nextTier?.reward?.points || nextTier?.reward?.label ? " and earn {reward}." : ".";

    switch (status) {
        case "upcoming":
            return `This goal opens {startDate}.${hasPotential ? " Earn up to {potential}." : ""}`;
        case "not-started":
            return nextTier?.id === GOAL_TIER_ID
                ? `Reach {nextThreshold} to hit your goal${rewardClause}`
                : `Reach {nextThreshold} to unlock {nextTier}${rewardClause}`;
        case "in-progress":
            return `{remaining} more to reach {nextTier}${rewardClause}`;
        case "completed":
            return `${isSingleGoal ? "You reached your goal!" : "You hit every tier!"}${hasBonusRule ? " Keep going: {bonusRule}." : ""}`;
        case "ended":
            if (currentTier?.id === GOAL_TIER_ID) return "This goal has closed. You reached your goal with {value}.";
            return currentTier
                ? "This goal has closed. You finished at {currentTier} with {value}."
                : "This goal has closed. You finished with {value}.";
    }
};

const messageKeys: Record<GoalStatus, keyof GoalMessages> = {
    upcoming: "upcoming",
    "not-started": "notStarted",
    "in-progress": "inProgress",
    completed: "completed",
    ended: "ended",
};

// ── Tier marker ───────────────────────────────────────────────────────────────

const TierNode: FC<{ tier: ResolvedTier; size: GoalMeterSize; celebrating: boolean }> = ({ tier, size, celebrating }) => {
    const styles = sizes[size];
    const icon =
        tier.status === "achieved" ? (
            tier.icon ?? (tier.id === GOAL_TIER_ID ? <Trophy01 className={styles.icon} /> : <Check className={styles.icon} />)
        ) : tier.status === "next" ? (
            <Trophy01 className={styles.icon} />
        ) : (
            <Lock01 className={styles.icon} />
        );

    return (
        <span className="relative flex items-center justify-center">
            {celebrating && (
                <span
                    aria-hidden="true"
                    className={cx(
                        "absolute inset-0 m-auto rounded-full bg-brand-solid opacity-40 motion-safe:animate-[streak-halo_1.1s_ease-out_2]",
                        styles.node,
                    )}
                />
            )}
            <span
                className={cx(
                    "relative flex items-center justify-center rounded-full transition-colors duration-300",
                    styles.node,
                    nodeStyles[tier.status],
                    celebrating && "motion-safe:animate-[streak-pop_0.5s_ease-out]",
                )}
            >
                {/* The smallest node is too small for a glyph; its fill carries the state. */}
                {size !== "sm" && icon}
            </span>
        </span>
    );
};

type TierLabelProps = {
    tier: ResolvedTier;
    threshold: string;
    reward: string;
    align: "start" | "center" | "end";
    /** Hide the reward line when the card is narrow, where neighbouring labels would collide. */
    hideRewardWhenNarrow?: boolean;
    className?: string;
    style?: CSSProperties;
};

const TierLabel: FC<TierLabelProps> = ({ tier, threshold, reward, align, hideRewardWhenNarrow, className, style }) => (
    <span
        style={style}
        className={cx(
            "flex flex-col text-xs leading-tight whitespace-nowrap",
            align === "start" && "items-start text-left",
            align === "center" && "items-center text-center",
            align === "end" && "items-end text-right",
            className,
        )}
    >
        <span className={cx("font-semibold", tier.status === "achieved" ? "text-brand-secondary" : "text-secondary")}>
            {tier.label}
        </span>
        <span className="text-tertiary tabular-nums">{threshold}</span>
        {reward && (
            <span
                className={cx(
                    tier.status === "achieved" ? "text-success-primary" : "text-tertiary",
                    hideRewardWhenNarrow && "hidden @md:inline",
                )}
            >
                {reward}
            </span>
        )}
    </span>
);

// ── Variants ──────────────────────────────────────────────────────────────────

type MeterViewProps = {
    tiers: ResolvedTier[];
    displayValue: number;
    startValue: number;
    scaleEnd: number;
    overflow: number;
    size: GoalMeterSize;
    showMarkers: boolean;
    showLabels: boolean;
    showRewards: boolean;
    paceFraction: number | null;
    celebratingIds: Set<string>;
    celebrationKey: number;
    formatCompact: (value: number) => string;
    formatReward: (tier: GoalTier) => string;
};

const LinearMeter: FC<MeterViewProps> = ({
    tiers,
    displayValue,
    startValue,
    scaleEnd,
    overflow,
    size,
    showMarkers,
    showLabels,
    showRewards,
    paceFraction,
    celebratingIds,
    celebrationKey,
    formatCompact,
    formatReward,
}) => {
    const styles = sizes[size];
    const fill = getFraction(displayValue, startValue, scaleEnd) * 100;
    const half = nodeHalfPx[size];
    const position = (tier: GoalTier) => getFraction(tier.threshold, startValue, scaleEnd) * 100;
    const hasRewards = showRewards && tiers.some((tier) => formatReward(tier) !== "");

    return (
        <div className={styles.inset}>
            {/* Track row: nodes are centred on the track, so the row is as tall as a node. */}
            <div className={cx("relative", showMarkers ? styles.row : "")}>
                <div
                    className={cx(
                        "overflow-hidden rounded-full bg-quaternary",
                        styles.track,
                        showMarkers && "absolute inset-x-0 top-1/2 -translate-y-1/2",
                    )}
                >
                    <div className="h-full rounded-full bg-brand-solid" style={{ width: `${fill}%` }} />
                </div>

                {/* Second lap: progress past the target, drawn over the full bar. */}
                {overflow > 0 && (
                    <div
                        className={cx(
                            "absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-brand-800 bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(255_255_255/0.18)_4px_8px)]",
                            styles.track,
                        )}
                        style={{ width: `${overflow * 100}%` }}
                    />
                )}

                {paceFraction !== null && (
                    <span
                        className="absolute top-1/2 h-[calc(100%+8px)] min-h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-secondary"
                        style={{ left: `${paceFraction * 100}%` }}
                        title="Where you should be today to finish on target"
                    />
                )}

                {showMarkers &&
                    tiers.map((tier) => (
                        <span
                            key={`${tier.id}-${celebratingIds.has(tier.id) ? celebrationKey : 0}`}
                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${position(tier)}%` }}
                        >
                            <TierNode tier={tier} size={size} celebrating={celebratingIds.has(tier.id) && tier.status === "achieved"} />
                        </span>
                    ))}
            </div>

            {/* Labels row. Labels near either edge align to their marker instead of centring, so they stay in frame. */}
            {showMarkers && showLabels && (
                // Labels are absolutely positioned, so the row reserves their height: two lines, plus one for rewards.
                <div className={cx("relative mt-2.5 h-8", hasRewards && "@md:h-12")}>
                    {tiers.map((tier) => {
                        const left = position(tier);
                        const align = left >= 85 ? "end" : left <= 15 ? "start" : "center";
                        const shift = align === "end" ? `calc(-100% + ${half}px)` : align === "start" ? `-${half}px` : "-50%";

                        return (
                            <TierLabel
                                key={tier.id}
                                tier={tier}
                                threshold={formatCompact(tier.threshold)}
                                reward={showRewards ? formatReward(tier) : ""}
                                align={align}
                                hideRewardWhenNarrow
                                className="absolute top-0"
                                // Inline so the edge shift can use the marker's pixel size.
                                style={{ left: `${left}%`, transform: `translateX(${shift})` }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const SegmentedMeter: FC<MeterViewProps> = ({
    tiers,
    displayValue,
    startValue,
    size,
    showMarkers,
    showLabels,
    showRewards,
    celebratingIds,
    celebrationKey,
    formatCompact,
    formatReward,
}) => {
    const styles = sizes[size];

    return (
        <ol className="flex list-none gap-1.5">
            {tiers.map((tier, index) => {
                const from = index === 0 ? startValue : tiers[index - 1].threshold;
                const fill = getFraction(displayValue, from, tier.threshold) * 100;
                const celebrating = celebratingIds.has(tier.id) && tier.status === "achieved";

                return (
                    <li key={`${tier.id}-${celebrating ? celebrationKey : 0}`} className="flex min-w-0 flex-1 flex-col gap-2">
                        <div
                            className={cx(
                                "overflow-hidden rounded-full bg-quaternary",
                                styles.track,
                                celebrating && "motion-safe:animate-[goal-segment-flash_0.9s_ease-out]",
                            )}
                        >
                            <div className="h-full rounded-full bg-brand-solid" style={{ width: `${fill}%` }} />
                        </div>

                        {showMarkers && showLabels && (
                            <div className="flex min-w-0 items-start gap-1.5">
                                <span
                                    className={cx(
                                        "mt-px flex size-4 shrink-0 items-center justify-center rounded-full",
                                        nodeStyles[tier.status],
                                        "ring-0",
                                    )}
                                    aria-hidden="true"
                                >
                                    {tier.status === "achieved" ? (
                                        <Check className="size-2.5" />
                                    ) : tier.status === "locked" ? (
                                        <Lock01 className="size-2.5" />
                                    ) : (
                                        <Trophy01 className="size-2.5" />
                                    )}
                                </span>
                                {/* Wrapping instead of truncating keeps rewards readable in narrow segments. */}
                                <TierLabel
                                    tier={tier}
                                    threshold={formatCompact(tier.threshold)}
                                    reward={showRewards ? formatReward(tier) : ""}
                                    align="start"
                                    className="min-w-0 whitespace-normal"
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
};

const RadialMeter: FC<MeterViewProps & { centerLabel: ReactNode }> = ({
    tiers,
    displayValue,
    startValue,
    scaleEnd,
    overflow,
    size,
    showMarkers,
    centerLabel,
}) => {
    const { ring, stroke } = sizes[size];
    const radius = (ring - stroke) / 2;
    const innerRadius = radius - stroke - 2;
    const circumference = 2 * Math.PI * radius;
    const innerCircumference = 2 * Math.PI * innerRadius;
    const fill = getFraction(displayValue, startValue, scaleEnd);
    const center = ring / 2;

    return (
        <div className="relative shrink-0" style={{ width: ring, height: ring }}>
            <svg viewBox={`0 0 ${ring} ${ring}`} className="size-full -rotate-90" aria-hidden="true">
                <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-bg-quaternary" />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fill)}
                    className={cx("stroke-fg-brand-primary", fill === 0 && "opacity-0")}
                />
                {overflow > 0 && (
                    <circle
                        cx={center}
                        cy={center}
                        r={innerRadius}
                        fill="none"
                        strokeWidth={stroke * 0.6}
                        strokeLinecap="round"
                        strokeDasharray={innerCircumference}
                        strokeDashoffset={innerCircumference * (1 - overflow)}
                        className="stroke-brand-800"
                    />
                )}

                {/* Tier ticks. The start and finish both sit at 12 o'clock, so ticks there are skipped. */}
                {showMarkers &&
                    tiers.map((tier) => {
                        const fraction = getFraction(tier.threshold, startValue, scaleEnd);
                        if (fraction <= 0 || fraction >= 1) return null;
                        const angle = fraction * 2 * Math.PI;
                        return (
                            <circle
                                key={tier.id}
                                cx={center + radius * Math.cos(angle)}
                                cy={center + radius * Math.sin(angle)}
                                r={stroke * 0.22}
                                className={displayValue >= tier.threshold ? "fill-white" : "fill-fg-quaternary"}
                            />
                        );
                    })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{centerLabel}</div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

export const GoalMeter: FC<GoalMeterProps> = ({
    title,
    description,
    goalType = "quantity",
    unit,
    currency = "USD",
    locale,
    formatValue,
    value,
    startValue = 0,
    target: targetProp,
    previousValue,
    allowOverachievement = false,
    tiers: tiersProp,
    rewardMode = "cumulative",
    pointsLabel = DEFAULT_POINTS_LABEL,
    pointsPerUnit,
    period: periodProp,
    now,
    showPace = false,
    paceTolerance = 0.05,
    status: statusProp,
    messages,
    renderMessage,
    variant = "linear",
    size = "md",
    layout = "card",
    showTierMarkers = true,
    showValues = true,
    showRewards = true,
    animate = true,
    celebrate = true,
    onTierReached,
    className,
}) => {
    const titleId = useId();
    const prefersReducedMotion = usePrefersReducedMotion();

    // ── Derived goal state ────────────────────────────────────────────────────
    const target = resolveTarget(tiersProp ?? [], targetProp);
    const sortedTiers = resolveTiers(tiersProp, target);
    const scaleEnd = Math.max(target, sortedTiers.at(-1)!.threshold);
    const isSingleGoal = sortedTiers.length === 1;

    const formatOptions: ValueFormatOptions = { goalType, unit, currency, locale, pointsLabel, formatValue };
    const format = (n: number) => formatGoalValue(n, formatOptions);
    const formatCompact = (n: number) => formatGoalValue(n, formatOptions, true);
    const formatTierReward = (tier: GoalTier) => formatReward(tier.reward, pointsLabel, locale);

    const period = getPeriodInfo(periodProp, now ?? new Date());
    const status = statusProp ?? getGoalStatus(value, startValue, target, period);
    const pace = showPace && status !== "completed" ? getPace(value, startValue, target, period, paceTolerance) : null;

    const currentTier = getCurrentTier(sortedTiers, value);
    const nextTier = getNextTier(sortedTiers, value);
    const remaining = nextTier ? nextTier.threshold - value : null;
    const percent = getPercentOfGoal(value, startValue, target);
    const cappedPercent = allowOverachievement ? percent : Math.min(percent, 100);

    const tierPointsEarned = getTierPointsEarned(sortedTiers, value, rewardMode);
    const tierPointsPotential = getTierPointsPotential(sortedTiers, rewardMode);
    const bonusPoints = getUnitPoints(value, pointsPerUnit, target);
    const pointsEarned = tierPointsEarned + bonusPoints;
    const pointsAvailable = tierPointsPotential - tierPointsEarned;
    const hasPoints = tierPointsPotential > 0 || pointsPerUnit !== undefined;

    // ── Celebration ───────────────────────────────────────────────────────────
    // Tiers crossed since the last value seen, worked out during render so the
    // markers and callout celebrate in the same frame the new value lands.
    const [trackedValue, setTrackedValue] = useState(previousValue ?? value);
    const [celebration, setCelebration] = useState<{ tiers: GoalTier[]; key: number } | null>(null);
    if (trackedValue !== value) {
        setTrackedValue(value);
        const crossed = getTiersCrossed(sortedTiers, trackedValue, value);
        if (crossed.length > 0) setCelebration((last) => ({ tiers: crossed, key: (last?.key ?? 0) + 1 }));
    }

    // Fires once per crossing, even when Strict Mode runs effects twice.
    const notifiedKey = useRef(0);
    const notify = useEffectEvent((tiers: GoalTier[]) => tiers.forEach((tier) => onTierReached?.(tier)));
    useEffect(() => {
        if (!celebration || notifiedKey.current === celebration.key) return;
        notifiedKey.current = celebration.key;
        notify(celebration.tiers);
    }, [celebration]);

    const celebratingIds = new Set(celebrate && celebration ? celebration.tiers.map((tier) => tier.id) : []);

    // ── Animation ─────────────────────────────────────────────────────────────
    const shouldAnimate = animate && !prefersReducedMotion;
    // The counted number is always the real value; only the meter and percentage stop at the target.
    const displayValue = useAnimatedNumber(value, Math.min(previousValue ?? startValue, value), shouldAnimate);
    const displayTiers = withTierStatus(sortedTiers, displayValue);
    const overflow = allowOverachievement ? getOverflowFraction(displayValue, startValue, target) : 0;
    const displayPercent = Math.min(getPercentOfGoal(displayValue, startValue, target), cappedPercent);

    // ── Message ───────────────────────────────────────────────────────────────
    const tokens: Record<string, string> = {
        value: format(value),
        target: format(target),
        percent: `${cappedPercent}%`,
        remaining: remaining !== null ? format(remaining) : "",
        nextTier: nextTier ? tierName(nextTier) : "",
        nextThreshold: nextTier ? format(nextTier.threshold) : "",
        reward: nextTier ? formatTierReward(nextTier) : "",
        currentTier: currentTier ? tierName(currentTier) : "",
        earned: formatPoints(pointsEarned, pointsLabel, locale),
        potential: tierPointsPotential > 0 ? formatPoints(tierPointsPotential, pointsLabel, locale) : "",
        bonusRule: pointsPerUnit ? formatUnitRule(pointsPerUnit, target, formatOptions) : "",
        daysLeft: period ? String(period.daysLeft) : "",
        startDate: period ? formatShortDate(period.start, locale) : "",
        endDate: period ? formatShortDate(period.end, locale) : "",
    };

    const template =
        messages?.[messageKeys[status]] ??
        getDefaultTemplate({
            status,
            nextTier,
            currentTier,
            isSingleGoal,
            hasPotential: tierPointsPotential > 0,
            hasBonusRule: pointsPerUnit !== undefined && allowOverachievement,
        });
    const defaultMessage = fillTemplate(template, tokens);

    const state: GoalMeterState = {
        status,
        value,
        startValue,
        target,
        percent: cappedPercent,
        tiers: withTierStatus(sortedTiers, value),
        currentTier,
        nextTier,
        remaining,
        pointsEarned,
        pointsAvailable,
        bonusPoints,
        period,
        pace,
        formatValue: format,
    };
    const message = renderMessage ? renderMessage(state, defaultMessage) : defaultMessage;

    // ── Meter ─────────────────────────────────────────────────────────────────
    const valueText = [
        `${format(value)} of ${format(target)}`,
        `${cappedPercent}%`,
        currentTier && currentTier.id !== GOAL_TIER_ID ? `${currentTier.label} reached` : null,
        currentTier?.id === GOAL_TIER_ID ? "goal reached" : null,
    ]
        .filter(Boolean)
        .join(", ");

    const isInline = layout === "inline";
    const meterProps: MeterViewProps = {
        tiers: displayTiers,
        displayValue,
        startValue,
        scaleEnd,
        overflow,
        size,
        showMarkers: showTierMarkers,
        // Inline meters sit in table rows and lists, where labels would crowd the row.
        showLabels: !isInline,
        showRewards,
        paceFraction: pace && variant === "linear" ? getFraction(pace.expectedValue, startValue, scaleEnd) : null,
        celebratingIds,
        celebrationKey: celebration?.key ?? 0,
        formatCompact,
        formatReward: formatTierReward,
    };

    const centerLabel = (
        <>
            <span className={cx("font-semibold text-primary tabular-nums", sizes[size].center)}>{displayPercent}%</span>
            {size !== "sm" && <span className="mt-0.5 text-xs text-tertiary">of {formatCompact(target)}</span>}
        </>
    );

    const meter = (
        <div
            role="meter"
            aria-valuemin={startValue}
            aria-valuemax={target}
            aria-valuenow={Math.min(Math.max(value, startValue), target)}
            aria-valuetext={valueText}
            {...(title ? { "aria-labelledby": titleId } : { "aria-label": "Goal progress" })}
        >
            {variant === "radial" ? (
                <RadialMeter {...meterProps} centerLabel={centerLabel} />
            ) : variant === "segmented" ? (
                <SegmentedMeter {...meterProps} />
            ) : (
                <LinearMeter {...meterProps} />
            )}
        </div>
    );

    // ── Pieces shared by the card layouts ─────────────────────────────────────
    const gain = previousValue !== undefined && value > previousValue ? value - previousValue : 0;

    const valueSummary = showValues && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className={cx("font-semibold text-primary tabular-nums", sizes[size].value)}>{format(displayValue)}</span>
                <span className="text-sm text-tertiary">of {format(target)}</span>
            </p>
            <p className="flex items-center gap-2 text-sm">
                {gain > 0 && (
                    <span className="flex items-center gap-1 font-medium text-success-primary">
                        <TrendUp01 className="size-4" aria-hidden="true" />+{format(gain)}
                        <span className="sr-only"> since your last visit</span>
                    </span>
                )}
                {/* The ring already shows the percentage at its centre. */}
                {variant !== "radial" && (
                    <span className="font-semibold text-brand-secondary tabular-nums">{displayPercent}%</span>
                )}
            </p>
        </div>
    );

    const badges = (
        <div className="flex flex-wrap items-center gap-1.5">
            {status === "completed" && (
                <Badge color="success" size="sm">
                    {percent > 100 && allowOverachievement ? `${percent}% of goal` : "Goal reached"}
                </Badge>
            )}
            {pace && (
                <Badge color={paceBadge[pace.status].color} size="sm">
                    {pace.status === "behind" ? (
                        <TrendDown01 className="size-3" aria-hidden="true" />
                    ) : (
                        <TrendUp01 className="size-3" aria-hidden="true" />
                    )}
                    {paceBadge[pace.status].label}
                </Badge>
            )}
            {period && (
                <Badge color="gray" size="sm">
                    {[period.label, formatPeriodCountdown(period, locale)].filter(Boolean).join(" · ")}
                </Badge>
            )}
        </div>
    );

    const header = (title || description || period || pace || status === "completed") && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            {(title || description) && (
                <div className="min-w-0">
                    {title && (
                        <h3 id={titleId} className="text-md font-semibold text-primary">
                            {title}
                        </h3>
                    )}
                    {description && <p className="mt-0.5 text-sm text-tertiary">{description}</p>}
                </div>
            )}
            {badges}
        </div>
    );

    const tierCallout = currentTier?.message && status !== "upcoming" && (
        <div
            key={celebratingIds.has(currentTier.id) ? celebration?.key : "static"}
            className={cx(
                "flex items-start gap-2.5 rounded-lg bg-success-primary px-3 py-2.5 text-sm text-success-primary ring-1 ring-utility-success-200 ring-inset",
                celebratingIds.has(currentTier.id) && "motion-safe:animate-[quiz-rise-in_0.4s_ease-out]",
            )}
            role="status"
        >
            <Trophy01 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">{currentTier.message}</span>
        </div>
    );

    const statusMessage = message && <p className="text-sm text-tertiary">{message}</p>;

    const footer = (hasPoints && showRewards) || pace ? (
        <div className="flex flex-col gap-1.5 border-t border-secondary pt-3.5 text-xs text-tertiary">
            {hasPoints && showRewards && (
                <p className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <span>
                        <span className="text-sm font-semibold text-primary tabular-nums">
                            {formatPoints(pointsEarned, pointsLabel, locale)}
                        </span>{" "}
                        earned
                        {bonusPoints > 0 && ` (incl. ${formatPoints(bonusPoints, pointsLabel, locale)} bonus)`}
                    </span>
                    {pointsAvailable > 0 && status !== "ended" && (
                        <span className="tabular-nums">{formatPoints(pointsAvailable, pointsLabel, locale)} more available</span>
                    )}
                </p>
            )}
            {pointsPerUnit && showRewards && <p>Bonus: {formatUnitRule(pointsPerUnit, target, formatOptions)}.</p>}
            {pace && (
                <p className="flex items-center gap-1.5">
                    {variant === "linear" && <span className="h-3 w-0.5 rounded-full bg-fg-secondary" aria-hidden="true" />}
                    Pace for today: {format(pace.expectedValue)} · Projected by {tokens.endDate}: {format(pace.projectedValue)}
                </p>
            )}
        </div>
    ) : null;

    // ── Inline layout ─────────────────────────────────────────────────────────
    if (isInline) {
        if (variant === "radial") return <div className={cx("inline-flex", className)}>{meter}</div>;

        return (
            <div className={cx("flex flex-col gap-1.5", className)}>
                {showValues && (
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-secondary tabular-nums">
                            <span className="font-semibold text-primary">{format(displayValue)}</span> / {formatCompact(target)}
                        </span>
                        <span className="font-semibold text-brand-secondary tabular-nums">{displayPercent}%</span>
                    </div>
                )}
                {meter}
            </div>
        );
    }

    // ── Card layout: radial ───────────────────────────────────────────────────
    if (variant === "radial") {
        // A container, so the ring and tier list stack based on the card's own
        // width rather than the viewport's, and narrow dashboard cards stack too.
        return (
            <div className={cx("@container flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5", className)}>
                {header}
                <div className="flex flex-col items-center gap-5 @md:flex-row">
                    {meter}
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
                        {valueSummary}
                        {showTierMarkers && !isSingleGoal && (
                            <ul className="flex flex-col gap-2">
                                {displayTiers.map((tier) => (
                                    <li key={tier.id} className="flex items-start gap-2.5 text-sm">
                                        <span
                                            className={cx("mt-px flex size-5 shrink-0 items-center justify-center rounded-full", nodeStyles[tier.status], "ring-0")}
                                            aria-hidden="true"
                                        >
                                            {tier.status === "achieved" ? (
                                                <Check className="size-3" />
                                            ) : tier.status === "locked" ? (
                                                <Lock01 className="size-3" />
                                            ) : (
                                                <Trophy01 className="size-3" />
                                            )}
                                        </span>
                                        {/* Stacked rather than one row, so narrow dashboard cards don't wrap mid-label. */}
                                        <span className="flex min-w-0 flex-col">
                                            <span className="flex flex-wrap items-baseline gap-x-2">
                                                <span className={cx("font-medium", tier.status === "achieved" ? "text-primary" : "text-secondary")}>
                                                    {tier.label}
                                                </span>
                                                <span className="text-tertiary tabular-nums">{format(tier.threshold)}</span>
                                            </span>
                                            {showRewards && formatTierReward(tier) && (
                                                <span
                                                    className={cx(
                                                        "text-xs",
                                                        tier.status === "achieved" ? "text-success-primary" : "text-tertiary",
                                                    )}
                                                >
                                                    {formatTierReward(tier)}
                                                </span>
                                            )}
                                        </span>
                                        <span className="sr-only">
                                            {tier.status === "achieved" ? "(reached)" : tier.status === "next" ? "(next)" : "(locked)"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                {tierCallout}
                {statusMessage}
                {footer}
            </div>
        );
    }

    // ── Card layout: linear & segmented ───────────────────────────────────────
    // A container, so marker labels can respond to the card's width.
    return (
        <div className={cx("@container flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5", className)}>
            {header}
            {valueSummary}
            {meter}
            {tierCallout}
            {statusMessage}
            {footer}
        </div>
    );
};

export type { GoalMeterState, GoalTier };
