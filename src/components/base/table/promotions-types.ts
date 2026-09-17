import type { BadgeColor } from "@/components/base/badges/badge";
import { formatDate } from "@/utils/format";

export type PromotionStatus = "active" | "ending-soon" | "scheduled" | "ended" | "cancelled";

export type Promotion = {
    /** Unique identifier for the promotion. */
    id: string;
    /** Promotion name, e.g. "Triple Points'tober". */
    name: string;
    /** Short explanation of how to earn on the promotion. */
    description: string;
    /** Earning multiplier, e.g. `3` for triple points. */
    pointsMultiplier: number;
    /** First day the promotion earns, as an ISO date (`YYYY-MM-DD`). */
    startDate: string;
    /** Last day the promotion earns, as an ISO date (`YYYY-MM-DD`). */
    endDate: string;
    status: PromotionStatus;
    /** Link to the promotion flyer PDF. When omitted, no flyer action is shown. */
    flyerUrl?: string;
};

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
    active: "Active",
    "ending-soon": "Ending soon",
    scheduled: "Scheduled",
    ended: "Ended",
    cancelled: "Cancelled",
};

export const PROMOTION_STATUS_COLORS: Record<PromotionStatus, BadgeColor> = {
    active: "success",
    "ending-soon": "warning",
    scheduled: "blue",
    ended: "gray",
    cancelled: "error",
};

/** Sort order for the status column: live promotions first, closed ones last. */
export const PROMOTION_STATUS_RANK: Record<PromotionStatus, number> = {
    active: 0,
    "ending-soon": 1,
    scheduled: 2,
    ended: 3,
    cancelled: 4,
};

/** Formats a promotion's ISO date as `Oct 1, 2026`. */
export const formatPromotionDate = formatDate;

/** Formats an earning multiplier as `3x`, trimming a trailing `.0`. */
export const formatPointsMultiplier = (multiplier: number) => `${Number(multiplier.toFixed(2))}x`;
