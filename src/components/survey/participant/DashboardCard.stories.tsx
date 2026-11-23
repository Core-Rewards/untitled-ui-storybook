import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { STORY_NOW } from "../stories/survey-story-helpers";
import { SurveyDashboardDemo } from "../stories/survey-dashboard-demo";
import { completedResponse, getSatisfactionSurvey, inProgressResponse, notStartedResponse } from "../survey-sample-data";
import { SurveyDashboardCard } from "./survey-dashboard-card";

const meta = {
    title: "Survey/Participant/Dashboard card",
    component: SurveyDashboardCard,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "The survey's card on the participant dashboard (P2 / D1). Built on the shared `Base/ActionCard`: a full-width light grey panel like Quiz and ConciergeCta, with the button on the right when there is room and full width underneath on phones. Once completed it shows **Completed · +500 points** for a few days, then the platform drops it.",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="max-w-[1120px]">
                <Story />
            </div>
        ),
    ],
    args: {
        survey: getSatisfactionSurvey("en"),
        response: notStartedResponse(),
        now: STORY_NOW,
        onOpen: fn(),
    },
} satisfies Meta<typeof SurveyDashboardCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

/** Answered 2 of 5. Resume goes straight to the next unanswered question. */
export const InProgress: Story = { name: "In progress", args: { response: inProgressResponse() } };

export const Completed: Story = { args: { response: completedResponse() } };

export const NotOpenYet: Story = {
    name: "Not open yet",
    args: { survey: getSatisfactionSurvey("en", { opensAt: "2026-12-01T09:00:00-05:00", status: "scheduled" }) },
};

export const Closed: Story = { args: { survey: getSatisfactionSurvey("en", { closesAt: "2026-11-15T23:59:00-05:00", status: "closed" }) } };

export const French: Story = { args: { survey: getSatisfactionSurvey("fr"), response: inProgressResponse("fr") } };

/** On a phone the card stacks and the button goes full width. */
export const Narrow: Story = { decorators: [(Story) => <div className="max-w-sm">{Story()}</div>] };

/** Sweepstakes entries instead of points. */
export const SweepstakesReward: Story = {
    name: "Sweepstakes reward",
    args: { survey: getSatisfactionSurvey("en", { reward: { type: "sweepstakes", amount: 3 } }) },
};

/** On the existing participant dashboard (Base/AppShell). Only the survey card is new. */
export const OnDashboard: Story = {
    name: "On the dashboard",
    parameters: { layout: "fullscreen" },
    decorators: [(Story) => <Story />],
    render: (args) => (
        <SurveyDashboardDemo>
            <SurveyDashboardCard {...args} />
        </SurveyDashboardDemo>
    ),
};

export const OnDashboardPhone: Story = {
    ...OnDashboard,
    name: "On the dashboard (phone)",
    globals: { viewport: { value: "phone", isRotated: false } },
};
