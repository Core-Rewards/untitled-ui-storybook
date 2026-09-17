import type { Meta, StoryObj } from "@storybook/react-vite";
import { StreakTracker } from "./streak-tracker";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/StreakTracker",
    component: StreakTracker,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        currentStreak: { control: { type: "range", min: 0, max: 12, step: 1 } },
        variant: { control: "inline-radio", options: ["full", "compact"] },
        celebrateMilestone: { control: { type: "select" }, options: [undefined, 4, 8, 12] },
    },
    decorators: [
        (Story) => (
            <div className="mx-auto max-w-2xl">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof StreakTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Three months into a 12-month cycle. Drag the `currentStreak` control to step through. */
export const Default: Story = {
    args: {
        currentStreak: 3,
    },
};

/** Nothing earned yet — month 1 is highlighted as the one in play. */
export const NoStreak: Story = {
    args: {
        currentStreak: 0,
    },
};

/** The first milestone is banked at month 4. */
export const FirstMilestoneEarned: Story = {
    args: {
        currentStreak: 4,
    },
};

/** Past the halfway mark with two milestones to go. */
export const SecondMilestoneEarned: Story = {
    args: {
        currentStreak: 8,
    },
};

/** The full run is complete and every milestone is earned. Resets next month. */
export const CycleComplete: Story = {
    args: {
        currentStreak: 12,
    },
};

/** The milestone celebration animation, played on the marker that just unlocked. */
export const CelebratingMilestone: Story = {
    args: {
        currentStreak: 8,
        celebrateMilestone: 8,
    },
};

/** A broken streak, with a notice naming the run that was lost. */
export const AfterAMissedMonth: Story = {
    args: {
        currentStreak: 0,
        lostStreak: 7,
    },
};

/** The compact row, for dashboard headers and sidebars. */
export const Compact: Story = {
    args: {
        currentStreak: 6,
        variant: "compact",
    },
};

/** Compact with no streak started. */
export const CompactNoStreak: Story = {
    args: {
        currentStreak: 0,
        variant: "compact",
    },
};

/** A custom reward schedule on the standard 12-month cycle. */
export const CustomRewards: Story = {
    args: {
        currentStreak: 5,
        milestones: [
            { month: 4, reward: "1,000 pts" },
            { month: 8, reward: "2,500 pts" },
            { month: 12, reward: "10,000 pts" },
        ],
    },
};

/** A shorter six-month cycle — `cycleLength` and `milestones` travel together. */
export const SixMonthCycle: Story = {
    args: {
        currentStreak: 4,
        cycleLength: 6,
        milestones: [
            { month: 3, reward: "500 points" },
            { month: 6, reward: "2,000 points" },
        ],
    },
};
