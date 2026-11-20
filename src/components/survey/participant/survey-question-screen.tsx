import { Check } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useShortcutKeys } from "../questions/question-keys";
import { SurveyQuestion } from "../questions/survey-question";
import { autoAdvances } from "../survey-logic";
import { useSurveyCopy } from "../survey-context";
import type { AnswerValue, SurveyQuestion as SurveyQuestionType } from "../survey-types";
import { SurveyTakeover } from "./survey-takeover";

export interface SurveyQuestionScreenProps {
    surveyTitle: string;
    question: SurveyQuestionType;
    /** Title and description with earlier answers piped in. */
    title?: string;
    description?: string;
    number: number;
    total: number;
    progress: number;
    value: AnswerValue | undefined;
    onChange: (value: AnswerValue | undefined) => void;
    /** Auto-advance taps and Enter in fields. */
    onCommit: (value: AnswerValue | undefined) => void;
    onNext: () => void;
    onBack?: () => void;
    onExit: () => void;
    /** Inline message about the answer, e.g. "Please answer this question to continue." */
    message?: string;
    /** Shown above the Submit button when submitting failed. Doesn't mark the answer invalid. */
    submitError?: string;
    /** The next step submits the survey. */
    isLast?: boolean;
    isSubmitting?: boolean;
    /** Keyboard shortcuts (letters, numbers, Enter, arrows). */
    shortcuts?: boolean;
}

/** One question in the focused takeover, with Next pinned on phones and OK + hints on desktop. */
export const SurveyQuestionScreen = ({
    surveyTitle,
    question,
    title,
    description,
    number,
    total,
    progress,
    value,
    onChange,
    onCommit,
    onNext,
    onBack,
    onExit,
    message,
    submitError,
    isLast,
    isSubmitting,
    shortcuts = true,
}: SurveyQuestionScreenProps) => {
    const { copy } = useSurveyCopy();
    const auto = autoAdvances(question) && !isLast;
    const isStatement = question.type === "statement";
    const isScale = question.type === "nps" || question.type === "opinion_scale" || question.type === "rating";
    const nextLabel = isStatement ? (question.buttonLabel ?? copy.next) : isLast ? copy.submit : copy.next;

    useShortcutKeys(shortcuts && !isSubmitting, (key) => {
        if (key === "Enter") onNext();
        else if (key === "ArrowDown") onNext();
        else if (key === "ArrowUp" && onBack) onBack();
        else return false;
        return true;
    });

    const letterCount = question.type === "multiple_choice" ? question.options.length + (question.allowOther ? 1 : 0) : question.type === "yes_no" ? 2 : 0;
    const desktopHint = isScale ? copy.typeNumber : letterCount > 0 ? copy.typeLetters(String.fromCharCode(64 + letterCount)) : undefined;

    // Desktop says "OK" like the wireframes; phones say "Next". Both say "Submit" on the last step.
    const nextButton = (className?: string, desktop = false) => (
        <Button
            size="xl"
            className={className}
            onClick={onNext}
            isLoading={isSubmitting}
            showTextWhileLoading
            iconTrailing={isLast || isStatement ? undefined : Check}
        >
            {isSubmitting ? copy.submitting : desktop && !isLast && !isStatement ? copy.ok : nextLabel}
        </Button>
    );

    // Phones: auto-advance questions show a hint (plus Skip when optional); the rest pin Next.
    const footer = auto ? (
        <div className="flex flex-col items-center gap-3">
            {!question.required && (
                <Button size="lg" color="tertiary" className="w-full" onClick={onNext}>
                    {copy.next}
                </Button>
            )}
            {isScale && <p className="text-center text-sm text-tertiary">{copy.tapToContinue}</p>}
        </div>
    ) : (
        <div className="flex flex-col gap-3">
            {submitError && <SubmitError>{submitError}</SubmitError>}
            {nextButton("w-full")}
        </div>
    );

    return (
        <SurveyTakeover
            surveyTitle={surveyTitle}
            progress={progress}
            position={{ current: number, total }}
            onBack={onBack}
            onExit={onExit}
            exitKind="save"
            arrows={{ onUp: onBack, onDown: onNext }}
            footer={footer}
        >
            <div className="mx-auto flex w-full max-w-180 flex-col gap-8">
                <SurveyQuestion
                    key={question.id}
                    question={question}
                    title={title}
                    description={description}
                    number={number}
                    value={value}
                    onChange={onChange}
                    onCommit={onCommit}
                    message={message}
                    shortcuts={shortcuts && !isSubmitting}
                    autoFocusTitle
                />

                {/* Desktop: OK + keyboard hint */}
                {submitError && (
                    <div className="hidden @3xl/takeover:block">
                        <SubmitError>{submitError}</SubmitError>
                    </div>
                )}
                <div className="hidden items-center gap-4 @3xl/takeover:flex">
                    {(!auto || !question.required) && nextButton(undefined, true)}
                    <span className="hidden text-sm text-tertiary pointer-fine:inline">
                        {copy.pressEnter}
                        {desktopHint && ` · ${desktopHint}`}
                    </span>
                </div>
            </div>
        </SurveyTakeover>
    );
};

const SubmitError = ({ children }: { children: string }) => (
    <p role="alert" className="rounded-lg bg-error-primary px-3 py-2 text-sm font-medium text-error-primary">
        {children}
    </p>
);
