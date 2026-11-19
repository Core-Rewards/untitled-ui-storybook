import { useId, useState } from "react";
import type { FC } from "react";
import { Check, ChevronDown, HelpCircle, LinkExternal01, PlayCircle, X } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { QuizAnswer, QuizQuestion, QuizVideo } from "./quiz-types";

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
    /** Eyebrow text above the question. Defaults to "Monthly Quiz". */
    eyebrow?: string;
    /**
     * Artwork for the question, placed like a video: beside the question once
     * the card is wide enough, above it on a narrow card. Cropped to a 16:9 frame.
     * Ignored when the question has a video.
     */
    image?: { src: string; alt: string };
    /**
     * How the card looks once answered. `"full"` keeps the whole question on show.
     * `"compact"` folds it down to a one-row summary with a "Review answer" toggle,
     * for pages where an answered quiz shouldn't take up the space of a new one.
     * The card only starts folded when it mounts with an answer already recorded
     * (a return visit); answering it in place keeps it open so the verdict is seen.
     * Defaults to `"full"`.
     */
    answeredLayout?: "full" | "compact";
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
    warning: "bg-warning-100 text-warning-700",
    error: "bg-error-100 text-error-700",
} as const;

/**
 * Small pill used for the "Answered", "Correct answer" and "Your answer" markers.
 * These carry the verdict in text so it is not conveyed by colour alone.
 */
const Tag: FC<{ tone: keyof typeof tagTones; children: string }> = ({ tone, children }) => (
    <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", tagTones[tone])}>{children}</span>
);

/**
 * Embedded video the question is based on. Landscape plays at 16:9; portrait
 * shorts are held to a phone-sized 9:16 column. On a narrow card the video sits
 * above the question; once the card is wide enough it moves alongside it.
 */
const QuizVideoEmbed: FC<{ video: QuizVideo; showPrompt: boolean }> = ({ video, showPrompt }) => {
    const isPortrait = video.orientation === "portrait";

    return (
        <div
            className={cx(
                "w-full shrink-0",
                isPortrait ? "mx-auto max-w-[315px] @3xl:mx-0 @3xl:w-[315px]" : "@3xl:w-1/2",
            )}
        >
            <div
                className={cx(
                    "overflow-hidden rounded-xl border border-gray-200 bg-gray-950",
                    isPortrait ? "aspect-[9/16]" : "aspect-video",
                )}
            >
                <iframe
                    src={video.src}
                    title={video.title}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </div>
            {showPrompt && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-tertiary">
                    <PlayCircle className="h-3.5 w-3.5 shrink-0" />
                    Watch the video, then answer the question.
                </p>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

export const QuizCard: FC<QuizCardProps> = ({
    question,
    answer,
    onSubmit,
    isSubmitting = false,
    streakRequiresCorrectAnswer = false,
    eyebrow = "Monthly Quiz",
    image,
    answeredLayout = "full",
    className,
}) => {
    const [selectedOptionId, setSelectedOptionId] = useState("");
    const promptId = useId();
    const bodyId = useId();

    const isAnswered = Boolean(answer);

    // Compact cards start folded when they arrive already answered, and open up
    // when the user answers in place so the verdict isn't hidden from them.
    const [isExpanded, setIsExpanded] = useState(!isAnswered);
    const [wasAnswered, setWasAnswered] = useState(isAnswered);
    if (wasAnswered !== isAnswered) {
        setWasAnswered(isAnswered);
        setIsExpanded(true);
    }

    // A new question means a new month — drop any selection carried over from the
    // last one. Adjusting state during render is React's recommended alternative
    // to a reset effect: it re-renders before committing, with no extra paint.
    const [renderedQuestionId, setRenderedQuestionId] = useState(question.id);
    if (renderedQuestionId !== question.id) {
        setRenderedQuestionId(question.id);
        setSelectedOptionId("");
        setIsExpanded(!isAnswered);
        setWasAnswered(isAnswered);
    }

    const isCollapsible = answeredLayout === "compact" && isAnswered;
    const isCollapsed = isCollapsible && !isExpanded;

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
            <div
                className={cx(
                    "flex justify-between gap-4 px-5 py-4",
                    // On a narrow card the toggle drops below the summary rather than squeezing it.
                    isCollapsible ? "flex-wrap items-center gap-y-3" : "items-start",
                    !isCollapsed && "border-b border-gray-100",
                )}
            >
                <div className={cx("flex min-w-0 items-center gap-2.5", isCollapsible && "flex-1 basis-60")}>
                    {/* Compact cards swap the quiz icon for the verdict, so the folded row still says how it went. */}
                    {isCollapsible && answer ? (
                        <div
                            className={cx(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                                answer.isCorrect ? "bg-success-600" : "bg-warning-600",
                            )}
                        >
                            {answer.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            <HelpCircle className="h-4.5 w-4.5" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">{eyebrow}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tertiary">
                            {question.period}
                            {isCollapsible && answer && (
                                <Tag tone={answer.isCorrect ? "success" : "warning"}>
                                    {answer.isCorrect ? "Answered · Correct" : "Answered · Not quite"}
                                </Tag>
                            )}
                        </div>
                    </div>
                </div>

                {isCollapsible ? (
                    <Button
                        color="secondary"
                        size="sm"
                        className="shrink-0"
                        aria-expanded={isExpanded}
                        aria-controls={isExpanded ? bodyId : undefined}
                        onClick={() => setIsExpanded((open) => !open)}
                        iconTrailing={
                            <ChevronDown
                                data-icon
                                aria-hidden="true"
                                className={cx("transition-transform duration-200", isExpanded && "rotate-180")}
                            />
                        }
                    >
                        {isExpanded ? "Hide answer" : "Review answer"}
                    </Button>
                ) : (
                    isAnswered && <Tag tone="neutral">Answered</Tag>
                )}
            </div>

            {/* Unmounted while folded so a question's video doesn't load until it's asked for. */}
            {!isCollapsed && (
                <div id={bodyId}>
                <div className="@container px-5 py-5">
                    <div
                        className={cx(
                            (question.video || image) && "flex flex-col gap-5 @3xl:flex-row @3xl:items-start @3xl:gap-8",
                        )}
                    >

                        {/* ── Video ────────────────────────────────────────────────── */}
                        {question.video && <QuizVideoEmbed video={question.video} showPrompt={!isAnswered} />}

                        {/* ── Image ────────────────────────────────────────────────── */}
                        {/* Same 16:9 frame as the landscape video player: half the card when wide, above the question when narrow. */}
                        {image && !question.video && (
                            <div className="w-full shrink-0 @3xl:w-1/2">
                                <div className="aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-950">
                                    <img src={image.src} alt={image.alt} className="size-full object-cover" />
                                </div>
                            </div>
                        )}

                        <div className="min-w-0 flex-1">

                            {/* ── Question ─────────────────────────────────────────────── */}
                            <h3 id={promptId} className="text-lg font-semibold leading-snug text-primary">
                                {question.prompt}
                            </h3>

                            {/* ── Resource ─────────────────────────────────────────────── */}
                            {/* Kept outside the radio group so the link isn't read as part of the answer set. */}
                            <Button
                                href={question.resource.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                color="link-color"
                                size="sm"
                                iconTrailing={LinkExternal01}
                                className="mt-2"
                            >
                                {question.resource.label}
                            </Button>

                            {/* ── Options ──────────────────────────────────────────────── */}
                            <RadioGroup
                                value={answer ? answer.selectedOptionId : selectedOptionId}
                                onChange={setSelectedOptionId}
                                isDisabled={isAnswered || isSubmitting}
                                aria-labelledby={promptId}
                            >
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
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};
