import type { BadgeColor } from "@/components/base/badges/badge";

export type SalesSubmissionStatus = "pending" | "approved" | "rejected";

export type SalesSubmission = {
    /** Unique identifier for the submission. */
    id: string;
    /** Quote number, e.g. "Q-104582". */
    quoteNumber: string;
    /** Date the quote was created, as an ISO date (`YYYY-MM-DD`). */
    quoteCreatedDate: string;
    /** Total quoted amount in dollars. */
    quoteAmount: number;
    /** ABB order number, once the quote converts to an order. */
    abbOrderNumber?: string;
    /** Date the ABB order was placed, as an ISO date (`YYYY-MM-DD`). */
    abbOrderDate?: string;
    /** Total ABB order amount in dollars. */
    abbOrderAmount?: number;
    /** Portion of the order amount that qualifies for points. */
    eligibleOrderAmount?: number;
    /** Points earned on the eligible amount. */
    pointValue?: number;
    status: SalesSubmissionStatus;
};

export const SALES_SUBMISSION_STATUS_LABELS: Record<SalesSubmissionStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};

export const SALES_SUBMISSION_STATUS_COLORS: Record<SalesSubmissionStatus, BadgeColor> = {
    pending: "warning",
    approved: "success",
    rejected: "error",
};

/** Sort order for the status column: awaiting review first, then decided. */
export const SALES_SUBMISSION_STATUS_RANK: Record<SalesSubmissionStatus, number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
};
