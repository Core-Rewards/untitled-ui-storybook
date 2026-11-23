import { useEffect, useId, useRef } from "react";
import { ArrowRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { AnswerValue, QuestionOption, SurveyQuestion as SurveyQuestionType } from "../survey-types";
import { EditableText, OptionsEditor } from "./question-editor";
import { DropdownInput, MultipleChoiceInput, YesNoInput } from "./choice-questions";
import { FileUploadInput } from "./file-upload-question";
import { MatrixInput } from "./matrix-question";
import { QuestionMessage } from "./question-parts";
import { RankingInput } from "./ranking-question";
import { NpsInput, OpinionScaleInput, RatingInput } from "./scale-questions";
import { DateAnswerInput, NumberAnswerInput, TextAnswerInput } from "./text-questions";

export interface SurveyQuestionProps {
    question: SurveyQuestionType;
    /** 1-based position among answerable questions. Hidden for statements. */
    number?: number;
    value: AnswerValue | undefined;
    onChange: (value: AnswerValue | undefined) => void;
    /** The participant is done with this question (auto-advance tap, Enter in a field). */
    onCommit?: (value: AnswerValue | undefined) => void;
    /** Inline message under the answers, e.g. "Please answer this question to continue." */
    message?: string;
    /** Letter and number shortcuts. Turn on for the active question only. */
    shortcuts?: boolean;
    /** Move focus to the title when shown, so screen readers announce the new question. */
    autoFocusTitle?: boolean;
    /** Title and description with answers piped in. Defaults to the question's own. */
    title?: string;
    description?: string;
    /**
     * Builder mode: the question renders as participants see it, but its title,
     * description and answer options are edited in place. Answering is disabled.
     */
    editor?: QuestionEditor;
    className?: string;
}

export interface QuestionEditor {
    onChange: (question: SurveyQuestionType) => void;
    /** Put the cursor in the title (a just-added question). */
    autoFocus?: boolean;
}

/**
 * One question as participants see it: number, title, helper text, the answer
 * control for its type and an inline message. The same component renders in the
 * builder canvas. Its layout follows the width it's given (container queries), so a
 * phone-sized frame gets the phone layout on any screen.
 */
export const SurveyQuestion = ({
    question,
    number,
    value,
    onChange,
    onCommit,
    message,
    shortcuts = false,
    autoFocusTitle = false,
    title,
    description,
    editor,
    className,
}: SurveyQuestionProps) => {
    const { copy } = useSurveyCopy();
    const labelId = useId();
    const messageId = useId();
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (autoFocusTitle) titleRef.current?.focus({ preventScroll: true });
    }, [autoFocusTitle, question.id]);

    const shared = {
        labelId,
        messageId,
        shortcuts,
        isInvalid: !!message,
        onCommit,
    };
    const isStatement = question.type === "statement";

    return (
        <div className={cx("@container/survey flex w-full flex-col gap-6 @xl/survey:gap-8", className)}>
            <div className="flex flex-col gap-2 @xl/survey:gap-3">
                {number !== undefined && !isStatement && (
                    <p className="flex items-center gap-1 text-sm font-semibold text-brand-secondary">
                        <span className="@xl/survey:hidden">{copy.questionLabel(number)}</span>
                        <span className="hidden items-center gap-1 @xl/survey:inline-flex" aria-hidden="true">
                            {number}
                            <ArrowRight className="size-4" />
                        </span>
                        <span className="sr-only hidden @xl/survey:inline">{copy.questionLabel(number)}</span>
                    </p>
                )}
                {editor ? (
                    <EditableText
                        label={`Question ${number ?? ""} text`.replace("  ", " ")}
                        placeholder="Type your question here"
                        value={question.title}
                        onChange={(t) => editor.onChange({ ...question, title: t })}
                        autoFocus={editor.autoFocus}
                        singleLine
                        className="text-display-xs font-semibold text-primary @xl/survey:text-display-sm"
                    />
                ) : (
                    <h2
                        ref={titleRef}
                        id={labelId}
                        tabIndex={-1}
                        className="text-display-xs font-semibold text-primary outline-hidden @xl/survey:text-display-sm"
                    >
                        {title ?? question.title}
                        {question.required && !isStatement && <span className="sr-only"> (required)</span>}
                    </h2>
                )}
                {editor && question.description !== undefined ? (
                    <EditableText
                        label="Description"
                        placeholder="Description (optional)"
                        value={question.description}
                        onChange={(d) => editor.onChange({ ...question, description: d })}
                        className="text-md text-tertiary @xl/survey:text-lg"
                    />
                ) : (
                    (description ?? question.description) && <p className="text-md text-tertiary @xl/survey:text-lg">{description ?? question.description}</p>
                )}
            </div>

            {editor && "options" in question ? (
                <OptionsEditor
                    label="Answer options"
                    options={question.options}
                    onChange={(options: QuestionOption[]) => editor.onChange({ ...question, options } as SurveyQuestionType)}
                    autoFocusFirstEmpty={editor.autoFocus && !!question.title}
                    showLetters={question.type !== "dropdown"}
                />
            ) : editor ? (
                // The rest preview as participants see them; their settings live in the side panel.
                <div inert className="pointer-events-none select-none">
                    {renderInput(question, undefined, () => {}, { ...shared, shortcuts: false })}
                </div>
            ) : (
                renderInput(question, value, onChange, shared)
            )}

            {!isStatement && !editor && <QuestionMessage id={messageId}>{message}</QuestionMessage>}
        </div>
    );
};

type Shared = {
    labelId: string;
    messageId: string;
    shortcuts: boolean;
    isInvalid: boolean;
    onCommit?: (value: AnswerValue | undefined) => void;
};

// Each input narrows the value to its own shape. The question type guarantees the match.
/* eslint-disable @typescript-eslint/no-explicit-any */
const renderInput = (question: SurveyQuestionType, value: AnswerValue | undefined, onChange: (v: AnswerValue | undefined) => void, shared: Shared) => {
    const p = {
        ...shared,
        value: value as any,
        onChange: onChange as any,
        onCommit: shared.onCommit as any,
    };
    switch (question.type) {
        case "multiple_choice":
            return <MultipleChoiceInput question={question} {...p} />;
        case "dropdown":
            return <DropdownInput question={question} {...p} />;
        case "yes_no":
            return <YesNoInput question={question} {...p} />;
        case "rating":
            return <RatingInput question={question} {...p} />;
        case "opinion_scale":
            return <OpinionScaleInput question={question} {...p} />;
        case "nps":
            return <NpsInput question={question} {...p} />;
        case "ranking":
            return <RankingInput question={question} {...p} />;
        case "matrix":
            return <MatrixInput question={question} {...p} />;
        case "short_text":
        case "long_text":
            return <TextAnswerInput question={question} {...p} />;
        case "number":
            return <NumberAnswerInput question={question} {...p} />;
        case "date":
            return <DateAnswerInput question={question} {...p} />;
        case "file_upload":
            return <FileUploadInput question={question} {...p} />;
        case "statement":
            return null;
    }
};
/* eslint-enable @typescript-eslint/no-explicit-any */
