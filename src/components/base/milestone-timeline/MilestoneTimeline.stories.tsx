import type { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MilestoneBadge } from "./milestone-badge";
import { MilestoneTimeline } from "./milestone-timeline";
import type { MilestoneTimelineProps } from "./milestone-timeline";
import type { MilestoneState } from "./milestone-timeline-types";
import type { SampleRewardMix } from "./milestone-timeline-sample-data";
import { SAMPLE_NOW, SAMPLE_REWARDS_START, SAMPLE_START_DATE, buildMilestones, courseUnit } from "./milestone-timeline-sample-data";

// ─── Meta ─────────────────────────────────────────────────────────────────────

/** Story-only controls that build the milestone list, so the timeline can be configured without editing JSON. */
type StoryArgs = Omit<MilestoneTimelineProps, "milestones"> & {
    milestones?: MilestoneTimelineProps["milestones"];
    /** Number of milestones to build (1–10). Ignored when `milestones` is set. */
    milestoneCount?: number;
    /** Reward on each built milestone. Ignored when `milestones` is set. */
    rewardType?: SampleRewardMix;
};

const meta = {
    title: "Base/MilestoneTimeline",
    // The story adds controls the component doesn't take, so the args type is wider than its props.
    component: MilestoneTimeline as FC<StoryArgs>,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    'Milestones on a progress track: years of service or activities completed, each paying a product or points. Badges, track and the "You are here" marker use the brand color. States come from `progress` (or, for years, from `startDate`), with `redeemedIds` and `rewardsStartDate` for rewards already claimed or reached before the program began. Horizontal when the container is at least 672px wide, vertical below that. Use `milestoneCount` and `rewardType` to build sample milestones from the controls.',
            },
        },
    },
    tags: ["autodocs"],
    args: {
        milestoneCount: 7,
        rewardType: "mixed",
        type: "years",
        startDate: SAMPLE_START_DATE,
        rewardsStartDate: SAMPLE_REWARDS_START,
        now: SAMPLE_NOW,
        redeemedIds: ["years-3"],
        detail: "status",
        size: "md",
        layout: "auto",
        showCurrentMarker: true,
        showRewardImages: false,
        onRedeem: fn(),
    },
    argTypes: {
        milestoneCount: { control: { type: "range", min: 1, max: 10, step: 1 } },
        rewardType: { control: "inline-radio", options: ["product", "points", "mixed"] },
        type: { control: "inline-radio", options: ["years", "activity"] },
        progress: { control: { type: "number", min: 0, step: 0.25 } },
        detail: { control: "inline-radio", options: ["status", "date"] },
        size: { control: "inline-radio", options: ["sm", "md"] },
        layout: { control: "inline-radio", options: ["auto", "horizontal", "vertical"] },
        now: { control: false },
        milestones: { control: false },
    },
    render: ({ milestones, milestoneCount = 7, rewardType = "mixed", ...args }) => (
        <MilestoneTimeline {...args} milestones={milestones ?? buildMilestones(milestoneCount, args.type ?? "years", rewardType)} />
    ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Five and a half years in. The 1-year milestone predates the program so it is
 * only celebrated, the backpack is redeemed, and the 5-year quarter-zip is
 * waiting: its badge pulses and is a button.
 */
export const Playground: Story = {};

/** Every milestone pays points, which are added as soon as they are reached. */
export const PointsRewards: Story = {
    args: { rewardType: "points", redeemedIds: [] },
};

/** Every milestone is a gift, with product photos under the titles. */
export const ProductRewards: Story = {
    args: { rewardType: "product", milestoneCount: 5, showRewardImages: true, rewardsStartDate: undefined, redeemedIds: ["years-1", "years-3"] },
};

/** Activity milestones count things done rather than time served. 32 courses in, the next milestone is 50. */
export const ActivityCompleted: Story = {
    args: {
        type: "activity",
        unit: courseUnit,
        progress: 32,
        milestoneCount: 5,
        rewardType: "points",
        startDate: undefined,
        rewardsStartDate: undefined,
        redeemedIds: [],
    },
};

/** Activity milestones can carry the date each was completed, or a target date for the ones ahead. */
export const ActivityWithDates: Story = {
    args: {
        ...ActivityCompleted.args,
        detail: "date",
        milestones: buildMilestones(5, "activity", "points").map((m, i) => ({
            ...m,
            date: ["2025-02-11", "2025-06-30", "2026-04-02", "2027-03-31", "2027-12-31"][i],
        })),
    },
};

/** Smaller badges with the month each milestone was or will be reached, for a card or dashboard tile. */
export const Compact: Story = {
    args: { size: "sm", detail: "date" },
};

/** A new hire: the marker sits at the start and the first milestone counts down. */
export const NewHire: Story = {
    args: { startDate: "2026-02-02", rewardsStartDate: undefined, redeemedIds: [], milestoneCount: 5 },
};

/** Every milestone reached and claimed. */
export const AllReached: Story = {
    args: { startDate: "1994-06-01", rewardsStartDate: undefined, milestoneCount: 5, redeemedIds: ["years-1", "years-3", "years-5"] },
};

/** Forced vertical, as it falls back to in a narrow container or on a phone. */
export const Vertical: Story = {
    args: { layout: "vertical" },
    decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
};

/** In a page section, as on the program home page. */
export const InACard: Story = {
    args: { milestoneCount: 6, showCurrentMarker: true },
    decorators: [
        (Story) => (
            <section className="max-w-5xl rounded-2xl border border-secondary bg-primary p-6 shadow-xs md:p-8">
                <p className="text-sm font-semibold text-brand-secondary">Years of service</p>
                <h2 className="mt-1 text-display-xs font-semibold text-primary">Your milestone timeline</h2>
                <div className="mt-6">{Story()}</div>
            </section>
        ),
    ],
};

/** The badge on its own, in every state, for both reward types. */
export const Badges: Story = {
    render: () => {
        const states: MilestoneState[] = ["ready", "redeemed", "reached", "next", "upcoming"];
        return (
            <div className="flex flex-col gap-6">
                {(["product", "points"] as const).map((rewardType) => (
                    <div key={rewardType} className="flex flex-wrap items-end gap-6">
                        {states.map((state) => (
                            <div key={state} className="flex flex-col items-center gap-2">
                                <MilestoneBadge
                                    value={rewardType === "product" ? 5 : 25}
                                    caption="YEARS"
                                    state={state}
                                    rewardType={rewardType}
                                    size="lg"
                                    label={state}
                                />
                                <span className="text-xs text-tertiary">
                                    {rewardType} · {state}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};
