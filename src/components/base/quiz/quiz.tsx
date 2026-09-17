import { useState } from "react";
import type { FC } from "react";
import { Trophy01, Zap } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { QuizCard } from "./quiz-card";
import {
    DEFAULT_CYCLE_LENGTH,
    DEFAULT_MILESTONES,
    type QuizAnswer,
    type QuizQuestion,
    type StreakData,
    type StreakMilestone,
} from "./quiz-types";
import { StreakTracker } from "./streak-tracker";
import { advanceStreak, formatMonths, getMilestoneAt } from "./streak-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizProps {
    /** This period's question. Changing `question.id` resets the quiz for a new month. */
    question: QuizQuestion;
    /** The user's streak going into this month's quiz. */
    streak: StreakData;
    /**
     * An answer already recorded for this period. When set, the quiz renders
     * read-only and `streak.currentStreak` is expected to already include it.
     */
    answer?: QuizAnswer | null;
    /** Spins the user has banked from previous months. Defaults to 0. */
    spinsAvailable?: number;
    /** Called with the graded answer when the user submits. */
    onSubmitAnswer?: (answer: QuizAnswer) => void;
    /** Called when the user clicks through to the points wheel. */
    onSpinWheel?: () => void;
    /** Called when an answer takes the streak onto a milestone month. */
    onMilestoneEarned?: (milestone: StreakMilestone) => void;
    /** Shows a spinner on the submit button while the answer is being recorded. */
    isSubmitting?: boolean;
    /**
     * Require a correct answer to extend the streak. Defaults to `false`, so
     * simply taking part each month keeps the streak alive and only correct
     * answers earn a spin.
     */
    streakRequiresCorrectAnswer?: boolean;
    /** When the next question arrives (e.g. "New question on September 1"). */
    nextQuestionLabel?: string;
    /** Density of the embedded streak tracker. */
    streakVariant?: "full" | "compact";
    className?: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export const Quiz: FC<QuizProps> = ({
    question,
    streak,
    answer,
    spinsAvailable = 0,
    onSubmitAnswer,
    onSpinWheel,
    onMilestoneEarned,
    isSubmitting = false,
    streakRequiresCorrectAnswer = false,
    nextQuestionLabel,
    streakVariant = "full",
    className,
}) => {
    const cycleLength = streak.cycleLength ?? DEFAULT_CYCLE_LENGTH;
    const milestones = streak.milestones ?? DEFAULT_MILESTONES;

    const [submittedAnswer, setSubmittedAnswer] = useState<QuizAnswer | null>(null);
    const [streakAfterAnswer, setStreakAfterAnswer] = useState<number | null>(null);
    const [earnedMilestone, setEarnedMilestone] = useState<StreakMilestone | null>(null);
    const [spinsEarnedNow, setSpinsEarnedNow] = useState(0);

    // A new question means a new month — clear everything earned against the last
    // one. Adjusting state during render is React's recommended alternative to a
    // reset effect: it re-renders before committing, with no extra paint.
    const [renderedQuestionId, setRenderedQuestionId] = useState(question.id);
    if (renderedQuestionId !== question.id) {
        setRenderedQuestionId(question.id);
        setSubmittedAnswer(null);
        setStreakAfterAnswer(null);
        setEarnedMilestone(null);
        setSpinsEarnedNow(0);
    }

    const activeAnswer = submittedAnswer ?? answer ?? null;
    const displayStreak = streakAfterAnswer ?? streak.currentStreak;
    const totalSpins = spinsAvailable + spinsEarnedNow;

    // The reset notice only applies until the user starts a new run this month.
    const lostStreak = streakAfterAnswer === null ? streak.lostStreak : undefined;

    const handleSubmit = (graded: QuizAnswer) => {
        setSubmittedAnswer(graded);

        if (graded.isCorrect || !streakRequiresCorrectAnswer) {
            const nextStreak = advanceStreak(streak.currentStreak, cycleLength);
            setStreakAfterAnswer(nextStreak);

            const milestone = getMilestoneAt(milestones, nextStreak);
            if (milestone) {
                setEarnedMilestone(milestone);
                onMilestoneEarned?.(milestone);
            }
        }

        if (graded.isCorrect) {
            setSpinsEarnedNow(1);
        }

        onSubmitAnswer?.(graded);
    };

    const justEarnedSpin = spinsEarnedNow > 0;
    const spinLabel = totalSpins === 1 ? "1 spin" : `${totalSpins} spins`;

    return (
        <div className={cx("mx-auto flex max-w-2xl flex-col gap-5", className)}>

            {/* ── Streak progress ──────────────────────────────────────────── */}
            <StreakTracker
                currentStreak={displayStreak}
                cycleLength={cycleLength}
                milestones={milestones}
                lostStreak={lostStreak}
                variant={streakVariant}
                celebrateMilestone={earnedMilestone?.month}
            />

            {/* ── Milestone reward ─────────────────────────────────────────── */}
            {earnedMilestone && (
                <div
                    className="flex items-center gap-3.5 rounded-xl border border-brand-100 bg-brand-50 p-4 motion-safe:animate-[quiz-rise-in_0.4s_ease-out]"
                    role="status"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white">
                        <Trophy01 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-brand-700">
                            {formatMonths(earnedMilestone.month)} in a row — you earned {earnedMilestone.reward}!
                        </p>
                        <p className="mt-0.5 text-sm text-secondary">
                            {earnedMilestone.month >= cycleLength
                                ? "That completes the full run. Your streak starts fresh next month."
                                : "The points are on their way to your balance. Keep going for the next milestone."}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Question ─────────────────────────────────────────────────── */}
            <QuizCard
                question={question}
                answer={activeAnswer}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                streakRequiresCorrectAnswer={streakRequiresCorrectAnswer}
                nextQuestionLabel={nextQuestionLabel}
            />

            {/* ── Spin reward ──────────────────────────────────────────────── */}
            {totalSpins > 0 && (
                <div
                    className={cx(
                        "flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 p-4",
                        justEarnedSpin && "motion-safe:animate-[quiz-rise-in_0.45s_ease-out]",
                    )}
                    role="status"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <Zap className="h-5 w-5" />
                    </div>

                    <div className="min-w-40 flex-1">
                        <p className="text-sm font-semibold text-primary">
                            {justEarnedSpin ? "You earned a spin on the points wheel" : `${spinLabel} waiting for you`}
                        </p>
                        <p className="mt-0.5 text-sm text-tertiary">
                            {justEarnedSpin && totalSpins > 1
                                ? `That's ${spinLabel} banked — spin for a chance at bonus points.`
                                : "Spin the wheel for a chance at bonus points."}
                        </p>
                    </div>

                    <Button color="primary" size="md" onClick={onSpinWheel} className="shrink-0">
                        Spin the Wheel
                    </Button>
                </div>
            )}
        </div>
    );
};
