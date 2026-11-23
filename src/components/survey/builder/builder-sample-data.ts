import { getSatisfactionSurvey } from "../survey-sample-data";
import type { Survey, SurveyQuestion } from "../survey-types";
import { extractStrings } from "./builder-model";
import type { SurveyStringEntry, Translations } from "./builder-model";

/** The wireframes' draft: 2026 Program Satisfaction, in English, as the builder edits it. */
export const getBuilderSurvey = (): Survey => ({ ...getSatisfactionSurvey("en"), status: "draft" });

/**
 * French for the builder survey, with 6 strings still missing so the counter reads
 * "FR 18 of 24", as in the wireframes. Keys line up because question and option IDs
 * are shared across languages.
 */
export const getBuilderTranslations = (): Translations => {
    const en = extractStrings(getBuilderSurvey());
    const fr = extractStrings(getSatisfactionSurvey("fr"));
    const byKey = new Map(fr.map((s) => [s.key, s.text]));
    const missing = new Set(["q3.title", "q4.title", "q4.description", "q4.option.promotions", "q4.option.arcade", "q4.option.reports"]);
    return Object.fromEntries(en.filter((s) => !missing.has(s.key) && byKey.has(s.key)).map((s) => [s.key, byKey.get(s.key)!]));
};

// ─── Question bank ───────────────────────────────────────────────────────────

/** Omit that keeps each member of a union (plain Omit collapses SurveyQuestion's types). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A ready-made, Core-written question with French already filled in. */
export interface BankQuestion {
    id: string;
    /** Question without an id; the builder assigns one. */
    question: DistributiveOmit<SurveyQuestion, "id">;
    /** French for the question's strings, keyed by the field part of the string key (`title`, `option.<id>`, `minLabel`…). */
    fr: Record<string, string>;
}

const opt = (id: string, label: string) => ({ id, label });

export const QUESTION_BANK: BankQuestion[] = [
    {
        id: "bank-nps",
        question: {
            type: "nps",
            title: "How likely are you to recommend the program to a colleague?",
            required: true,
            minLabel: "Not at all likely",
            maxLabel: "Extremely likely",
        },
        fr: {
            title: "Quelle est la probabilité que vous recommandiez le programme à un collègue?",
            minLabel: "Pas du tout probable",
            maxLabel: "Très probable",
        },
    },
    {
        id: "bank-overall-satisfaction",
        question: {
            type: "opinion_scale",
            title: "How satisfied are you with the program overall?",
            required: true,
            min: 1,
            max: 5,
            minLabel: "Very dissatisfied",
            maxLabel: "Very satisfied",
        },
        fr: { title: "Dans l'ensemble, êtes-vous satisfait du programme?", minLabel: "Très insatisfait", maxLabel: "Très satisfait" },
    },
    {
        id: "bank-nps-reason",
        question: { type: "long_text", title: "What's the main reason for your score?", required: false, maxLength: 1000 },
        fr: { title: "Quelle est la principale raison de votre note?" },
    },
    {
        id: "bank-ease-of-earning",
        question: {
            type: "opinion_scale",
            title: "Earning points is easy.",
            description: "How much do you agree?",
            required: true,
            min: 1,
            max: 5,
            minLabel: "Strongly disagree",
            maxLabel: "Strongly agree",
        },
        fr: {
            title: "Il est facile d'accumuler des points.",
            description: "Dans quelle mesure êtes-vous d'accord?",
            minLabel: "Pas du tout d'accord",
            maxLabel: "Tout à fait d'accord",
        },
    },
    {
        id: "bank-catalog-rating",
        question: { type: "rating", title: "How would you rate the rewards catalog?", required: true, scale: 5, icon: "star" },
        fr: { title: "Comment évaluez-vous le catalogue de récompenses?" },
    },
    {
        id: "bank-features",
        question: {
            type: "multiple_choice",
            title: "Which program features do you use most?",
            description: "Choose all that apply.",
            required: true,
            multiple: true,
            options: [opt("earn", "Earning points"), opt("redeem", "Redeeming rewards"), opt("promotions", "Promotions"), opt("arcade", "Rewards arcade")],
        },
        fr: {
            title: "Quelles fonctionnalités du programme utilisez-vous le plus?",
            description: "Choisissez toutes les réponses qui s'appliquent.",
            "option.earn": "Accumuler des points",
            "option.redeem": "Échanger des récompenses",
            "option.promotions": "Promotions",
            "option.arcade": "Arcade Récompenses",
        },
    },
    {
        id: "bank-channel",
        question: {
            type: "multiple_choice",
            title: "How would you like to hear about the program?",
            required: true,
            options: [opt("email", "Email"), opt("rep", "My sales rep"), opt("site", "On the program site"), opt("text", "Text message")],
        },
        fr: {
            title: "Comment aimeriez-vous être informé du programme?",
            "option.email": "Courriel",
            "option.rep": "Mon représentant",
            "option.site": "Sur le site du programme",
            "option.text": "Message texte",
        },
    },
    {
        id: "bank-frequency",
        question: {
            type: "multiple_choice",
            title: "How often do you visit the program site?",
            required: true,
            options: [opt("weekly", "Every week"), opt("monthly", "Every month"), opt("quarterly", "A few times a year"), opt("rarely", "Rarely")],
        },
        fr: {
            title: "À quelle fréquence visitez-vous le site du programme?",
            "option.weekly": "Chaque semaine",
            "option.monthly": "Chaque mois",
            "option.quarterly": "Quelques fois par année",
            "option.rarely": "Rarement",
        },
    },
    {
        id: "bank-role",
        question: { type: "short_text", title: "What's your job title?", required: false, maxLength: 80, placeholder: "e.g. Crop advisor" },
        fr: { title: "Quel est votre titre de poste?" },
    },
    {
        id: "bank-years",
        question: { type: "number", title: "How many years have you been in the program?", required: false, min: 0, max: 50, unit: "years" },
        fr: { title: "Depuis combien d'années participez-vous au programme?" },
    },
    {
        id: "bank-would-recommend",
        question: { type: "yes_no", title: "Would you recommend the program to someone in your role?", required: true },
        fr: { title: "Recommanderiez-vous le programme à une personne occupant le même poste que vous?" },
    },
    {
        id: "bank-improve",
        question: { type: "long_text", title: "What would make the program more valuable to you?", required: false, maxLength: 1000 },
        fr: { title: "Qu'est-ce qui rendrait le programme plus utile pour vous?" },
    },
];

/**
 * Stand-in for the AI translation call in stories: uses known French for the sample
 * survey, and otherwise returns a clearly marked placeholder for review. Waits a
 * moment like a real request.
 */
export const mockDraftFrench = async (entries: SurveyStringEntry[]): Promise<Translations> => {
    await new Promise((r) => setTimeout(r, 900));
    const known = new Map(extractStrings(getSatisfactionSurvey("fr")).map((s) => [s.key, s.text]));
    const byEnglish = new Map(extractStrings(getSatisfactionSurvey("en")).map((s) => [s.text, known.get(s.key)]));
    return Object.fromEntries(entries.map((e) => [e.key, known.get(e.key) ?? byEnglish.get(e.text) ?? `[FR] ${e.text}`]));
};
