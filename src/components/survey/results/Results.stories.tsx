import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ADMIN_NOW, AdminDemoShell } from "../stories/admin-demo-shell";
import { getSatisfactionSurvey } from "../survey-sample-data";
import { ResultsPage } from "./results-page";
import { generateQuizResults, getLiveQuizForResults } from "./quiz-results-sample-data";
import { generateSatisfactionResults } from "./results-sample-data";

const liveQuiz = getLiveQuizForResults();
const quizResponses = generateQuizResults();

const liveSurvey = getSatisfactionSurvey("en", { status: "live", opensAt: "2026-12-01T09:00:00-05:00", closesAt: "2026-12-15T23:59:00-05:00" });
const responses = generateSatisfactionResults();

const meta = {
    title: "Survey/Admin/Results",
    component: ResultsPage,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "Survey results (A9 Summary, A10 Responses), calculated live from the responses so the filters really work.",
                    "",
                    "- **Header metrics:** responses, completion rate (finished ÷ started), median time and reward issued.",
                    "- **Filters:** dates, language, completed only or include partial, and region for identified surveys.",
                    "- **Summary:** one card per question in survey order, drawn for its type (bars, NPS split, average rank, matrix, searchable text, number ranges, files). Questions behind logic say when they're shown.",
                    "- **Responses:** one row per response; open one to read it in the side drawer and step through with Newer / Older.",
                    "- **Privacy:** anonymous surveys never show names, and any filter leaving fewer than 5 responses is hidden.",
                    "- **Export:** CSV (downloads in the browser) or Excel (made by the platform), raw or summary, with or without partials. EN and FR answers share columns plus a language column.",
                    "- **Quizzes:** responses, average score, pass rate and what was actually paid (a quiz can pay less, or nothing). A score distribution marks the pass mark; scored questions show the right answer and how many got it; the table and drawer show each score and which answers were wrong. Exports add score, passed, reward and a right/wrong column per scored question.",
                ].join("\n"),
            },
        },
    },
    decorators: [
        (Story) => (
            <AdminDemoShell>
                <Story />
            </AdminDemoShell>
        ),
    ],
    args: {
        survey: liveSurvey,
        responses,
        now: ADMIN_NOW,
        onExit: fn(),
        onEditSurvey: fn(),
        onExport: fn(),
    },
} satisfies Meta<typeof ResultsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A9: the wireframe's live survey, 412 responses. */
export const Summary: Story = {};

/** A10: the responses table. Open a row for the side drawer. */
export const Responses: Story = { args: { initialTab: "responses" } };

/** Identified survey: names, accounts and a region filter. */
export const Identified: Story = {
    args: {
        survey: { ...liveSurvey, anonymity: "identified" },
        responses: generateSatisfactionResults({ identified: true }),
    },
};

/** Anonymous with only 3 responses: everything is hidden so no one can be picked out. */
export const SmallGroupHidden: Story = { name: "Small group hidden", args: { responses: responses.filter((r) => r.status === "complete").slice(0, 3) } };

/** Live, but no responses yet. */
export const NoResponses: Story = { name: "No responses yet", args: { responses: [] } };

// ─── Quizzes ─────────────────────────────────────────────────────────────────

/** A live quiz paying 250 points on a pass (80%): average score, pass rate, score distribution and the right answer on each scored question. */
export const QuizSummary: Story = { name: "Quiz summary", args: { survey: liveQuiz, responses: quizResponses } };

/** Score and Result columns. Open a row to see which answers were wrong and the right ones. */
export const QuizResponses: Story = { name: "Quiz responses", args: { survey: liveQuiz, responses: quizResponses, initialTab: "responses" } };

/** Tiered rewards (100% → 500, 80% → 300, 60% → 150): Points issued adds up what each person actually earned. */
export const QuizTiered: Story = {
    name: "Quiz with tiered rewards",
    args: {
        survey: getLiveQuizForResults({
            reward: { type: "points", amount: 500 },
            quiz: {
                passMark: 60,
                rewardRule: "tiered",
                reveal: "at_end",
                tiers: [
                    { minScore: 100, amount: 500 },
                    { minScore: 80, amount: 300 },
                    { minScore: 60, amount: 150 },
                ],
            },
        }),
        responses: quizResponses,
    },
};
