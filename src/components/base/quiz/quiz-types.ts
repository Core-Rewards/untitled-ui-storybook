// ── Quiz ──────────────────────────────────────────────────────────────────────

export type QuizOption = {
    /** Unique identifier for this answer option. */
    id: string;
    /** Answer text shown next to the selection control. */
    label: string;
};

export type QuizQuestion = {
    /** Unique identifier for the question. Changing it resets the quiz to its unanswered state. */
    id: string;
    /** The period this question belongs to (e.g. "August 2026"), shown as the card eyebrow. */
    period: string;
    /** The question text. */
    prompt: string;
    /** Answer options, rendered in the order given. */
    options: QuizOption[];
    /** The `id` of the correct option. Answers are graded against this. */
    correctOptionId: string;
    /** Optional context revealed once the user answers, whether they were right or wrong. */
    explanation?: string;
};

export type QuizAnswer = {
    /** The option the user picked. */
    selectedOptionId: string;
    /** Whether that option was the correct one. */
    isCorrect: boolean;
};

// ── Streaks ───────────────────────────────────────────────────────────────────

export type StreakMilestone = {
    /** Consecutive-month count at which this milestone unlocks (e.g. 4). */
    month: number;
    /** Formatted reward shown under the milestone marker (e.g. "500 points"). */
    reward: string;
};

export type StreakData = {
    /**
     * Consecutive months answered so far, from 0 to `cycleLength`. Includes the
     * current month when `answer` has already been recorded for it.
     */
    currentStreak: number;
    /** Months in a full streak cycle before the counter resets. Defaults to 12. */
    cycleLength?: number;
    /** Reward checkpoints along the cycle. Defaults to months 4, 8 and 12. */
    milestones?: StreakMilestone[];
    /**
     * Length of the streak the user just lost by missing a month. When set, the
     * tracker shows a reset notice encouraging them to start a new run.
     */
    lostStreak?: number;
};

/** Months in a streak cycle before the counter resets back to the start. */
export const DEFAULT_CYCLE_LENGTH = 12;

/** Reward checkpoints at 4, 8 and 12 consecutive months. */
export const DEFAULT_MILESTONES: StreakMilestone[] = [
    { month: 4, reward: "500 points" },
    { month: 8, reward: "1,500 points" },
    { month: 12, reward: "5,000 points" },
];
