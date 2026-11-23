import type { QuestionOption, Survey, SurveyQuestion, SurveyQuestionType } from "../survey-types";
import { typeInfo } from "./question-catalog";

/*
 * Pure helpers for the builder: new questions with sensible defaults, switching
 * type without losing compatible content, and the list of translatable strings
 * that drives the FR counter.
 */

/** French (or other non-base) text, keyed by string key, e.g. `q1.title` or `q4.option.earn`. */
export type Translations = Record<string, string>;

let optionSeq = 0;
export const newOptionId = () => `opt-${Date.now().toString(36)}-${(optionSeq++).toString(36)}`;

/** The next free question id (q1, q2, …). */
export const newQuestionId = (survey: Survey) => {
    const used = new Set(survey.questions.map((q) => q.id));
    let n = survey.questions.length + 1;
    while (used.has(`q${n}`)) n++;
    return `q${n}`;
};

const emptyOptions = (n: number): QuestionOption[] => Array.from({ length: n }, () => ({ id: newOptionId(), label: "" }));

/** A new question of a type, with defaults from the plan: two empty options for choices, NPS pre-filled, and so on. */
export const createQuestion = (type: SurveyQuestionType, id: string, programName = "the program"): SurveyQuestion => {
    const base = { id, title: "", required: true };
    switch (type) {
        case "multiple_choice":
            return { ...base, type, options: emptyOptions(2) };
        case "dropdown":
            return { ...base, type, options: emptyOptions(2) };
        case "yes_no":
            return { ...base, type };
        case "ranking":
            return { ...base, type, options: emptyOptions(3) };
        case "rating":
            return { ...base, type, scale: 5, icon: "star" };
        case "opinion_scale":
            return { ...base, type, min: 1, max: 5, minLabel: "Very dissatisfied", maxLabel: "Very satisfied" };
        case "nps":
            return {
                ...base,
                type,
                title: `How likely are you to recommend ${programName} to a colleague?`,
                minLabel: "Not at all likely",
                maxLabel: "Extremely likely",
            };
        case "matrix":
            return {
                ...base,
                type,
                rows: emptyOptions(2),
                columns: [
                    { id: newOptionId(), label: "Dissatisfied" },
                    { id: newOptionId(), label: "Neutral" },
                    { id: newOptionId(), label: "Satisfied" },
                ],
            };
        case "short_text":
            return { ...base, type, required: false, maxLength: 120 };
        case "long_text":
            return { ...base, type, required: false, maxLength: 1000 };
        case "number":
            return { ...base, type, min: 0 };
        case "date":
            return { ...base, type };
        case "file_upload":
            return { ...base, type, required: false, acceptedTypes: ["image/jpeg", "image/png", "application/pdf"], maxSizeMb: 10, maxFiles: 1 };
        case "statement":
            return { ...base, type, required: false, buttonLabel: "Continue" };
    }
};

const OPTION_TYPES: SurveyQuestionType[] = ["multiple_choice", "dropdown", "ranking"];
const SCALE_LABEL_TYPES: SurveyQuestionType[] = ["opinion_scale", "nps"];

/**
 * Switches a question's type, keeping compatible content: title, description and
 * required always; answer options between multiple choice, dropdown and ranking;
 * end labels between opinion scale and NPS. Returns what would be dropped so the
 * builder can ask first.
 */
export const changeQuestionType = (
    question: SurveyQuestion,
    type: SurveyQuestionType,
    programName?: string,
): { question: SurveyQuestion; dropped: string[] } => {
    if (question.type === type) return { question, dropped: [] };
    const fresh = createQuestion(type, question.id, programName);
    const dropped: string[] = [];
    const next = { ...fresh, title: question.title || fresh.title, description: question.description, required: question.required } as SurveyQuestion;

    const oldOptions = "options" in question ? question.options.filter((o) => o.label.trim()) : [];
    if (OPTION_TYPES.includes(type) && "options" in next) {
        if (oldOptions.length) (next as { options: QuestionOption[] }).options = "options" in question ? question.options : next.options;
    } else if (oldOptions.length) {
        dropped.push(`${oldOptions.length} answer ${oldOptions.length === 1 ? "option" : "options"}`);
    }

    if (SCALE_LABEL_TYPES.includes(type) && SCALE_LABEL_TYPES.includes(question.type) && "minLabel" in question) {
        Object.assign(next, { minLabel: question.minLabel, maxLabel: question.maxLabel });
    }

    if (question.type === "matrix" && type !== "matrix" && question.rows.some((r) => r.label.trim())) dropped.push("matrix rows");

    // Rules compare against this question's answers, so they rarely survive a type change.
    if (question.logic?.length) dropped.push(`${question.logic.length} logic ${question.logic.length === 1 ? "rule" : "rules"}`);
    next.defaultTarget = question.defaultTarget;

    return { question: next, dropped };
};

/** "Opinion scale · Required" / "Multiple choice · Pick any" for the outline. */
export const questionSummary = (q: SurveyQuestion) => {
    const parts: string[] = [typeInfo(q.type).label];
    if (q.type === "multiple_choice") parts.push(q.multiple ? "Pick any" : "Pick one");
    if (q.type !== "statement") parts.push(q.required ? "Required" : "Optional");
    return parts.join(" · ");
};

// ─── Translatable strings ────────────────────────────────────────────────────

export interface SurveyStringEntry {
    /** Stable key shared by every language, e.g. `q3.title`. */
    key: string;
    /** Where it appears, for the translation view: "Q3 · question". */
    where: string;
    /** Base-language text. */
    text: string;
}

/**
 * Every participant-facing string in the survey, in order. Empty base strings are
 * skipped (there's nothing to translate yet). Adding a question grows this list,
 * so new text can't skip translation.
 */
export const extractStrings = (survey: Survey): SurveyStringEntry[] => {
    const out: SurveyStringEntry[] = [];
    const add = (key: string, where: string, text?: string) => {
        if (text && text.trim()) out.push({ key, where, text });
    };
    add("intro.title", "Intro · title", survey.intro.title);
    add("intro.body", "Intro · text", survey.intro.body);
    survey.questions.forEach((q, i) => {
        const n = `Q${i + 1}`;
        add(`${q.id}.title`, `${n} · question`, q.title);
        add(`${q.id}.description`, `${n} · description`, q.description);
        if ("options" in q) q.options.forEach((o, j) => add(`${q.id}.option.${o.id}`, `${n} · option ${j + 1}`, o.label));
        if (q.type === "matrix") {
            q.rows.forEach((r, j) => add(`${q.id}.row.${r.id}`, `${n} · row ${j + 1}`, r.label));
            q.columns.forEach((c, j) => add(`${q.id}.column.${c.id}`, `${n} · column ${j + 1}`, c.label));
        }
        if ("minLabel" in q) {
            add(`${q.id}.minLabel`, `${n} · left label`, q.minLabel);
            add(`${q.id}.maxLabel`, `${n} · right label`, q.maxLabel);
        }
        if (q.type === "yes_no") {
            add(`${q.id}.yesLabel`, `${n} · yes label`, q.yesLabel);
            add(`${q.id}.noLabel`, `${n} · no label`, q.noLabel);
        }
        if (q.type === "statement") add(`${q.id}.buttonLabel`, `${n} · button`, q.buttonLabel);
    });
    add("thankYou.title", "Thank-you · title", survey.thankYou.title);
    add("thankYou.body", "Thank-you · text", survey.thankYou.body);
    add("card.headline", "Dashboard card · headline", survey.card.headline);
    add("card.body", "Dashboard card · text", survey.card.body);
    return out;
};

/** "FR 18 of 24": how many base strings have a translation. */
export const translationProgress = (survey: Survey, translations: Translations) => {
    const strings = extractStrings(survey);
    const done = strings.filter((s) => translations[s.key]?.trim()).length;
    return { done, total: strings.length };
};
