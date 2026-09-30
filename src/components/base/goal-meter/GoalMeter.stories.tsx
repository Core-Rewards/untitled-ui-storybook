import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "@/components/base/buttons/button";
import { GoalMeter } from "./goal-meter";
import type { GoalTier } from "./goal-meter-types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** A fixed "today" (Aug 20, 49% through Q3) so dates, countdowns and pace never drift. */
const TODAY = new Date("2026-08-20T12:00:00");

const Q3 = { label: "Q3 2026", start: "2026-07-01", end: "2026-09-30" };

const salesTiers: GoalTier[] = [
    { id: "bronze", threshold: 15_000, label: "Bronze", reward: { points: 500 }, message: "Bronze unlocked. 500 points are on their way." },
    { id: "silver", threshold: 30_000, label: "Silver", reward: { points: 1_500 }, message: "You've unlocked Silver! 1,500 more points banked." },
    {
        id: "gold",
        threshold: 50_000,
        label: "Gold",
        reward: { points: 3_500, label: "Trip entry" },
        message: "Gold reached. You're entered in the President's Club trip draw.",
    },
];

const enrollmentTiers: GoalTier[] = [
    { id: "t1", threshold: 10, label: "Tier 1", reward: { points: 250 } },
    { id: "t2", threshold: 20, label: "Tier 2", reward: { points: 750 } },
    { id: "t3", threshold: 25, label: "Tier 3", reward: { points: 1_500 } },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/GoalMeter",
    component: GoalMeter,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    args: {
        now: TODAY,
        onTierReached: fn(),
    },
    argTypes: {
        value: { control: { type: "number", step: 500 } },
        goalType: { control: "select", options: ["currency", "quantity", "percent", "points", "custom"] },
        variant: { control: "inline-radio", options: ["linear", "segmented", "radial"] },
        size: { control: "inline-radio", options: ["sm", "md", "lg"] },
        layout: { control: "inline-radio", options: ["card", "inline"] },
        rewardMode: { control: "inline-radio", options: ["cumulative", "highest"] },
        status: { control: "select", options: [undefined, "upcoming", "not-started", "in-progress", "completed", "ended"] },
        now: { control: false },
    },
    decorators: [
        (Story) => (
            <div className="mx-auto max-w-[1120px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof GoalMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Goal types ───────────────────────────────────────────────────────────────

/**
 * A quarterly sales-dollar goal with three reward tiers, pace tracking and a
 * points summary. The rep just crossed Silver since their last visit, so the
 * meter counts up from `previousValue` and celebrates the marker.
 */
export const SalesDollars: Story = {
    args: {
        title: "Q3 Accessories Sales",
        description: "Sell $50K in accessories to reach Gold.",
        goalType: "currency",
        value: 32_500,
        previousValue: 28_000,
        tiers: salesTiers,
        period: Q3,
        showPace: true,
    },
};

/** A count goal with a custom unit noun. */
export const Quantity: Story = {
    args: {
        title: "Warranty enrollments",
        description: "Enroll customers in extended warranty this quarter.",
        goalType: "quantity",
        unit: { singular: "enrollment", plural: "enrollments" },
        value: 17,
        tiers: enrollmentTiers,
        period: Q3,
    },
};

/** No tiers: a single target, with the finish line as the only marker. */
export const SingleTarget: Story = {
    args: {
        title: "Training modules",
        goalType: "quantity",
        unit: { singular: "module", plural: "modules" },
        value: 6,
        target: 10,
        tiers: [],
    },
};

/** An attainment goal measured in percent. */
export const Percent: Story = {
    args: {
        title: "Customer satisfaction",
        description: "Average CSAT across your stores.",
        goalType: "percent",
        startValue: 80,
        value: 88.5,
        tiers: [
            { id: "good", threshold: 85, label: "Good", reward: { points: 200 } },
            { id: "great", threshold: 90, label: "Great", reward: { points: 600 } },
            { id: "elite", threshold: 95, label: "Elite", reward: { points: 1_200 } },
        ],
    },
};

/** A goal of earning points, with the program's own currency name. */
export const PointsGoal: Story = {
    args: {
        title: "Earn 10,000 Stars",
        goalType: "points",
        pointsLabel: { singular: "Star", plural: "Stars" },
        value: 6_200,
        tiers: [
            { id: "half", threshold: 5_000, label: "Halfway", reward: { label: "Free coffee" } },
            { id: "full", threshold: 10_000, label: "Goal", reward: { label: "$25 gift card" } },
        ],
    },
};

/** Anything else: pass `formatValue` to control every number the meter shows. */
export const CustomFormat: Story = {
    args: {
        title: "Volunteer hours",
        goalType: "custom",
        value: 14.5,
        target: 40,
        tiers: [
            { id: "h10", threshold: 10, label: "Helper", reward: { points: 100 } },
            { id: "h25", threshold: 25, label: "Champion", reward: { points: 400 } },
            { id: "h40", threshold: 40, label: "Hero", reward: { points: 1_000 } },
        ],
        formatValue: (value, { compact }) => (compact ? `${Math.round(value)}h` : `${value.toFixed(1)} hrs`),
    },
};

// ─── Progress states ──────────────────────────────────────────────────────────

/** Nothing logged yet. The message points at the first tier. */
export const NotStarted: Story = {
    args: {
        ...SalesDollars.args,
        value: 0,
        previousValue: undefined,
    },
};

/** Behind the straight-line pace to the target. The dark tick marks where progress should be today. */
export const BehindPace: Story = {
    args: {
        ...SalesDollars.args,
        value: 16_000,
        previousValue: undefined,
    },
};

/** Well ahead of pace, with a projection past the target. */
export const AheadOfPace: Story = {
    args: {
        ...SalesDollars.args,
        value: 41_000,
        previousValue: undefined,
    },
};

/**
 * Past the target with `allowOverachievement`: the second lap shows progress
 * beyond 100%, and `pointsPerUnit` pays a bonus on every $100 over goal.
 */
export const Overachievement: Story = {
    args: {
        ...SalesDollars.args,
        value: 58_400,
        previousValue: 47_000,
        allowOverachievement: true,
        pointsPerUnit: { points: 5, every: 100 },
    },
};

/** Without `allowOverachievement`, the meter stops at 100% however far past the target the value goes. */
export const CappedAtTarget: Story = {
    args: {
        ...Overachievement.args,
        allowOverachievement: false,
        pointsPerUnit: undefined,
    },
};

/** `rewardMode: "highest"` pays only the top tier reached, so Silver pays 1,500 rather than 2,000. */
export const HighestTierOnly: Story = {
    args: {
        ...SalesDollars.args,
        rewardMode: "highest",
        previousValue: undefined,
    },
};

/** The period has not opened yet. */
export const Upcoming: Story = {
    args: {
        ...SalesDollars.args,
        title: "Q4 Accessories Sales",
        value: 0,
        previousValue: undefined,
        period: { label: "Q4 2026", start: "2026-10-01", end: "2026-12-31" },
    },
};

/** The period has closed. The meter reports where the rep finished. */
export const PeriodEnded: Story = {
    args: {
        ...SalesDollars.args,
        title: "Q2 Accessories Sales",
        value: 36_750,
        previousValue: undefined,
        period: { label: "Q2 2026", start: "2026-04-01", end: "2026-06-30" },
    },
};

/** Every default message can be replaced with a template. See `GoalMessages` for the tokens. */
export const CustomMessages: Story = {
    args: {
        ...SalesDollars.args,
        previousValue: undefined,
        messages: {
            inProgress: "Only {remaining} until {nextTier}. That's {reward} with {daysLeft} days to go.",
        },
    },
};

// ─── Variants ─────────────────────────────────────────────────────────────────

/** One block per tier. Each block fills on its own, so progress reads tier by tier. */
export const Segmented: Story = {
    args: {
        ...SalesDollars.args,
        variant: "segmented",
    },
};

/** A ring gauge with the tier list beside it. Stacks on narrow screens. */
export const Radial: Story = {
    args: {
        ...SalesDollars.args,
        variant: "radial",
    },
};

/** Radial past the target: the inner ring is the second lap. */
export const RadialOverachievement: Story = {
    args: {
        ...Overachievement.args,
        variant: "radial",
    },
};

/** All three sizes of the linear meter. */
export const Sizes: Story = {
    args: { ...Quantity.args },
    render: (args) => (
        <div className="flex flex-col gap-6">
            <GoalMeter {...args} size="sm" title="Small" description={undefined} />
            <GoalMeter {...args} size="md" title="Medium" description={undefined} />
            <GoalMeter {...args} size="lg" title="Large" description={undefined} />
        </div>
    ),
};

// ─── Layouts ──────────────────────────────────────────────────────────────────

/** Compact radial cards for a dashboard row. */
export const DashboardCards: Story = {
    args: { ...SalesDollars.args },
    render: (args) => (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <GoalMeter {...args} variant="radial" size="sm" title="Accessories" description={undefined} showPace={false} />
            <GoalMeter {...Quantity.args} value={17} now={TODAY} variant="radial" size="sm" title="Warranties" description={undefined} />
            <GoalMeter {...Percent.args} value={88.5} now={TODAY} variant="radial" size="sm" title="CSAT" description={undefined} />
        </div>
    ),
};

const reps = [
    { name: "Avery Chen", value: 52_300 },
    { name: "Jordan Patel", value: 38_900 },
    { name: "Sam Rivera", value: 21_400 },
    { name: "Riley Brooks", value: 9_800 },
];

/** `layout: "inline"` drops the card chrome and labels so the meter fits a table row. */
export const InlineInTable: Story = {
    args: { ...SalesDollars.args, layout: "inline", size: "sm" },
    render: (args) => (
        <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary text-xs text-tertiary">
                <tr>
                    <th className="py-2 pr-4 font-medium">Rep</th>
                    <th className="w-2/3 py-2 font-medium">Q3 progress</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
                {reps.map((rep) => (
                    <tr key={rep.name}>
                        <td className="py-3 pr-4 font-medium whitespace-nowrap text-primary">{rep.name}</td>
                        <td className="py-3">
                            <GoalMeter {...args} value={rep.value} previousValue={undefined} title={undefined} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    ),
};

// ─── Interaction ──────────────────────────────────────────────────────────────

/**
 * Log sales to watch the meter animate, markers celebrate as tiers are crossed,
 * and `onTierReached` fire (see the Actions panel).
 */
export const LiveProgress: Story = {
    args: { ...SalesDollars.args, value: 12_000, previousValue: undefined },
    render: function Render(args) {
        const [value, setValue] = useState(args.value);

        return (
            <div className="flex flex-col gap-4">
                <GoalMeter {...args} value={value} />
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setValue((v) => v + 2_500)}>
                        Log a $2,500 sale
                    </Button>
                    <Button size="sm" color="secondary" onClick={() => setValue((v) => v + 10_000)}>
                        Log a $10,000 sale
                    </Button>
                    <Button size="sm" color="tertiary" onClick={() => setValue(args.value)}>
                        Reset
                    </Button>
                </div>
            </div>
        );
    },
};
