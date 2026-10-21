import type { PromotionStatus } from "@/components/base/table/promotions-types";
import type { CalendarTarget } from "./promotion-calendar";

/**
 * What the promotion pays out. Drives the type label on the card.
 * - `multiplier`: `3x Points`. Fractions read as `1.5x Points`.
 * - `bonus`: a flat award, `+5,000 Bonus Points`, or `Bonus Points` with no amount.
 * - `custom`: anything else, read as written, e.g. `ADRX` or `Sweepstakes`.
 */
export type PromotionOffer = { kind: "multiplier"; multiplier: number } | { kind: "bonus"; points?: number } | { kind: "custom"; label: string };

/**
 * Header art.
 * - `image`: a photo or campaign graphic, cropped to fill the header.
 * - `logo`: a brand or manufacturer mark, shown whole on a plain panel.
 *
 * Leave it off and the card draws a branded header from the offer instead.
 */
export type PromotionMedia = { type: "image"; src: string; alt: string } | { type: "logo"; src: string; alt: string };

/** Where the participant is on a promotion with a goal, e.g. 3 of 10 qualifying units. */
export interface PromotionProgress {
    current: number;
    target: number;
    /** What is being counted, e.g. `qualifying units`. Reads as `3 of 10 qualifying units`. */
    unit: string;
}

export interface PromotionCardData {
    id: string;
    /** Promotion name, e.g. "Triple Points'tober". */
    name: string;
    /** How to earn on it. Clamped to three lines on the card. */
    description: string;
    offer: PromotionOffer;
    /** First day the promotion earns, as an ISO date (`YYYY-MM-DD`). */
    startDate: string;
    /** Last day the promotion earns, as an ISO date (`YYYY-MM-DD`). */
    endDate: string;
    media?: PromotionMedia;

    /** Promotion details page. The card's main action. */
    href: string;
    /** Label for the main action. Defaults to `View details`. */
    ctaLabel?: string;
    /** Promotion flyer PDF. Shown as a secondary action when set. */
    flyerUrl?: string;

    /**
     * Status set by the program, for states the dates cannot tell, such as
     * `cancelled`. When left off, the card works the status out from the dates.
     */
    status?: PromotionStatus;
    /** Recently launched. Shows a `New` flag; the program decides how long it stays. */
    isNew?: boolean;
    /**
     * Picked for this participant, e.g. from what they usually sell. Shows a
     * `Recommended for you` flag, with the reason under it when one is given,
     * such as `Based on your heat pump sales`.
     */
    recommended?: { reason?: string };
    /** The most a participant can earn, e.g. `Earn up to 15,000 pts`. */
    earnPotential?: string;
    /** Products or categories that qualify. The first three show, the rest are counted. */
    eligibleProducts?: string[];
    /**
     * Opt-in promotions. `enrolled: false` swaps the main action for an Enroll
     * button, since sales made before enrolling usually do not count.
     */
    enrollment?: { enrolled: boolean };
    /** Points this participant has earned on the promotion so far. */
    pointsEarned?: number;
    progress?: PromotionProgress;
}

export interface PromotionCardProps {
    promotion: PromotionCardData;
    /** Fired by the Enroll button on opt-in promotions the participant has not joined. */
    onEnroll?: (promotion: PromotionCardData) => void;
    /** Shows the Enroll button as busy while the request is in flight. */
    isEnrolling?: boolean;
    /**
     * Show the Add to calendar menu on promotions that have not ended. Defaults to
     * true. The event spans the promotion and reminds at 9am on its last day.
     */
    showAddToCalendar?: boolean;
    /** Fired when the participant picks a calendar, e.g. for analytics. The menu handles the rest. */
    onAddToCalendar?: (promotion: PromotionCardData, target: CalendarTarget) => void;
    /** Days before the end date that the countdown turns to a warning. Defaults to 7. */
    endingSoonDays?: number;
    /** Today, for the countdown. Defaults to the current date; pass one for stable stories and tests. */
    now?: Date;
    /** Heading level for the promotion name, to fit the page outline. Defaults to 3. */
    headingLevel?: 2 | 3 | 4;
    className?: string;
}
