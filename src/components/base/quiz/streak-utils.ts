import type { StreakMilestone } from "./quiz-types";

/** Where a milestone sits relative to the user's current progress. */
export type MilestoneStatus = "earned" | "next" | "locked";

/** Where a single month of the cycle sits relative to the user's current progress. */
export type StreakMonthStatus = "complete" | "active" | "upcoming";

/** Milestones sorted by month, so callers can pass them in any order. */
export const sortMilestones = (milestones: StreakMilestone[]): StreakMilestone[] =>
    [...milestones].sort((a, b) => a.month - b.month);

/** Keeps a raw streak count inside the 0..cycleLength range the tracker can render. */
export const clampStreak = (streak: number, cycleLength: number): number =>
    Math.max(0, Math.min(Math.trunc(streak), cycleLength));

/**
 * The next streak value after a month is credited. Wraps back to 1 once the
 * cycle is complete — finishing month 12 and answering again starts a new run.
 */
export const advanceStreak = (currentStreak: number, cycleLength: number): number =>
    currentStreak >= cycleLength ? 1 : clampStreak(currentStreak, cycleLength) + 1;

/** The first milestone not yet reached, or `null` once every milestone is earned. */
export const getNextMilestone = (milestones: StreakMilestone[], currentStreak: number): StreakMilestone | null =>
    sortMilestones(milestones).find((milestone) => milestone.month > currentStreak) ?? null;

/** The milestone landed on at exactly this streak value, if any. */
export const getMilestoneAt = (milestones: StreakMilestone[], streak: number): StreakMilestone | null =>
    milestones.find((milestone) => milestone.month === streak) ?? null;

/** Months left before the next milestone unlocks, or `null` when none remain. */
export const getMonthsToNextMilestone = (milestones: StreakMilestone[], currentStreak: number): number | null => {
    const next = getNextMilestone(milestones, currentStreak);
    return next ? next.month - currentStreak : null;
};

export const getMilestoneStatus = (
    milestone: StreakMilestone,
    milestones: StreakMilestone[],
    currentStreak: number,
): MilestoneStatus => {
    if (currentStreak >= milestone.month) return "earned";
    return getNextMilestone(milestones, currentStreak)?.month === milestone.month ? "next" : "locked";
};

/**
 * Status of a given month in the cycle. Month `currentStreak + 1` is "active" —
 * the one the user is working on — and is absent once the cycle is complete.
 */
export const getStreakMonthStatus = (month: number, currentStreak: number): StreakMonthStatus => {
    if (month <= currentStreak) return "complete";
    return month === currentStreak + 1 ? "active" : "upcoming";
};

/** Progress along the rail as a percentage of the distance between the first and last node. */
export const getRailFillPercent = (currentStreak: number, cycleLength: number): number => {
    if (cycleLength <= 1) return currentStreak > 0 ? 100 : 0;
    const filledSegments = clampStreak(currentStreak, cycleLength) - 1;
    return Math.max(0, (filledSegments / (cycleLength - 1)) * 100);
};

/** "1 month" / "3 months" — the noun form, for phrases like "3 months to go". */
export const formatMonths = (count: number): string => `${count} ${count === 1 ? "month" : "months"}`;

/** "1-month" / "3-month" — the adjectival form, for phrases like "3-month streak". */
export const formatMonthSpan = (count: number): string => `${count}-month`;
