/**
 * What a milestone counts.
 * - `years`: years of service, e.g. a 5-year anniversary. Dates can be worked out from a start date.
 * - `activity`: things completed, e.g. 10 courses or 25 referrals.
 */
export type MilestoneType = "years" | "activity";

/**
 * What reaching a milestone pays out.
 * - `product`: a gift the participant redeems, e.g. a cooler or tablet.
 * - `points`: points credited to their balance.
 */
export type MilestoneReward = { type: "product"; name: string; imageSrc?: string } | { type: "points"; points: number };

/**
 * Where the participant stands on a milestone.
 * - `redeemed`: reached and the reward is claimed (points milestones land here as soon as they are reached).
 * - `ready`: reached and the reward is waiting to be redeemed.
 * - `reached`: reached before rewards started, so it is celebrated but pays nothing.
 * - `next`: the first milestone not yet reached.
 * - `upcoming`: any later milestone.
 */
export type MilestoneState = "redeemed" | "ready" | "reached" | "next" | "upcoming";

/** A noun in both forms, so counts read naturally ("1 course", "10 courses"). */
export interface MilestoneUnit {
    singular: string;
    plural: string;
    /** Word under the number on the badge. Defaults to `singular` or `plural`; keep it short. */
    short?: string;
}

export interface Milestone {
    /** Stable identifier, used as the React key and in `redeemedIds`. */
    id: string;
    /** Years of service, or activities completed, that unlock the milestone. */
    value: number;
    reward: MilestoneReward;
    /** Line under the badge. Defaults to the product name or the points amount. */
    title?: string;
    /** When it was or will be reached, as an ISO date (`YYYY-MM-DD`). Years milestones work this out from `startDate` when it is left off. */
    date?: string;
    /** Forces a state, e.g. one returned by the server. */
    state?: MilestoneState;
}

/** A milestone with everything the timeline needs filled in. */
export interface ResolvedMilestone extends Milestone {
    state: MilestoneState;
    title: string;
}
