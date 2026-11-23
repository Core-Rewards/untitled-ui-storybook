import { Check, CheckCircle, XCircle, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { correctLabels, isCorrect, pickedIds } from "../quiz-logic";
import type { SurveyCopy } from "../survey-copy";
import { useSurveyCopy } from "../survey-context";
import { isChoiceAnswer, OTHER_OPTION_ID } from "../survey-logic";
import type { AnswerValue, SurveyQuestion } from "../survey-types";
import { letterFor } from "./question-keys";

/*
 * A scored question once its answer is revealed: every option with the
 * participant's pick and the right answer marked, then a short feedback panel.
 * Right and wrong are shown with icons and words as well as colour.
 */

type RowState = "picked_correct" | "picked_wrong" | "missed_correct" | "plain";

/** Long dropdowns only show the participant's pick and the right answer. */
const MAX_DROPDOWN_ROWS = 8;

const reviewOptions = (question: SurveyQuestion, value: AnswerValue | undefined, copy: SurveyCopy) => {
    const correct = question.correct ?? [];
    const picked = pickedIds(question, value);
    if (question.type === "yes_no")
        return [
            { id: "yes", label: question.yesLabel ?? copy.yes },
            { id: "no", label: question.noLabel ?? copy.no },
        ];
    if (question.type === "multiple_choice") {
        const other = isChoiceAnswer(value) && value.selected.includes(OTHER_OPTION_ID) ? [{ id: OTHER_OPTION_ID, label: value.other?.trim() || copy.otherLabel }] : [];
        return [...question.options, ...other];
    }
    if (question.type === "dropdown")
        return question.options.length <= MAX_DROPDOWN_ROWS ? question.options : question.options.filter((o) => picked.includes(o.id) || correct.includes(o.id));
    return [];
};

const stateOf = (id: string, picked: string[], correct: string[]): RowState => {
    const isPicked = picked.includes(id);
    const isRight = correct.includes(id);
    if (isPicked) return isRight ? "picked_correct" : "picked_wrong";
    return isRight ? "missed_correct" : "plain";
};

export interface GradedAnswerProps {
    question: SurveyQuestion;
    value: AnswerValue | undefined;
    /** id of the question title, for aria-labelledby. */
    labelId?: string;
    /** Smaller rows, for the results review list. */
    compact?: boolean;
}

/** The options of a scored question, marked right and wrong. Read-only. */
export const GradedAnswer = ({ question, value, labelId, compact }: GradedAnswerProps) => {
    const { copy } = useSurveyCopy();
    const correct = question.correct ?? [];
    const picked = isChoiceAnswer(value) ? value.selected : pickedIds(question, value);
    const options = reviewOptions(question, value, copy);
    const showLetters = question.type !== "dropdown";

    return (
        <ul aria-labelledby={labelId} className={cx("flex flex-col @xl/survey:max-w-120", compact ? "gap-1.5" : "gap-2")}>
            {options.map((option, i) => {
                const state = stateOf(option.id, picked, correct);
                const tag =
                    state === "picked_correct" || state === "picked_wrong" ? copy.yourAnswer : state === "missed_correct" ? copy.correctAnswer : undefined;
                const spoken =
                    state === "picked_correct"
                        ? `${copy.yourAnswer}, ${copy.correct.toLowerCase()}`
                        : state === "picked_wrong"
                          ? `${copy.yourAnswer}, ${copy.notQuite.toLowerCase()}`
                          : state === "missed_correct"
                            ? copy.correctAnswer
                            : undefined;
                const Icon = state === "picked_wrong" ? XClose : state === "plain" ? null : Check;
                return (
                    <li
                        key={option.id}
                        className={cx(
                            "flex items-center gap-3 rounded-xl px-4 ring-inset",
                            compact ? "min-h-10 py-2" : "min-h-12 py-3",
                            state === "picked_correct" && "bg-success-primary ring-2 ring-fg-success-secondary",
                            state === "missed_correct" && "bg-success-primary ring-1 ring-fg-success-secondary",
                            state === "picked_wrong" && "bg-error-primary ring-2 ring-error",
                            state === "plain" && "bg-primary ring-1 ring-secondary",
                        )}
                    >
                        {showLetters && (
                            <span
                                aria-hidden="true"
                                className={cx(
                                    "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-inset",
                                    state === "picked_correct" && "bg-success-solid text-white ring-transparent",
                                    state === "picked_wrong" && "bg-error-solid text-white ring-transparent",
                                    state === "missed_correct" && "bg-primary text-success-primary ring-fg-success-secondary",
                                    state === "plain" && "bg-primary text-quaternary ring-secondary",
                                )}
                            >
                                {letterFor(i)}
                            </span>
                        )}
                        <span className={cx("min-w-0 flex-1 font-medium", compact ? "text-sm" : "text-md", state === "plain" ? "text-tertiary" : "text-primary")}>
                            {option.label}
                            {spoken && <span className="sr-only">, {spoken}</span>}
                        </span>
                        {tag && (
                            <span
                                aria-hidden="true"
                                className={cx(
                                    "flex shrink-0 items-center gap-1 text-xs font-semibold",
                                    state === "picked_wrong" ? "text-error-primary" : "text-success-primary",
                                )}
                            >
                                {Icon && <Icon className="size-4" />}
                                <span className="hidden @xs/survey:inline">{tag}</span>
                            </span>
                        )}
                    </li>
                );
            })}
            {picked.length === 0 && (
                <li className="px-1 text-sm text-tertiary italic">
                    {copy.yourAnswer}: {copy.notAnswered}
                </li>
            )}
        </ul>
    );
};

/** "Correct" or "Not quite", the right answer when it was missed, and the explanation. Announced when it appears. */
export const AnswerFeedback = ({
    question,
    value,
    announce = true,
    className,
}: {
    question: SurveyQuestion;
    value: AnswerValue | undefined;
    /** Announce it when it appears. Off for review lists, where every panel is already there. */
    announce?: boolean;
    className?: string;
}) => {
    const { copy } = useSurveyCopy();
    const right = isCorrect(question, value) ?? false;
    const Icon = right ? CheckCircle : XCircle;
    return (
        <div
            role={announce ? "status" : undefined}
            className={cx(
                "flex gap-3 rounded-xl p-4 @xl/survey:max-w-120",
                right ? "bg-success-primary" : "bg-secondary",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
                className,
            )}
        >
            <Icon aria-hidden="true" className={cx("mt-0.5 size-5 shrink-0", right ? "text-fg-success-primary" : "text-fg-error-primary")} />
            <div className="flex flex-col gap-1">
                <p className={cx("text-md font-semibold", right ? "text-success-primary" : "text-primary")}>{right ? copy.correct : copy.notQuite}</p>
                {!right && <p className="text-sm text-secondary">{copy.correctAnswerIs(correctLabels(question, copy.yes, copy.no))}</p>}
                {question.explanation && <p className="text-sm text-tertiary">{question.explanation}</p>}
            </div>
        </div>
    );
};
