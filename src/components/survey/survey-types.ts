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
    /**
     * Quizzes: the right answer. Option ids, or "yes" / "no" for Yes / No. Setting it
     * (even to an empty list while drafting) makes the question scored. Only
     * multiple choice, dropdown and yes / no can be scored; see `quiz-logic.ts`.
     * Multi-select questions need every correct option and no others.
     */
    correct?: string[];
    /** Quizzes: why the answer is right. Shown when answers are revealed, right or wrong. */
    explanation?: string;
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

/** A survey collects opinions; a quiz has right answers and a score. Chosen when it's created. */
export type SurveyKind = "survey" | "quiz";

/** How a quiz pays its reward. Set per quiz. */
export type QuizRewardRule = "completion" | "pass" | "tiered";

/**
 * When participants see the right answers and explanations:
 * - `each_question`: straight after they check each answer. Back is off, since a revealed answer can't change.
 * - `at_end`: on the results screen, after submitting.
 * - `never`: only their score. Use when the same questions run again.
 */
export type QuizAnswerReveal = "each_question" | "at_end" | "never";

export interface QuizTier {
    /** Minimum percent correct for this tier, 0 to 100. */
    minScore: number;
    amount: number;
}

export interface QuizSettings {
    /** Percent correct needed to pass, 0 to 100. */
    passMark: number;
    rewardRule: QuizRewardRule;
    /** Tiered only: minimum percent and the amount for it, best tier first. `reward.amount` is the top tier. */
    tiers?: QuizTier[];
    /** Defaults to `at_end`. */
    reveal?: QuizAnswerReveal;
}

/** A quiz result. `total` counts the scored questions on the participant's path. */
export interface QuizScore {
    correct: number;
    total: number;
    passed: boolean;
}

export interface Survey {
    id: string;
    /** Defaults to "survey". */
    kind?: SurveyKind;
    /** Quizzes only. Quizzes can't be retaken. */
    quiz?: QuizSettings;
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
    /** Languages participants can take it in. Base language first. Defaults to just the base. */
    enabledLocales?: SurveyLocale[];
    /** Invite and reminder emails (admin settings; participants never see these). */
    emails?: SurveyEmails;
    /** Completed responses so far. Anonymity locks once this is above 0. */
    responseCount?: number;
}

export interface SurveyEmails {
    /** Invite everyone in the program when the survey opens. On by default. */
    inviteAtOpen: boolean;
    /** Remind people who haven't finished. */
    reminder: boolean;
    /** How many days before close the reminder goes out. */
    reminderDaysBeforeClose: number;
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
    /** Quizzes: the result once submitted. */
    score?: QuizScore;
    /** What was actually paid on submit (a quiz may pay less, or nothing). */
    rewardEarned?: SurveyReward;
}

/** What the platform returns after a successful submit. */
export interface SurveySubmitResult {
    /** What was paid. For quizzes this depends on the score and may be nothing. */
    reward?: SurveyReward;
    /**
     * Quizzes: the platform's grading, which wins over the browser's. The platform
     * should always grade on submit; see `quiz-logic.ts` for the rules to match.
     */
    score?: QuizScore;
    /**
     * Quizzes: right answers and explanations, by question id, for the results
     * review. Lets the platform keep them out of the browser until now.
     */
    answerKey?: QuizAnswerKey;
}

export type QuizAnswerKey = Record<string, { correct: string[]; explanation?: string }>;
