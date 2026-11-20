import type { SurveyCopy } from "./survey-copy";
import type { AnswerValue, ChoiceAnswer, LogicCondition, LogicTarget, Survey, SurveyAnswers, SurveyQuestion, UploadedFile } from "./survey-types";

// ─── Answer helpers ──────────────────────────────────────────────────────────

export const isChoiceAnswer = (v: AnswerValue | undefined): v is ChoiceAnswer => !!v && typeof v === "object" && !Array.isArray(v) && "selected" in v;

/** True when the question has a usable answer. Statements count as answered once seen. */
export const isAnswered = (question: SurveyQuestion, value: AnswerValue | undefined): boolean => {
    if (question.type === "statement") return true;
    if (value === undefined || value === null) return false;
    switch (question.type) {
        case "multiple_choice": {
            if (!isChoiceAnswer(value) || value.selected.length === 0) return false;
            // "Other" alone, with nothing typed, is not an answer yet.
            return !(value.selected.length === 1 && value.selected[0] === OTHER_OPTION_ID && !value.other?.trim());
        }
        case "short_text":
        case "long_text":
        case "dropdown":
        case "date":
        case "yes_no":
            return typeof value === "string" && value.trim().length > 0;
        case "rating":
        case "opinion_scale":
        case "nps":
        case "number":
            return typeof value === "number" && !Number.isNaN(value);
        case "ranking":
            return Array.isArray(value) && value.length > 0;
        case "matrix":
            return typeof value === "object" && !Array.isArray(value) && question.rows.every((row) => !!(value as Record<string, string>)[row.id]);
        case "file_upload":
            return Array.isArray(value) && value.length > 0;
    }
};

export const OTHER_OPTION_ID = "__other";

/**
 * The inline message to show when the participant tries to continue, or undefined
 * when they may. Required questions say so gently; optional ones only validate what
 * was entered.
 */
export const getAnswerError = (question: SurveyQuestion, value: AnswerValue | undefined, copy: SurveyCopy): string | undefined => {
    const answered = isAnswered(question, value);
    if (!answered) return question.required ? copy.required : undefined;

    if (question.type === "multiple_choice" && question.multiple && isChoiceAnswer(value)) {
        const n = value.selected.length;
        if (question.minPicks && n < question.minPicks) return copy.pickAtLeast(question.minPicks);
        if (question.maxPicks && n > question.maxPicks) return copy.pickAtMost(question.maxPicks);
    }
    if (question.type === "number" && typeof value === "number") {
        if ((question.min !== undefined && value < question.min) || (question.max !== undefined && value > question.max)) {
            return copy.numberBetween(question.min, question.max);
        }
    }
    if ((question.type === "short_text" || question.type === "long_text") && question.maxLength && typeof value === "string") {
        if (value.length > question.maxLength) return copy.charactersLeft(0);
    }
    return undefined;
};

// ─── Logic ───────────────────────────────────────────────────────────────────

const answerAsComparable = (value: AnswerValue | undefined): Array<string | number> => {
    if (value === undefined) return [];
    if (isChoiceAnswer(value)) return value.selected;
    if (typeof value === "string" || typeof value === "number") return [value];
    if (Array.isArray(value)) return (value as Array<string | UploadedFile>).map((v) => (typeof v === "string" ? v : v.id));
    return Object.values(value);
};

export const evaluateCondition = (condition: LogicCondition, answers: SurveyAnswers): boolean => {
    const value = answers[condition.questionId];
    const values = answerAsComparable(value);
    const target = condition.value;
    const num = typeof value === "number" ? value : undefined;

    switch (condition.operator) {
        case "answered":
            return values.length > 0;
        case "not_answered":
            return values.length === 0;
        case "is":
            return values.length === 1 && values[0] === target;
        case "is_not":
            return !(values.length === 1 && values[0] === target);
        case "includes":
            return target !== undefined && values.includes(target);
        case "lt":
            return num !== undefined && typeof target === "number" && num < target;
        case "lte":
            return num !== undefined && typeof target === "number" && num <= target;
        case "gt":
            return num !== undefined && typeof target === "number" && num > target;
        case "gte":
            return num !== undefined && typeof target === "number" && num >= target;
    }
};

/** Where the participant goes after this question: the first matching rule, the default target, or the next question. */
export const getNextTarget = (survey: Survey, questionId: string, answers: SurveyAnswers): LogicTarget => {
    const index = survey.questions.findIndex((q) => q.id === questionId);
    const question = survey.questions[index];
    if (!question) return "end";

    const match = question.logic?.find((rule) => evaluateCondition(rule.when, answers));
    if (match) return match.goTo;
    if (question.defaultTarget) return question.defaultTarget;
    return survey.questions[index + 1]?.id ?? "end";
};

/**
 * Walks the survey from the first question using the participant's answers, and
 * returns the question to resume at (the first unanswered one on their path), plus
 * the path walked so Back still works. Returns "end" when every question on the
 * path is answered.
 */
export const getResumePoint = (survey: Survey, answers: SurveyAnswers): { questionId: LogicTarget; history: string[] } => {
    const history: string[] = [];
    let current: LogicTarget | undefined = survey.questions[0]?.id ?? "end";
    const seen = new Set<string>();

    while (current && current !== "end" && !seen.has(current)) {
        seen.add(current);
        const question = survey.questions.find((q) => q.id === current);
        if (!question) return { questionId: "end", history };
        // Statements are messages, not questions, so resuming never stops on one.
        if (question.type !== "statement" && !isAnswered(question, answers[question.id])) {
            return { questionId: question.id, history };
        }
        history.push(question.id);
        current = getNextTarget(survey, question.id, answers);
    }
    return { questionId: "end", history };
};

// ─── Piping and estimates ────────────────────────────────────────────────────

/** Readable text for an answer, used for piping ("Why did you give us a {{q1}}?"). */
export const formatAnswer = (question: SurveyQuestion | undefined, value: AnswerValue | undefined, copy: SurveyCopy): string => {
    if (!question || value === undefined) return "";
    if (isChoiceAnswer(value)) {
        const options = "options" in question ? question.options : [];
        return value.selected
            .map((id) => (id === OTHER_OPTION_ID ? (value.other ?? copy.otherLabel) : (options.find((o) => o.id === id)?.label ?? id)))
            .join(", ");
    }
    if (question.type === "dropdown" && typeof value === "string") return question.options.find((o) => o.id === value)?.label ?? value;
    if (question.type === "yes_no") return value === "yes" ? (question.yesLabel ?? copy.yes) : (question.noLabel ?? copy.no);
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
};

/** Replaces {{questionId}} tokens with that question's answer. */
export const pipeAnswers = (text: string, survey: Survey, answers: SurveyAnswers, copy: SurveyCopy) =>
    text.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, id: string) =>
        formatAnswer(
            survey.questions.find((q) => q.id === id),
            answers[id],
            copy,
        ),
    );

/** Seconds a typical participant spends on each question type. */
const SECONDS_PER_TYPE: Record<SurveyQuestion["type"], number> = {
    multiple_choice: 12,
    dropdown: 12,
    yes_no: 6,
    rating: 6,
    opinion_scale: 8,
    nps: 8,
    ranking: 25,
    matrix: 30,
    short_text: 25,
    long_text: 45,
    number: 10,
    date: 12,
    file_upload: 40,
    statement: 6,
};

/** Rounded-up minutes to finish, never under 1. */
export const estimateMinutes = (questions: SurveyQuestion[]) => Math.max(1, Math.ceil(questions.reduce((s, q) => s + SECONDS_PER_TYPE[q.type], 0) / 60));

/** Questions that take an answer (statements don't count toward "5 questions"). */
export const countAnswerable = (questions: SurveyQuestion[]) => questions.filter((q) => q.type !== "statement").length;

/** Types that move on by themselves after a tap. The rest use Next / OK. */
export const AUTO_ADVANCE_TYPES: ReadonlySet<SurveyQuestion["type"]> = new Set(["yes_no", "rating", "opinion_scale", "nps"]);

export const autoAdvances = (question: SurveyQuestion) => AUTO_ADVANCE_TYPES.has(question.type) || (question.type === "multiple_choice" && !question.multiple);
