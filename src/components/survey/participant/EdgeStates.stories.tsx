import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { getSatisfactionSurvey } from "../survey-sample-data";
import { SurveyUnavailable } from "./survey-unavailable";

const phone = { viewport: { value: "phone", isRotated: false } };

const meta = {
    title: "Survey/Participant/Edge states",
    component: SurveyUnavailable,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "What a participant sees when a survey link isn't usable. `getSurveyAvailability()` picks the state:",
                    "",
                    "- **Not open yet**: “Opens Dec 1”, no Start button.",
                    "- **Closed**: “This survey closed on Dec 15. Thanks for your interest.” Anyone who started before close can still submit for 24 hours (`DEFAULT_GRACE_PERIOD_HOURS`, to confirm).",
                    "- **Already completed**: says so, with the reward earned.",
                    "",
                    "Signing in from an email link is handled by the platform: sign in, then land on the survey.",
                ].join("\n"),
            },
        },
    },
    decorators: [
        (Story, { args }) => (
            <SurveyLocaleProvider locale={args.survey.locale}>
                <Story />
            </SurveyLocaleProvider>
        ),
    ],
    args: {
        survey: getSatisfactionSurvey("en", { opensAt: "2026-12-01T09:00:00-05:00", status: "scheduled" }),
        reason: "not_open",
        onBack: fn(),
    },
} satisfies Meta<typeof SurveyUnavailable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotOpenYet: Story = { name: "Not open yet", globals: phone };

export const Closed: Story = { globals: phone, args: { survey: getSatisfactionSurvey("en"), reason: "closed" } };

export const AlreadyCompleted: Story = { name: "Already completed", globals: phone, args: { survey: getSatisfactionSurvey("en"), reason: "completed" } };

export const ClosedDesktop: Story = { name: "Closed (desktop)", args: { survey: getSatisfactionSurvey("en"), reason: "closed" } };

export const French: Story = { globals: phone, args: { survey: getSatisfactionSurvey("fr"), reason: "closed" } };
