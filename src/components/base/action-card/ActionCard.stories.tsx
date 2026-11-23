import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpen01, Calendar, CalendarDate, Clock, ClockStopwatch, List } from "@untitledui/icons";
import { fn } from "storybook/test";
import { Badge } from "@/components/base/badges/badge";
import { ActionCard } from "./action-card";

const meta = {
    title: "Base/ActionCard",
    component: ActionCard,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "A full-width dashboard card on a light grey panel, like Quiz and ConciergeCta, in three bands: a header (label and badge), a body (title, description, progress and the button) and a footer (short facts such as time and dates). It asks the participant to do one thing and shows where they are with it: new, in progress, completed, not open yet or closed. Surveys use it first; promotions, arcade, training and profile completion can reuse it. With room, copy sits left and the button right; when narrow it stacks and the button goes full width (container query).",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        status: { control: "inline-radio", options: ["new", "in_progress", "completed", "upcoming", "closed"] },
    },
    decorators: [
        (Story) => (
            <div className="max-w-[1120px]">
                <Story />
            </div>
        ),
    ],
    args: {
        eyebrow: "New survey",
        title: "2026 Program Satisfaction",
        description: "Tell us how the program is working for you.",
        meta: [
            { label: "About 2 min", icon: Clock },
            { label: "5 questions", icon: List },
            { label: "Closes Dec 15", icon: Calendar },
        ],
        badge: (
            <Badge color="gray" size="md">
                Earn 500 points
            </Badge>
        ),
        status: "new",
        action: { label: "Start", onPress: fn() },
    },
} satisfies Meta<typeof ActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const InProgress: Story = {
    name: "In progress",
    args: { eyebrow: "Survey in progress", status: "in_progress", progress: { current: 2, total: 5 }, action: { label: "Resume · 3 of 5", onPress: fn() } },
};

export const Completed: Story = {
    args: { eyebrow: "Survey completed", status: "completed", badge: undefined, action: undefined, statusLine: "Completed · +500 points" },
};

export const Upcoming: Story = { args: { status: "upcoming", action: undefined, statusLine: "Opens Dec 1", statusIcon: CalendarDate } };

export const Closed: Story = {
    args: {
        status: "closed",
        meta: undefined,
        action: undefined,
        statusLine: "This survey closed on Dec 15. Thanks for your interest.",
        statusIcon: ClockStopwatch,
    },
};

/** In a narrow column (or on a phone) the card stacks and the button goes full width. */
export const Narrow: Story = { decorators: [(Story) => <div className="max-w-sm">{Story()}</div>] };

/** Reused for training: a different eyebrow, badge and action. */
export const Training: Story = {
    args: {
        eyebrow: "Training",
        title: "How to submit a sale in under a minute",
        description: "A 3-minute video and a quick check.",
        meta: ["3 min", "2 questions"],
        badge: (
            <Badge color="brand" size="md">
                <BookOpen01 className="size-3.5" aria-hidden="true" /> 250 points
            </Badge>
        ),
        status: "in_progress",
        progress: { current: 1, total: 2 },
        action: { label: "Continue", onPress: fn() },
    },
};
