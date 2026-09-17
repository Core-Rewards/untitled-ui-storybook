import { useState } from "react";
import type { FC } from "react";
import { Check, HelpCircle, X } from "@untitledui/icons";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { QuizAnswer, QuizQuestion } from "./quiz-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizCardProps {
    /** The question to ask. Changing `question.id` clears any in-progress selection. */
    question: QuizQuestion;
    /** The recorded answer. When set, the card is read-only and reveals the correct option. */
    answer?: QuizAnswer | null;
    /** Called with the graded answer when the user submits their selection. */
    onSubmit?: (answer: QuizAnswer) => void;
    /** Shows a spinner on the submit button while the answer is being recorded. */
    isSubmitting?: boolean;
    /**
     * Whether the streak requires a *correct* answer rather than just an answer.
     * Only affects the wrong-answer copy. Defaults to `false`, matching the rule
     * that taking part is what extends the streak.
     */
    streakRequiresCorrectAnswer?: boolean;
    /** When the next question arrives (e.g. "New question on September 1"). */
    nextQuestionLabel?: string;
    /** Eyebrow text above the question. Defaults to "Monthly Quiz". */
    eyebrow?: string;
    className?: string;
}

/** How a single option should be painted, given the current answer state. */
type OptionState = "idle" | "selected" | "correct" | "incorrect" | "dimmed";

// ── Styles ────────────────────────────────────────────────────────────────────

const optionStyles: Record<OptionState, string> = {
    idle: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
    selected: "border-brand-solid bg-brand-50",
    correct: "border-success-600 bg-success-50",
    incorrect: "border-error-600 bg-error-50",
    dimmed: "border-gray-200 bg-white opacity-60",
};

const indicatorStyles: Record<OptionState, string> = {
    idle: "border-gray-300 bg-white",
    selected: "border-brand-solid bg-brand-solid",
    correct: "border-success-600 bg-success-600",
    incorrect: "border-error-600 bg-error-600",
    dimmed: "border-gray-300 bg-white",
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const tagTones = {
    neutral: "bg-gray-100 text-secondary",
    success: "bg-success-100 text-success-700",
    error: "bg-error-100 text-error-700",
} as const;

/**
 * Small pill used for the "Answered", "Correct answer" and "Your answer" markers.
 * These carry the verdict in text so it is not conveyed by colour alone.
 */
const Tag: FC<{ tone: keyof typeof tagTones; children: string }> = ({ tone, children }) => (
    <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", tagTones[tone])}>{children}</span>
);

// ── Main component ────────────────────────────────────────────────────────────

export const QuizCard: FC<QuizCardProps> = ({
    question,
    answer,
    onSubmit,
    isSubmitting = false,
    streakRequiresCorrectAnswer = false,
    nextQuestionLabel,
    eyebrow = "Monthly Quiz",
    className,
}) => {
    const [selectedOptionId, setSelectedOptionId] = useState("");

    // A new question means a new month — drop any selection carried over from the
    // last one. Adjusting state during render is React's recommended alternative
    // to a reset effect: it re-renders before committing, with no extra paint.
    const [renderedQuestionId, setRenderedQuestionId] = useState(question.id);
    if (renderedQuestionId !== question.id) {
        setRenderedQuestionId(question.id);
        setSelectedOptionId("");
    }

    const isAnswered = Boolean(answer);

    const handleSubmit = () => {
        if (!selectedOptionId || isAnswered) return;
        onSubmit?.({
            selectedOptionId,
            isCorrect: selectedOptionId === question.correctOptionId,
        });
    };

    const getOptionState = (optionId: string): OptionState => {
        if (!answer) return optionId === selectedOptionId ? "selected" : "idle";
        if (optionId === question.correctOptionId) return "correct";
        if (optionId === answer.selectedOptionId) return "incorrect";
        return "dimmed";
    };

    return (
        <div className={cx("overflow-hidden rounded-2xl border border-gray-200 bg-white", className)}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <HelpCircle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">{eyebrow}</p>
                        <p className="text-sm text-tertiary">{question.period}</p>
                    </div>
                </div>

                {isAnswered && <Tag tone="neutral">Answered</Tag>}
            </div>

            <div className="px-5 py-5">

                {/* ── Question + options ───────────────────────────────────── */}
                <RadioGroup
                    value={answer ? answer.selectedOptionId : selectedOptionId}
                    onChange={setSelectedOptionId}
                    isDisabled={isAnswered || isSubmitting}
                    aria-label="Quiz answer"
                >
                    <Label className="block text-lg font-semibold leading-snug text-primary">{question.prompt}</Label>

                    <div className="mt-5 flex flex-col gap-2.5">
                        {question.options.map((option) => {
                            const state = getOptionState(option.id);

                            return (
                                <Radio
                                    key={option.id}
                                    value={option.id}
                                    className={({ isFocusVisible }) =>
                                        cx(
                                            "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left outline-none transition-colors duration-100",
                                            isAnswered ? "cursor-default" : "cursor-pointer",
                                            isFocusVisible && "ring-2 ring-brand-solid ring-offset-1",
                                            optionStyles[state],
                                        )
                                    }
                                >
                                    {/* Selection indicator — becomes a verdict icon once answered */}
                                    <span
                                        aria-hidden="true"
                                        className={cx(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                                            indicatorStyles[state],
                                        )}
                                    >
                                        {state === "correct" && <Check className="h-3 w-3 text-white" />}
                                        {state === "incorrect" && <X className="h-3 w-3 text-white" />}
                                        {state === "selected" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </span>

                                    <span
                                        className={cx(
                                            "flex-1 text-sm font-medium",
                                            state === "correct"
                                                ? "text-success-700"
                                                : state === "incorrect"
                                                    ? "text-error-700"
                                                    : "text-secondary",
                                        )}
                                    >
                                        {option.label}
                                    </span>

                                    {state === "correct" && <Tag tone="success">Correct answer</Tag>}
                                    {state === "incorrect" && <Tag tone="error">Your answer</Tag>}
                                </Radio>
                            );
                        })}
                    </div>
                </RadioGroup>

                {/* ── Submit ───────────────────────────────────────────────── */}
                {!isAnswered && (
                    <div className="mt-6">
                        <Button
                            color="primary"
                            size="lg"
                            className="w-full"
                            isDisabled={!selectedOptionId}
                            isLoading={isSubmitting}
                            onClick={handleSubmit}
                        >
                            Submit Answer
                        </Button>
                    </div>
                )}

                {/* ── Feedback ─────────────────────────────────────────────── */}
                {answer && (
                    <div
                        className={cx(
                            "mt-6 rounded-xl border p-4 motion-safe:animate-[quiz-rise-in_0.35s_ease-out]",
                            answer.isCorrect ? "border-success-100 bg-success-50" : "border-warning-100 bg-warning-50",
                        )}
                        role="status"
                    >
                        <div className="flex gap-3">
                            <div
                                className={cx(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                    answer.isCorrect ? "bg-success-600" : "bg-warning-600",
                                )}
                            >
                                {answer.isCorrect ? (
                                    <Check className="h-3.5 w-3.5 text-white" />
                                ) : (
                                    <X className="h-3.5 w-3.5 text-white" />
                                )}
                            </div>

                            <div className="flex-1">
                                <p
                                    className={cx(
                                        "text-sm font-semibold",
                                        answer.isCorrect ? "text-success-700" : "text-warning-700",
                                    )}
                                >
                                    {answer.isCorrect ? "That's correct!" : "Not quite this time."}
                                </p>

                                {question.explanation && (
                                    <p className="mt-1.5 text-sm leading-relaxed text-secondary">{question.explanation}</p>
                                )}

                                {!answer.isCorrect && (
                                    <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                                        {streakRequiresCorrectAnswer
                                            ? "A correct answer is needed to extend your streak, so this month won't count. Try again next month."
                                            : "No spin this month, but taking part still counts — your streak keeps going."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            {nextQuestionLabel && (
                <div className="border-t border-gray-100 px-5 py-3.5">
                    <p className="text-xs text-tertiary">{nextQuestionLabel}</p>
                </div>
            )}
        </div>
    );
};
