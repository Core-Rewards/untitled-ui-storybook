import type { BadgeColor } from "@/components/base/badges/badge";

export type BookingStatus = "complete" | "pending" | "rejected";

export type Booking = {
    /** Unique identifier for the booking. */
    id: string;
    /** Property the group rooms were booked at, e.g. "Loews Regency New York". */
    hotel: string;
    /** Company the booking was made for, e.g. "Conference Group". */
    company: string;
    /** First night of the stay, as an ISO date (`YYYY-MM-DD`). */
    arrivalDate: string;
    /** Check-out date, as an ISO date (`YYYY-MM-DD`). */
    departureDate: string;
    /** Reservation identifier, e.g. "MVP01". */
    reservationId: string;
    /** Estimated reward points for the booking. */
    estimatedRewardPoints: number;
    status: BookingStatus;
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    complete: "Complete",
    pending: "Pending",
    rejected: "Rejected",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, BadgeColor> = {
    complete: "success",
    pending: "warning",
    rejected: "error",
};

/** Sort order for the status column: awaiting action first, then settled. */
export const BOOKING_STATUS_RANK: Record<BookingStatus, number> = {
    pending: 0,
    complete: 1,
    rejected: 2,
};
