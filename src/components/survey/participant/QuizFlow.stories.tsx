import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ParticipantDemoShell } from "../stories/participant-demo-shell";
import { STORY_NOW } from "../stories/survey-story-helpers";
import { useMockSurveySession } from "../stories/use-mock-survey-session";
import { getFungicideQuiz, quizInProgress, quizNotStarted } from "../quiz-sample-data";
import type { QuizAnswerReveal, QuizRewardRule, QuizSettings, SurveyLocale, SurveyResponse } from "../survey-types";
import type { ActivityItem } from "./activity-logic";
import { groupActivities } from "./activity-logic";
import { activitySamples } from "./activity-sample-data";
import { SurveyPlayer } from "./survey-player";
import { SurveysPage } from "./surveys-page";

interface QuizFlowProps {
    locale: SurveyLocale;
    /** When right answers and explanations are shown. */
    reveal: QuizAnswerReveal;
    /** How the reward is paid. Tiered pays 500 / 300 / 150 at 100% / 80% / 60%. */
    rewardRule: QuizRewardRule;
    start: "new" | "in_progress";
}

const settingsFor = (rule: QuizRewardRule, reveal: QuizAnswerReveal): Partial<QuizSettings> =>
    rule === "tiered"
        ? {
              reveal,
              rewardRule: "tiered",
              passMark: 60,
              tiers: [
                  { minScore: 100, amount: 500 },
                  { minScore: 80, amount: 300 },
                  { minScore: 60, amount: 150 },
              ],
          }
        : { reveal, rewardRule: rule };

/**
 * Surveys & quizzes page → quiz → results → back to the page, where the quiz now
 * sits under Completed with its score. A mock platform grades and pays once.
 */
const QuizFlowDemo = ({ locale, reveal, rewardRule, start }: QuizFlowProps) => {
    const [quiz] = useState(() =>
        getFungicideQuiz(locale, rewardRule === "tiered" ? { reward: { type: "points", amount: 500 } } : {}, settingsFor(rewardRule, reveal)),
    );
    const initial = start === "in_progress" ? quizInProgress(locale) : quizNotStarted(locale);
    const session = useMockSurveySession(quiz, initial);
    const [open, setOpen] = useState<SurveyResponse | undefined | null>(null);

    if (open !== null) {
        return (
            <SurveyPlayer
                survey={quiz}
                response={open}
                now={STORY_NOW}
                onResponseChange={session.onResponseChange}
                onSubmit={session.onSubmit}
                onExit={(r) => {
                    session.onExit(r);
                    setOpen(null);
                }}
                onNavigate={() => setOpen(null)}
            />
        );
    }

    const items: ActivityItem[] = [
        { survey: quiz, response: session.response },
        activitySamples.satisfaction,
        activitySamples.seedQuiz,
        activitySamples.agronomyQuiz,
        activitySamples.safetyQuiz,
    ];
    const done = session.response?.status === "complete";
    return (
        <ParticipantDemoShell activeId="surveys" available={groupActivities(items, STORY_NOW).available.length}>
            <div className="flex flex-col gap-6">
                {/* Remount on finish so the page opens on Completed, where the score now shows. */}
                <SurveysPage
                    key={done ? "done" : "open"}
                    items={items}
                    now={STORY_NOW}
                    locale={locale}
                    initialTab={done ? "completed" : "available"}
                    onOpen={(item) => item.survey.id === quiz.id && setOpen(session.response)}
                />
                <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-secondary p-5">
                    <h2 className="text-sm font-semibold text-secondary">Mock platform log (story only)</h2>
                    {session.events.length === 0 ? (
                        <p className="text-sm text-tertiary">Open the 2027 Fungicide Lineup Quiz. Autosaves, grading and payouts appear here.</p>
                    ) : (
                        <ol className="flex flex-col gap-1 font-mono text-xs text-tertiary">
                            {session.events.map((e, i) => (
                                <li key={i}>
                                    <span className="text-quaternary">{e.at}</span> <span className="font-semibold text-secondary">{e.kind}</span> {e.detail}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </ParticipantDemoShell>
    );
};

const meta = {
    title: "Survey/Participant/Quiz flow",
    component: QuizFlowDemo,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "A quiz end to end: the same player as surveys, with scoring. Open **2027 Fungicide Lineup Quiz** from the page.",
                    "",
                    "- **Intro:** reward wording follows the rule (“Pass to earn 250 points”), plus the pass mark and “One try”. Quizzes are always linked to the participant's account.",
                    "- **Scored questions:** multiple choice (single or all-correct multi-select), dropdown and yes / no. Q6 is collected but not scored.",
                    "- **Reveal: each question** adds a Check answer step with Correct / Not quite, the right answer and the explanation. Back is off, since a revealed answer can't change. **At end** shows them on the results screen. **Never** shows only the score.",
                    "- **Results:** score, passed or not, the reward actually earned (or what it would have taken), and the review. Back on the page the quiz moves to Completed with its score.",
                    "",
                    "To pass (80%), the answers are Corvana, 12 hours, Yes, Wheat + Barley, and 2.",
                ].join("\n"),
            },
        },
    },
    argTypes: {
        locale: { control: "inline-radio", options: ["en", "fr"] },
        reveal: { control: "inline-radio", options: ["each_question", "at_end", "never"] },
        rewardRule: { control: "inline-radio", options: ["completion", "pass", "tiered"] },
        start: { control: "inline-radio", options: ["new", "in_progress"] },
    },
    args: { locale: "en", reveal: "at_end", rewardRule: "pass", start: "new" },
    render: (args) => <QuizFlowDemo key={JSON.stringify(args)} {...args} />,
} satisfies Meta<typeof QuizFlowDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const phone = { viewport: { value: "phone", isRotated: false } };

/** Answers revealed on the results screen. */
export const Phone: Story = { globals: phone };

export const Desktop: Story = {};

/** Check answer after each scored question, with feedback and the explanation. Back is off. */
export const RevealEachQuestion: Story = { name: "Reveal after each question", globals: phone, args: { reveal: "each_question" } };

/** Only the score. Useful when the same questions run again. */
export const ScoreOnly: Story = { name: "Score only (answers never shown)", globals: phone, args: { reveal: "never" } };

/** Tiered: 100% pays 500, 80% pays 300, 60% pays 150. */
export const Tiered: Story = { name: "Tiered reward", args: { rewardRule: "tiered" } };

/** Two answers saved. Resume lands on Q3. */
export const Resume: Story = { globals: phone, args: { start: "in_progress" } };

export const French: Story = { globals: phone, args: { locale: "fr" } };
