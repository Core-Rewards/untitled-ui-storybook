import { formatNumber } from "@/utils/format";
import type { Milestone, MilestoneState, MilestoneType, MilestoneUnit, ResolvedMilestone } from "./milestone-timeline-types";

const DAY_MS = 86_400_000;

export const DEFAULT_ACTIVITY_UNIT: MilestoneUnit = { singular: "activity", plural: "activities" };

const YEAR_UNIT: MilestoneUnit = { singular: "year", plural: "years" };

const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const shortMonthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

// ── Dates ─────────────────────────────────────────────────────────────────────

/** Reads an ISO date (`YYYY-MM-DD`) as local midnight, so the day never shifts with time zones. */
export const parseDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** The `years`th anniversary of `startDate`. Feb 29 starts land on Mar 1 in other years. */
export const anniversary = (startDate: string, years: number) => {
    const start = parseDate(startDate);
    return toIso(new Date(start.getFullYear() + years, start.getMonth(), start.getDate()));
};

/** Whole calendar days from `now` to `iso`; negative once it has passed. */
export const daysUntil = (iso: string, now: Date) => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((parseDate(iso).getTime() - today.getTime()) / DAY_MS);
};

/**
 * Years of service as a fraction, e.g. 4.5 halfway between the 4th and 5th
 * anniversaries. Measured between anniversaries so leap years don't drift.
 */
export const tenureYears = (startDate: string, now: Date) => {
    const start = parseDate(startDate);
    let whole = now.getFullYear() - start.getFullYear();
    if (parseDate(anniversary(startDate, whole)) > now) whole -= 1;
    if (whole < 0) return 0;
    const last = parseDate(anniversary(startDate, whole)).getTime();
    const next = parseDate(anniversary(startDate, whole + 1)).getTime();
    return whole + (now.getTime() - last) / (next - last);
};

// ── Resolving ─────────────────────────────────────────────────────────────────

export interface ResolveOptions {
    type: MilestoneType;
    /** Years of service, or activities completed. */
    progress: number;
    startDate?: string;
    redeemedIds?: string[];
    rewardsStartDate?: string;
}

const defaultTitle = (m: Milestone) => (m.reward.type === "product" ? m.reward.name : `${formatNumber(m.reward.points)} points`);

/** Sorts milestones by value, fills in dates and titles, and works out each one's state. */
export const resolveMilestones = (
    milestones: Milestone[],
    { type, progress, startDate, redeemedIds = [], rewardsStartDate }: ResolveOptions,
): ResolvedMilestone[] => {
    let nextAssigned = false;

    return [...milestones]
        .sort((a, b) => a.value - b.value)
        .map((m) => {
            const date = m.date ?? (type === "years" && startDate ? anniversary(startDate, m.value) : undefined);
            let state: MilestoneState;

            if (m.state) {
                state = m.state;
            } else if (progress >= m.value) {
                const beforeRewards = rewardsStartDate !== undefined && date !== undefined && date < rewardsStartDate;
                // Points are credited automatically, so there is nothing left to redeem.
                state = beforeRewards ? "reached" : redeemedIds.includes(m.id) || m.reward.type === "points" ? "redeemed" : "ready";
            } else {
                state = nextAssigned ? "upcoming" : "next";
            }
            if (state === "next") nextAssigned = true;

            return { ...m, date, state, title: m.title ?? defaultTitle(m) };
        });
};

/**
 * How far along the track the participant is, as a 0–1 fraction. Milestones
 * are spaced evenly, so progress is measured between neighbours: 4 years with
 * milestones at 3 and 5 sits halfway between their columns.
 */
export const progressFraction = (values: number[], progress: number) => {
    if (values.length < 2) return progress >= (values[0] ?? 0) ? 1 : 0;
    if (progress <= values[0]) return 0;
    for (let i = 0; i < values.length - 1; i++) {
        if (progress < values[i + 1]) return (i + (progress - values[i]) / (values[i + 1] - values[i])) / (values.length - 1);
    }
    return 1;
};

// ── Copy ──────────────────────────────────────────────────────────────────────

export const countLabel = (value: number, unit: MilestoneUnit) => `${formatNumber(value)} ${value === 1 ? unit.singular : unit.plural}`;

const unitFor = (type: MilestoneType, unit?: MilestoneUnit) => (type === "years" ? YEAR_UNIT : (unit ?? DEFAULT_ACTIVITY_UNIT));

/** Heading over each milestone: `Year 5` or `10 courses`. */
export const milestoneLabel = (m: Milestone, type: MilestoneType, unit?: MilestoneUnit) =>
    type === "years" ? `Year ${formatNumber(m.value)}` : countLabel(m.value, unitFor(type, unit));

/** Word under the number on the badge: `YEARS`, `COURSES`. */
export const badgeCaption = (value: number, type: MilestoneType, unit?: MilestoneUnit) => {
    const u = unitFor(type, unit);
    return (u.short ?? (value === 1 ? u.singular : u.plural)).toUpperCase();
};

/** `June 2028`: when the milestone was, or will be, reached. */
export const dateText = (m: ResolvedMilestone) => (m.date ? monthYear.format(parseDate(m.date)) : undefined);

/** Short status under each milestone, e.g. `Ready to redeem` or `In 120 days`. */
export const statusText = (m: ResolvedMilestone, type: MilestoneType, progress: number, now: Date, unit?: MilestoneUnit) => {
    switch (m.state) {
        case "ready":
            return "Ready to redeem";
        case "redeemed":
            return m.reward.type === "points" ? "Points added" : "Redeemed";
        case "reached":
            if (!m.date) return "Celebrated";
            return type === "years" ? `Celebrated ${parseDate(m.date).getFullYear()}` : `Completed ${shortMonthYear.format(parseDate(m.date))}`;
        case "next": {
            if (type === "years" && m.date) {
                const days = daysUntil(m.date, now);
                if (days <= 0) return "Today";
                return days === 1 ? "Tomorrow" : `In ${formatNumber(days)} days`;
            }
            const remaining = Math.max(Math.ceil(m.value - progress), 0);
            return `${countLabel(remaining, unitFor(type, unit))} to go`;
        }
        default:
            return m.date ? shortMonthYear.format(parseDate(m.date)) : "Locked";
    }
};

/** Spoken summary of where the participant is, for screen readers. */
export const progressSummary = (milestones: ResolvedMilestone[], type: MilestoneType, progress: number, now: Date, unit?: MilestoneUnit) => {
    const where = type === "years" ? `${countLabel(Math.floor(progress), YEAR_UNIT)} of service.` : `${countLabel(progress, unitFor(type, unit))} completed.`;
    const next = milestones.find((m) => m.state === "next");
    if (!next) return `${where} Every milestone reached.`;
    return `${where} Next milestone: ${milestoneLabel(next, type, unit)}, ${next.title}, ${statusText(next, type, progress, now, unit).toLowerCase()}.`;
};
