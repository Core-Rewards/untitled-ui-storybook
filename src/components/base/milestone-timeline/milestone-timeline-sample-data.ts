import type { Milestone, MilestoneReward, MilestoneType, MilestoneUnit } from "./milestone-timeline-types";

/** A fixed "today" so tenure, countdowns and states never drift in stories. */
export const SAMPLE_NOW = new Date("2026-10-23T12:00:00");

/** Hired Mar 15, 2021: 5.6 years in, with the 1-, 3- and 5-year milestones behind them. */
export const SAMPLE_START_DATE = "2021-03-15";

/** The program launched Jan 1, 2024, so the 1-year milestone (2022) predates rewards. */
export const SAMPLE_REWARDS_START = "2024-01-01";

export const courseUnit: MilestoneUnit = { singular: "course", plural: "courses" };

const products: Extract<MilestoneReward, { type: "product" }>[] = [
    { type: "product", name: "Golf Balls", imageSrc: "/mock-products/taylormade-golf-balls.jpg" },
    { type: "product", name: "Roadie Cooler", imageSrc: "/mock-products/yeti-roadie-cooler.jpg" },
    { type: "product", name: "iPad Pro", imageSrc: "/mock-products/ipad-pro-silver.jpg" },
    { type: "product", name: "Pellet Grill", imageSrc: "/mock-products/traeger-timberline-grill.jpg" },
    { type: "product", name: "Wireless Earbuds" },
    { type: "product", name: "Weekender Bag" },
    { type: "product", name: "Smart Watch" },
    { type: "product", name: "Espresso Machine" },
    { type: "product", name: "Getaway Package" },
    { type: "product", name: "Lifetime Award" },
];

const points = [2_500, 5_000, 10_000, 25_000, 40_000, 60_000, 80_000, 100_000, 125_000, 150_000];

const YEAR_STEPS = [1, 3, 5, 10, 15, 20, 25, 30, 35, 40];
const ACTIVITY_STEPS = [5, 10, 25, 50, 75, 100, 150, 200, 250, 300];

/** `mixed` gives the first three milestones products and the rest points, like most service programs. */
export type SampleRewardMix = "product" | "points" | "mixed";

/** Builds `count` milestones (1–10) of the given type and reward mix. */
export const buildMilestones = (count: number, type: MilestoneType, rewards: SampleRewardMix): Milestone[] => {
    const steps = type === "years" ? YEAR_STEPS : ACTIVITY_STEPS;
    return steps.slice(0, Math.min(Math.max(count, 1), steps.length)).map((value, i) => {
        const useProduct = rewards === "product" || (rewards === "mixed" && i < 3);
        return { id: `${type}-${value}`, value, reward: useProduct ? products[i] : { type: "points", points: points[i] } };
    });
};

/** Years of service: golf balls, a cooler and an iPad at 1, 3 and 5 years, then points every five years. */
export const serviceMilestones = buildMilestones(7, "years", "mixed");

/** Courses completed, paying points. */
export const courseMilestones = buildMilestones(5, "activity", "points");
