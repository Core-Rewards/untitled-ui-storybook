import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { STORY_NOW } from "../stories/survey-story-helpers";
import { quizRewardFor, scoreQuiz } from "../quiz-logic";
import { getFungicideQuiz, QUIZ_ANSWERS } from "../quiz-sample-data";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import type { Survey, SurveyAnswers, SurveyLocale } from "../survey-types";
import { QuizResults } from "./quiz-results";
import { SurveyIntro } from "./survey-intro";
import { SurveyPlayer } from "./survey-player";
import { SurveyQuestionScreen } from "./survey-question-screen";

/*
 * Each quiz screen on its own, for review. Quiz flow has them wired together.
 */

const phone = { viewport: { value: "phone", isRotated: false } };

type ScreenProps = {
    screen: "intro" | "checked" | "results" | "already_taken";
    locale: SurveyLocale;
    answers: keyof typeof QUIZ_ANSWERS;
    reveal: "each_question" | "at_end" | "never";
    rewardRule: "completion" | "pass" | "tiered";
    /** For "checked": which question. k4 is the multi-select. */
    questionId: "k1" | "k3" | "k4" | "k5";
};

const quizFor = ({ locale, reveal, rewardRule }: ScreenProps): Survey =>
    getFungicideQuiz(
        locale,
        rewardRule === "tiered" ? { reward: { type: "points", amount: 500 } } : {},
        rewardRule === "tiered"
            ? {
                  reveal,
                  rewardRule,
                  passMark: 60,
                  tiers: [
                      { minScore: 100, amount: 500 },
                      { minScore: 80, amount: 300 },
                      { minScore: 60, amount: 150 },
                  ],
              }
            : { reveal, rewardRule },
    );

const Screen = (props: ScreenProps) => {
    const quiz = quizFor(props);
    const answers: SurveyAnswers = QUIZ_ANSWERS[props.answers];
    const score = scoreQuiz(quiz, answers);
    const content = (() => {
        switch (props.screen) {
            case "intro":
                return <SurveyIntro survey={quiz} onStart={fn()} onClose={fn()} />;
            case "checked": {
                const q = quiz.questions.find((x) => x.id === props.questionId)!;
                const index = quiz.questions.indexOf(q);
                return (
                    <SurveyQuestionScreen
                        surveyTitle={quiz.title}
                        question={q}
                        number={index + 1}
                        total={6}
                        progress={index / 6}
                        value={answers[q.id]}
                        onChange={fn()}
                        onCommit={fn()}
                        onNext={fn()}
                        onExit={fn()}
                        checkFirst
                        revealed
                    />
                );
            }
            case "results":
                return <QuizResults survey={quiz} answers={answers} score={score} reward={quizRewardFor(quiz, score)} onAction={fn()} />;
            case "already_taken":
                return (
                    <SurveyPlayer
                        survey={quiz}
                        now={STORY_NOW}
                        response={{
                            surveyId: quiz.id,
                            status: "complete",
                            locale: props.locale,
                            answers,
                            history: [],
                            submittedAt: "2026-11-18T10:20:00-05:00",
                            score,
                            rewardEarned: quizRewardFor(quiz, score),
                        }}
                        onSubmit={async () => ({})}
                    />
                );
        }
    })();
    return <SurveyLocaleProvider locale={props.locale}>{content}</SurveyLocaleProvider>;
};

const meta = {
    title: "Survey/Participant/Quiz screens",
    component: Screen,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "The quiz-only screens. Answers come from the sample sets: **perfect** (5 of 5), **pass** (4 of 5, the multi-select has an extra pick) and **fail** (3 of 5).",
                    "",
                    "Right and wrong are shown with icons and words (Your answer, Correct answer), not colour alone. The feedback panel is announced when an answer is checked.",
                ].join("\n"),
            },
        },
    },
    argTypes: {
        screen: { control: "inline-radio", options: ["intro", "checked", "results", "already_taken"] },
        locale: { control: "inline-radio", options: ["en", "fr"] },
        answers: { control: "inline-radio", options: ["perfect", "pass", "fail"] },
        reveal: { control: "inline-radio", options: ["each_question", "at_end", "never"] },
        rewardRule: { control: "inline-radio", options: ["completion", "pass", "tiered"] },
        questionId: { control: "inline-radio", options: ["k1", "k3", "k4", "k5"] },
    },
    args: { screen: "results", locale: "en", answers: "pass", reveal: "at_end", rewardRule: "pass", questionId: "k4" },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reward wording follows the rule, plus pass mark and "One try". */
export const Intro: Story = { globals: phone, args: { screen: "intro" } };

/** 4 of 5: passed, 250 points, and the review with the one miss. */
export const ResultsPassed: Story = { name: "Results · passed", args: { screen: "results", answers: "pass" } };

/** 3 of 5 on a pass-only reward: no reward, and what it would have taken. Shown neutral, not as an error. */
export const ResultsNotPassed: Story = { name: "Results · not passed", globals: phone, args: { screen: "results", answers: "fail" } };

/** Tiered: 80% reaches the 300-point tier. */
export const ResultsTiered: Story = { name: "Results · tiered", args: { screen: "results", answers: "pass", rewardRule: "tiered" } };

/** Answers are kept private: score only. */
export const ResultsScoreOnly: Story = { name: "Results · score only", globals: phone, args: { screen: "results", reveal: "never" } };

export const ResultsFrench: Story = { name: "Results · French", globals: phone, args: { screen: "results", locale: "fr" } };

/** Reveal after each question: a multi-select answered with one pick too many. */
export const CheckedWrong: Story = { name: "Checked answer · wrong", globals: phone, args: { screen: "checked", questionId: "k4", answers: "pass" } };

/** Reveal after each question: right first time. */
export const CheckedRight: Story = { name: "Checked answer · right", args: { screen: "checked", questionId: "k1", answers: "pass" } };

/** Quizzes can't be retaken: opening a finished one shows the score instead. */
export const AlreadyTaken: Story = { name: "Already taken", globals: phone, args: { screen: "already_taken", answers: "fail" } };
