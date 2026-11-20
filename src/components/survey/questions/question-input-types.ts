import type { AnswerValue, SurveyQuestion } from "../survey-types";

/** Props every question input shares. */
export interface QuestionInputProps<Q extends SurveyQuestion, V extends AnswerValue> {
    question: Q;
    value: V | undefined;
    onChange: (value: V | undefined) => void;
    /**
     * Called when the participant has finished with this question: a tap on an
     * auto-advance type, or Enter in a text field. Receives the latest value.
     */
    onCommit?: (value: V | undefined) => void;
    /** Turns on letter and number shortcuts. On for the active question on desktop. */
    shortcuts?: boolean;
    /** id of the inline message, for aria-describedby. */
    messageId?: string;
    isInvalid?: boolean;
    /** id of the question title, for aria-labelledby. */
    labelId: string;
}
