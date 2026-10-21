import type { BadgeColor } from "@/components/base/badges/badge";
import { PROMOTION_STATUS_COLORS, formatPointsMultiplier } from "@/components/base/table/promotions-types";
import type { PromotionStatus } from "@/components/base/table/promotions-types";
import { formatNumber } from "@/utils/format";
import type { PromotionCardData, PromotionOffer } from "./promotion-card-types";

const DAY_MS = 86_400_000;

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const rangeFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Reads an ISO date (`YYYY-MM-DD`) as local midnight, so the day never shifts. */
export const parseLocalDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole calendar days from `from` to `to`. Rounded, so a daylight saving hour never costs a day. */
const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

/** `Oct 1 – 31, 2026`, or `Dec 15, 2026 – Jan 15, 2027` across years. */
export const formatPromotionDateRange = (startDate: string, endDate: string) => rangeFormatter.formatRange(parseLocalDate(startDate), parseLocalDate(endDate));

/** The type label: `3x Points`, `+5,000 Bonus Points`, `ADRX`. */
export const formatOffer = (offer: PromotionOffer) => {
    switch (offer.kind) {
        case "multiplier":
            return `${formatPointsMultiplier(offer.multiplier)} Points`;
        case "bonus":
            return offer.points ? `+${formatNumber(offer.points)} Bonus Points` : "Bonus Points";
        case "custom":
            return offer.label;
    }
};

/** The big figure on a header with no art: `3x`, `+5,000`, `ADRX`. */
export const formatOfferHeadline = (offer: PromotionOffer) => {
    switch (offer.kind) {
        case "multiplier":
            return formatPointsMultiplier(offer.multiplier);
        case "bonus":
            return offer.points ? `+${formatNumber(offer.points)}` : "Bonus";
        case "custom":
            return offer.label;
    }
};

export interface PromotionTiming {
    status: PromotionStatus;
    /** Short countdown for the status badge: `3 days left`, `Starts Nov 1`. */
    label: string;
    color: BadgeColor;
    /** The promotion can still earn, now or later. Ended and cancelled ones cannot. */
    isOpen: boolean;
}

/**
 * Works out where a promotion stands today. A `status` set by the program wins
 * for the closed states, since only the program knows a promotion was pulled early.
 */
export const getPromotionTiming = (
    promotion: Pick<PromotionCardData, "startDate" | "endDate" | "status">,
    now: Date = new Date(),
    endingSoonDays = 7,
): PromotionTiming => {
    const closed = (status: PromotionStatus, label: string): PromotionTiming => ({ status, label, color: PROMOTION_STATUS_COLORS[status], isOpen: false });
    const open = (status: PromotionStatus, label: string): PromotionTiming => ({ status, label, color: PROMOTION_STATUS_COLORS[status], isOpen: true });

    if (promotion.status === "cancelled") return closed("cancelled", "Cancelled");
    if (promotion.status === "ended") return closed("ended", "Ended");

    const start = parseLocalDate(promotion.startDate);
    const end = parseLocalDate(promotion.endDate);
    const daysToStart = daysBetween(now, start);
    const daysToEnd = daysBetween(now, end);

    if (daysToEnd < 0) return closed("ended", "Ended");

    if (daysToStart > 0) {
        if (daysToStart === 1) return open("scheduled", "Starts tomorrow");
        return open("scheduled", daysToStart <= endingSoonDays ? `Starts in ${daysToStart} days` : `Starts ${shortDate.format(start)}`);
    }

    if (daysToEnd === 0) return open("ending-soon", "Last day");
    if (daysToEnd === 1) return open("ending-soon", "Ends tomorrow");
    if (daysToEnd <= endingSoonDays) return open("ending-soon", `${daysToEnd} days left`);
    return open("active", `Ends ${shortDate.format(end)}`);
};

/**
 * Ordering for a row of cards: ending soonest first, then live, then upcoming by
 * start, closed last. Recommended promotions lead within each group, so a pick
 * never jumps ahead of one about to close.
 */
export const comparePromotionsByUrgency = (now: Date, endingSoonDays = 7) => {
    const rank: Record<PromotionStatus, number> = { "ending-soon": 0, active: 1, scheduled: 2, ended: 3, cancelled: 4 };

    return (a: PromotionCardData, b: PromotionCardData) => {
        const ta = getPromotionTiming(a, now, endingSoonDays);
        const tb = getPromotionTiming(b, now, endingSoonDays);
        if (ta.status !== tb.status) return rank[ta.status] - rank[tb.status];
        // Within a group, what was picked for this participant leads.
        if (!!a.recommended !== !!b.recommended) return a.recommended ? -1 : 1;
        // Upcoming ones by when they open; everything else by when it closes.
        const key = ta.status === "scheduled" ? "startDate" : "endDate";
        return a[key].localeCompare(b[key]);
    };
};
