import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/base/buttons/button";
import { STORY_NOW } from "../stories/survey-story-helpers";
import { SurveyDashboardDemo } from "../stories/survey-dashboard-demo";
import { useMockSurveySession } from "../stories/use-mock-survey-session";
import { getSatisfactionSurvey, inProgressResponse, notStartedResponse } from "../survey-sample-data";
import type { SurveyLocale, SurveyResponse } from "../survey-types";
import { SurveyDashboardCard } from "./survey-dashboard-card";
import { SurveyPlayer } from "./survey-player";

interface FlowDemoProps {
    locale: SurveyLocale;
    /** Where the participant starts. */
    start: "new" | "in_progress";
    /** The first submit fails, to show the retry message and that the reward is still paid once. */
    failFirstSubmit: boolean;
}

const BALANCE = 12450;

/**
 * Dashboard → card → intro → questions (with Q1's jump rule) → submit → thank-you
 * → dashboard, using a mock platform that autosaves and pays once.
 */
const FlowDemo = ({ locale, start, failFirstSubmit }: FlowDemoProps) => {
    const [survey] = useState(() => getSatisfactionSurvey(locale));
    const initial = start === "in_progress" ? inProgressResponse(locale) : notStartedResponse(locale);
    const session = useMockSurveySession(survey, initial, { failFirstSubmit });
    const [view, setView] = useState<"dashboard" | "survey">("dashboard");
    const [opened, setOpened] = useState<SurveyResponse | undefined>();

    if (view === "survey") {
        return (
            <SurveyPlayer
                survey={survey}
                response={opened}
                now={STORY_NOW}
                onResponseChange={session.onResponseChange}
                onSubmit={session.onSubmit}
                onExit={(r) => {
                    session.onExit(r);
                    setView("dashboard");
                }}
                onNavigate={() => setView("dashboard")}
            />
        );
    }

    return (
        <SurveyDashboardDemo
            pointsBalance={BALANCE + session.pointsPaid}
            pointsAward={session.pointsPaid ? { id: 1, amount: session.pointsPaid } : null}
            footer={<EventLog events={session.events} onReset={() => session.reset(initial)} />}
        >
            <SurveyDashboardCard
                survey={survey}
                response={session.response}
                now={STORY_NOW}
                onOpen={() => {
                    setOpened(session.response);
                    setView("survey");
                }}
            />
        </SurveyDashboardDemo>
    );
};

const EventLog = ({ events, onReset }: { events: ReturnType<typeof useMockSurveySession>["events"]; onReset: () => void }) => (
    <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-secondary p-5">
        <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-secondary">Mock platform log (story only)</h2>
            <Button size="sm" color="secondary" onClick={onReset}>
                Reset
            </Button>
        </div>
        {events.length === 0 ? (
            <p className="text-sm text-tertiary">Start the survey. Autosaves, submits and reward payouts appear here.</p>
        ) : (
            <ol className="flex flex-col gap-1 font-mono text-xs text-tertiary">
                {events.map((e, i) => (
                    <li key={i}>
                        <span className="text-quaternary">{e.at}</span> <span className="font-semibold text-secondary">{e.kind}</span> {e.detail}
                    </li>
                ))}
            </ol>
        )}
    </section>
);

const meta = {
    title: "Survey/Participant/Flow",
    component: FlowDemo,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "The whole participant journey, end to end, on a mock platform. Click through it:",
                    "",
                    "1. **Start** on the dashboard card, then Start on the intro (or press Enter).",
                    "2. Answer Q1. A 1 or 2 asks “What's not working for you?”; 3 to 5 skips to Q3 (jump logic).",
                    "3. Tap a number to auto-advance; multi-select and text use Next. Back keeps answers.",
                    "4. **Save and exit** (or ×) mid-way: the card shows **Resume · N of 5** and resumes at the next unanswered question.",
                    "5. Submit: points land once, the sidebar balance counts up, and the card shows Completed.",
                    "",
                    "The log under the dashboard shows each autosave and payout. With *failFirstSubmit* on, the first submit errors, the participant retries, and the reward is still paid once.",
                ].join("\n"),
            },
        },
    },
    argTypes: {
        locale: { control: "inline-radio", options: ["en", "fr"] },
        start: { control: "inline-radio", options: ["new", "in_progress"] },
    },
    args: { locale: "en", start: "new", failFirstSubmit: false },
    render: (args) => <FlowDemo key={`${args.locale}-${args.start}-${args.failFirstSubmit}`} {...args} />,
} satisfies Meta<typeof FlowDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = { globals: { viewport: { value: "phone", isRotated: false } } };

export const Desktop: Story = {};

/** Starts with Q1 and Q2 answered. Resume lands on Q3. */
export const Resume: Story = { globals: { viewport: { value: "phone", isRotated: false } }, args: { start: "in_progress" } };

/** The first submit fails; retrying succeeds and the reward is paid once. */
export const SubmitRetry: Story = {
    name: "Submit fails, then retry",
    globals: { viewport: { value: "phone", isRotated: false } },
    args: { failFirstSubmit: true },
};

export const French: Story = { globals: { viewport: { value: "phone", isRotated: false } }, args: { locale: "fr" } };
