import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ParticipantDemoShell } from "../stories/participant-demo-shell";
import { STORY_NOW } from "../stories/survey-story-helpers";
import type { ActivityItem } from "./activity-logic";
import { groupActivities } from "./activity-logic";
import { activitySamples, sampleActivities } from "./activity-sample-data";
import { DashboardActivities } from "./dashboard-activities";
import { SurveysPage } from "./surveys-page";
import type { SurveysPageProps } from "./surveys-page";

const phone = { viewport: { value: "phone", isRotated: false } };

/** Dashboard and the Surveys & quizzes page together: "View all" opens the page. */
const Demo = ({
    items,
    start,
    onOpen,
    maxRows,
    variant,
    locale,
}: {
    items: ActivityItem[];
    start: "dashboard" | "page";
    onOpen: SurveysPageProps["onOpen"];
    maxRows?: number;
    variant?: "full" | "compact";
    locale?: "en" | "fr";
}) => {
    const [view, setView] = useState(start);
    const available = groupActivities(items, STORY_NOW).available.length;
    return (
        <ParticipantDemoShell activeId={view === "page" ? "surveys" : "dashboard"} available={available}>
            {view === "page" ? (
                <SurveysPage items={items} now={STORY_NOW} onOpen={onOpen} locale={locale} />
            ) : (
                <div className="flex flex-col gap-6">
                    <h1 className="text-display-xs font-semibold text-primary">Welcome back, Jordan</h1>
                    <DashboardActivities
                        items={items}
                        now={STORY_NOW}
                        maxRows={maxRows}
                        variant={variant}
                        locale={locale}
                        onOpen={onOpen}
                        onViewAll={() => setView("page")}
                    />
                    <div className="grid gap-6 lg:grid-cols-2">
                        {["Current promotions", "Featured rewards"].map((t) => (
                            <section key={t} className="flex flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset">
                                <h2 className="text-md font-semibold text-primary">{t}</h2>
                                <div className="h-14 rounded-xl bg-secondary" />
                            </section>
                        ))}
                    </div>
                </div>
            )}
        </ParticipantDemoShell>
    );
};

const meta = {
    title: "Survey/Participant/Surveys & quizzes",
    component: SurveysPage,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "Where participants find every survey and quiz, plus how the dashboard handles more than one.",
                    "",
                    "- **Page:** a “Surveys & quizzes” nav item (with how many are open) opens tabs for **Available** (started first, then closing soonest, then the bigger reward), **Upcoming** and **Completed** (reward earned, and the score for quizzes). Items that closed before the participant took part aren't shown. All / Surveys / Quizzes filters appear once there are quizzes.",
                    '- **Compact dashboard:** `variant="compact"` swaps the cards for one row: how many surveys and quizzes are open, how many are started, when the next closes, the points on offer, and View all.',
                    "- **Dashboard:** the most relevant item gets the full card, up to two more show as compact rows, and **View all** opens the page. With nothing open, a just-finished item (for 3 days) or the next upcoming one takes the card.",
                    "- **Quizzes:** reward wording follows the quiz's rule: “Earn 300 points” on completion, “Pass to earn 250 points”, or “Earn up to 500 points” when tiered. Quizzes can't be retaken.",
                    "- Built on `Base/ActionCard` and the new compact `ActionRow`.",
                ].join("\n"),
            },
        },
    },
    render: (args) => <Demo items={args.items} start="page" onOpen={args.onOpen} />,
    args: {
        items: sampleActivities,
        now: STORY_NOW,
        onOpen: fn(),
    },
} satisfies Meta<typeof SurveysPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Page ────────────────────────────────────────────────────────────────────

/** Two quizzes and a started survey are open. The closed spring survey they missed isn't listed. */
export const Page: Story = {};

export const PagePhone: Story = { name: "Page (phone)", globals: phone };

export const PageUpcoming: Story = {
    name: "Page · Upcoming",
    render: (args) => (
        <ParticipantDemoShell activeId="surveys" available={3}>
            <SurveysPage items={args.items} now={STORY_NOW} onOpen={args.onOpen} initialTab="upcoming" />
        </ParticipantDemoShell>
    ),
};

/** A completed survey, a passed quiz, and a quiz that wasn't passed on a pass-only reward. */
export const PageCompleted: Story = {
    name: "Page · Completed",
    render: (args) => (
        <ParticipantDemoShell activeId="surveys" available={3}>
            <SurveysPage items={args.items} now={STORY_NOW} onOpen={args.onOpen} initialTab="completed" />
        </ParticipantDemoShell>
    ),
};

/** Surveys only: no quiz filters. */
export const PageSurveysOnly: Story = {
    name: "Page · Surveys only",
    args: { items: [activitySamples.satisfaction, activitySamples.catalogSurvey, activitySamples.growerSurvey] },
};

export const PageNothingYet: Story = { name: "Page · Nothing yet", args: { items: [] } };

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** Three open: the started survey is featured, the two quizzes are rows. */
export const Dashboard: Story = { render: (args) => <Demo items={args.items} start="dashboard" onOpen={args.onOpen} /> };

export const DashboardPhone: Story = {
    name: "Dashboard (phone)",
    globals: phone,
    render: (args) => <Demo items={args.items} start="dashboard" onOpen={args.onOpen} />,
};

/** With only one row allowed, the rest go behind “View all 3”. */
export const DashboardOneRow: Story = {
    name: "Dashboard · View all",
    render: (args) => <Demo items={args.items} start="dashboard" onOpen={args.onOpen} maxRows={1} />,
};

/** One survey open: just its card. */
export const DashboardSingle: Story = {
    name: "Dashboard · One open",
    render: (args) => <Demo items={[activitySamples.satisfaction]} start="dashboard" onOpen={args.onOpen} />,
};

/** Nothing open, nothing just finished: the next upcoming survey takes the card. */
export const DashboardUpcomingOnly: Story = {
    name: "Dashboard · Only upcoming",
    render: (args) => <Demo items={[activitySamples.catalogSurvey, activitySamples.growerSurvey]} start="dashboard" onOpen={args.onOpen} />,
};

// ─── Compact dashboard ───────────────────────────────────────────────────────

/** One row instead of cards: “1 survey and 2 quizzes available”, with View all opening the page. */
export const DashboardCompact: Story = {
    name: "Dashboard · Compact",
    render: (args) => <Demo items={args.items} start="dashboard" variant="compact" onOpen={args.onOpen} />,
};

export const DashboardCompactPhone: Story = {
    name: "Dashboard · Compact (phone)",
    globals: phone,
    render: (args) => <Demo items={args.items} start="dashboard" variant="compact" onOpen={args.onOpen} />,
};

/** Nothing open: says when the next one opens. */
export const DashboardCompactUpcoming: Story = {
    name: "Dashboard · Compact, nothing open",
    render: (args) => <Demo items={[activitySamples.catalogSurvey, activitySamples.growerSurvey]} start="dashboard" variant="compact" onOpen={args.onOpen} />,
};

export const DashboardCompactFrench: Story = {
    name: "Dashboard · Compact (French)",
    render: (args) => <Demo items={args.items} start="dashboard" variant="compact" locale="fr" onOpen={args.onOpen} />,
};
