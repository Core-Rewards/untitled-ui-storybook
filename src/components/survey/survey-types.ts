/*
 * Participant-facing survey types.
 *
 * These mirror the handoff's proposed data model (Survey, SurveyQuestion, QuestionOption,
 * SurveyResponse, ResponseAnswer) as the participant sees it: every string is already
 * resolved to the participant's language. Question and option IDs are shared across
 * languages, so EN and FR answers line up in exports.
 */

export type SurveyLocale = "en" | "fr";

export type SurveyStatus = "draft" | "scheduled" | "live" | "closed" | "archived";

export type SurveyAnonymity = "anonymous" | "identified";

// ─── Rewards ─────────────────────────────────────────────────────────────────

export type SurveyRewardType = "points" | "sweepstakes" | "arcade_spins";

export interface SurveyReward {
    type: SurveyRewardType;
    amount: number;
}

// ─── Questions ───────────────────────────────────────────────────────────────

export interface QuestionOption {
    id: string;
    label: string;
}

interface QuestionBase {
    id: string;
    title: string;
    /** Helper text under the title, e.g. "Choose all that apply." */
    description?: string;
    required: boolean;
    /** Jump rules, checked in order. The first match wins. */
    logic?: LogicRule[];
    /** Where to go when no rule matches. Defaults to the next question. */
    defaultTarget?: LogicTarget;
}

export interface MultipleChoiceQuestion extends QuestionBase {
    type: "multiple_choice";
    options: QuestionOption[];
    /** Pick several. Single choice auto-advances; multiple uses Next. */
    multiple?: boolean;
    minPicks?: number;
    maxPicks?: number;
    randomize?: boolean;
    /** Adds an "Other" option with a text field. */
    allowOther?: boolean;
}

export interface DropdownQuestion extends QuestionBase {
    type: "dropdown";
    options: QuestionOption[];
    placeholder?: string;
}

export interface YesNoQuestion extends QuestionBase {
    type: "yes_no";
    yesLabel?: string;
    noLabel?: string;
}

export type RatingIcon = "star" | "heart" | "thumb";

export interface RatingQuestion extends QuestionBase {
    type: "rating";
    /** Number of icons, 3 to 10. Defaults to 5. */
    scale?: number;
    icon?: RatingIcon;
}

export interface OpinionScaleQuestion extends QuestionBase {
    type: "opinion_scale";
    /** 0 or 1. */
    min: 0 | 1;
    /** 5, 7 or 10. */
    max: 5 | 7 | 10;
    minLabel?: string;
    maxLabel?: string;
}

export interface NpsQuestion extends QuestionBase {
    type: "nps";
    minLabel?: string;
    maxLabel?: string;
}

export interface RankingQuestion extends QuestionBase {
    type: "ranking";
    options: QuestionOption[];
    randomize?: boolean;
}

export interface MatrixQuestion extends QuestionBase {
    type: "matrix";
    rows: QuestionOption[];
    columns: QuestionOption[];
}

export interface TextQuestion extends QuestionBase {
    type: "short_text" | "long_text";
    maxLength?: number;
    placeholder?: string;
}

export interface NumberQuestion extends QuestionBase {
    type: "number";
    min?: number;
    max?: number;
    /** Shown after the field, e.g. "acres". */
    unit?: string;
    placeholder?: string;
}

export interface DateQuestion extends QuestionBase {
    type: "date";
    /** ISO dates (YYYY-MM-DD). */
    minDate?: string;
    maxDate?: string;
}

export interface FileUploadQuestion extends QuestionBase {
    type: "file_upload";
    /** e.g. ["image/*", "application/pdf"] */
    acceptedTypes?: string[];
    maxSizeMb?: number;
    maxFiles?: number;
}

export interface StatementQuestion extends QuestionBase {
    type: "statement";
    buttonLabel?: string;
}

export type SurveyQuestion =
    | MultipleChoiceQuestion
    | DropdownQuestion
    | YesNoQuestion
    | RatingQuestion
    | OpinionScaleQuestion
    | NpsQuestion
    | RankingQuestion
    | MatrixQuestion
    | TextQuestion
    | NumberQuestion
    | DateQuestion
    | FileUploadQuestion
    | StatementQuestion;

export type SurveyQuestionType = SurveyQuestion["type"];

// ─── Answers ─────────────────────────────────────────────────────────────────

export interface ChoiceAnswer {
    selected: string[];
    /** Text typed into "Other", when it is selected. */
    other?: string;
}

export interface UploadedFile {
    id: string;
    name: string;
    sizeBytes: number;
    type: string;
}

/** One answer's value. Its shape depends on the question type. */
export type AnswerValue =
    | ChoiceAnswer // multiple_choice
    | string // dropdown (option id), short/long text, date (ISO), yes_no ("yes" | "no")
    | number // rating, opinion_scale, nps, number
    | string[] // ranking (option ids, best first)
    | Record<string, string> // matrix (row id → column id)
    | UploadedFile[]; // file_upload

export type SurveyAnswers = Record<string, AnswerValue | undefined>;

// ─── Logic ───────────────────────────────────────────────────────────────────

export type LogicOperator = "is" | "is_not" | "is_any_of" | "is_none_of" | "includes" | "lt" | "lte" | "gt" | "gte" | "answered" | "not_answered";

export interface LogicCondition {
    /** Question whose answer is checked. Usually the question the rule sits on. */
    questionId: string;
    operator: LogicOperator;
    /** Option id, number or text to compare against. Not used by answered / not_answered. */
    value?: string | number;
    /** For is_any_of / is_none_of: matches when the answer is (or includes) any of these. */
    values?: Array<string | number>;
}

/** A question id, or "end" to finish the survey. */
export type LogicTarget = string | "end";

export interface LogicRule {
    when: LogicCondition;
    goTo: LogicTarget;
}

// ─── Survey ──────────────────────────────────────────────────────────────────

export interface SurveyIntro {
    title: string;
    /** One or two sentences on why it matters. */
    body: string;
    imageSrc?: string;
    imageAlt?: string;
}

export type ThankYouDestination = "dashboard" | "rewards" | "link";

export interface SurveyThankYou {
    title: string;
    body: string;
    primaryAction: {
        label: string;
        destination: ThankYouDestination;
        href?: string;
    };
    secondaryAction?: {
        label: string;
        destination: ThankYouDestination;
        href?: string;
    };
}

export interface SurveyCardSettings {
    enabled: boolean;
    headline: string;
    body: string;
}

export interface Survey {
    id: string;
    programId: string;
    /** Short name, shown in the takeover header and on the card. */
    title: string;
    status: SurveyStatus;
    locale: SurveyLocale;
    anonymity: SurveyAnonymity;
    /** ISO date-times. */
    opensAt: string;
    closesAt: string;
    timezone: string;
    reward?: SurveyReward;
    intro: SurveyIntro;
    thankYou: SurveyThankYou;
    card: SurveyCardSettings;
    questions: SurveyQuestion[];
}

// ─── Response (one participant's progress) ───────────────────────────────────

export type SurveyResponseStatus = "not_started" | "in_progress" | "complete";

export interface SurveyResponse {
    surveyId: string;
    status: SurveyResponseStatus;
    locale: SurveyLocale;
    answers: SurveyAnswers;
    /** Question ids in the order the participant saw them, for Back. */
    history: string[];
    startedAt?: string;
    submittedAt?: string;
    /** Test responses from Preview are never counted or paid. */
    isTest?: boolean;
}

/** What the platform returns after a successful submit. */
export interface SurveySubmitResult {
    reward?: SurveyReward;
}
