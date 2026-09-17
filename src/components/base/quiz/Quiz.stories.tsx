import type { Meta, StoryObj } from "@storybook/react-vite";
import { Quiz } from "./quiz";
import type { QuizQuestion, StreakMilestone } from "./quiz-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const augustQuestion: QuizQuestion = {
    id: "2026-08",
    period: "August 2026",
    prompt: "How many consecutive months do you need to answer the quiz before your first points milestone?",
    options: [
        { id: "two", label: "2 months" },
        { id: "four", label: "4 months" },
        { id: "six", label: "6 months" },
        { id: "twelve", label: "12 months" },
    ],
    correctOptionId: "four",
    explanation:
        "Milestones land at 4, 8 and 12 consecutive months. Every month you answer also earns a spin on the points wheel when you get the question right.",
};

const septemberQuestion: QuizQuestion = {
    id: "2026-09",
    period: "September 2026",
    prompt: "Which of these can you redeem your points for?",
    options: [
        { id: "travel", label: "Travel and experiences" },
        { id: "merch", label: "Brand-name merchandise" },
        { id: "gift-cards", label: "Gift cards" },
        { id: "all", label: "All of the above" },
    ],
    correctOptionId: "all",
    explanation: "Your points work across the full catalog — travel, merchandise and gift cards are all fair game.",
};

/** Larger rewards for a programme that wants to weight the back half of the year. */
const weightedMilestones: StreakMilestone[] = [
    { month: 4, reward: "1,000 points" },
    { month: 8, reward: "2,500 points" },
    { month: 12, reward: "10,000 points" },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Quiz",
    component: Quiz,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onSubmitAnswer: { action: "onSubmitAnswer" },
        onSpinWheel: { action: "onSpinWheel" },
        onMilestoneEarned: { action: "onMilestoneEarned" },
    },
} satisfies Meta<typeof Quiz>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * This month's quiz, unanswered, with a 3-month streak in progress. Pick an
 * answer to watch the streak advance — a correct answer also banks a spin.
 */
export const Default: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 3 },
        nextQuestionLabel: "A new question unlocks on September 1.",
    },
};

/** A brand new member with no streak yet. */
export const NoStreak: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 0 },
        nextQuestionLabel: "A new question unlocks on September 1.",
    },
};

/**
 * One month short of the first milestone. Answering takes the streak to 4 and
 * fires the milestone celebration.
 */
export const OneMonthFromMilestone: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 3 },
        spinsAvailable: 2,
    },
};

/**
 * Eleven months in. Answering completes the 12-month cycle, awards the largest
 * milestone, and the streak starts over from next month.
 */
export const CompletingTheCycle: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 11 },
        spinsAvailable: 5,
    },
};

/** The full 12-month run is already banked — the counter resets next month. */
export const CycleComplete: Story = {
    args: {
        question: septemberQuestion,
        streak: { currentStreak: 12 },
        answer: { selectedOptionId: "all", isCorrect: true },
        spinsAvailable: 6,
    },
};

/**
 * A completed cycle carried into a new month, still unanswered. Answering wraps
 * the counter back to 1 rather than pushing past 12, so the reset works whether
 * or not the backend has already zeroed the streak for the new run.
 */
export const NextRunAfterCycleComplete: Story = {
    args: {
        question: septemberQuestion,
        streak: { currentStreak: 12 },
        spinsAvailable: 6,
        nextQuestionLabel: "A new question unlocks on October 1.",
    },
};

/** Answered correctly this month: the spin is banked and the streak has ticked up. */
export const AnsweredCorrectly: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 4 },
        answer: { selectedOptionId: "four", isCorrect: true },
        spinsAvailable: 1,
        nextQuestionLabel: "A new question unlocks on September 1.",
    },
};

/**
 * Answered incorrectly. No spin is earned, but taking part still extends the
 * streak, and the correct answer is revealed.
 */
export const AnsweredIncorrectly: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 4 },
        answer: { selectedOptionId: "twelve", isCorrect: false },
        nextQuestionLabel: "A new question unlocks on September 1.",
    },
};

/**
 * The stricter variant: a correct answer is required to extend the streak, so a
 * wrong answer earns nothing. Flip `streakRequiresCorrectAnswer` to switch rules.
 */
export const CorrectAnswerRequiredForStreak: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 3 },
        answer: { selectedOptionId: "twelve", isCorrect: false },
        streakRequiresCorrectAnswer: true,
    },
};

/** A streak that just broke after a missed month, with an encouraging restart notice. */
export const StreakReset: Story = {
    args: {
        question: septemberQuestion,
        streak: { currentStreak: 0, lostStreak: 7 },
        spinsAvailable: 3,
    },
};

/** Spins carried over from previous months, before this month's quiz is answered. */
export const WithBankedSpins: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 6 },
        spinsAvailable: 4,
    },
};

/** The answer is being recorded — the submit button shows a spinner. */
export const Submitting: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 3 },
        isSubmitting: true,
    },
};

/** The compact streak header, for dashboards where the full rail is too heavy. */
export const CompactStreak: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 6 },
        streakVariant: "compact",
        spinsAvailable: 1,
    },
};

/** A custom reward schedule — milestone months and payouts are both configurable. */
export const CustomMilestoneRewards: Story = {
    args: {
        question: augustQuestion,
        streak: { currentStreak: 7, milestones: weightedMilestones },
        spinsAvailable: 2,
    },
};

/** A shorter six-month cycle with two milestones, showing the cycle length is not fixed. */
export const SixMonthCycle: Story = {
    args: {
        question: augustQuestion,
        streak: {
            currentStreak: 2,
            cycleLength: 6,
            milestones: [
                { month: 3, reward: "500 points" },
                { month: 6, reward: "2,000 points" },
            ],
        },
    },
};
