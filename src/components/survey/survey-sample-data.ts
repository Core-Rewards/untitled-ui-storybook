import sampleIntroImage from "./assets/sample-intro.jpg";
import type { Survey, SurveyLocale, SurveyQuestion, SurveyResponse } from "./survey-types";

/*
 * Sample data for stories: the "2026 Program Satisfaction" survey from the wireframes,
 * in English and French, plus a gallery survey with every question type.
 * Question and option IDs are shared across languages.
 */

const text = {
    en: {
        title: "2026 Program Satisfaction",
        introTitle: "2026 Program Satisfaction Survey",
        introBody: "Tell us how the program is working for you. Your feedback shapes what we change next year.",
        cardBody: "Tell us how the program is working for you.",
        thanksTitle: "Thank you!",
        thanksBody: "Your feedback helps shape the program for next year.",
        browseRewards: "Browse rewards",
        backToDashboard: "Back to dashboard",
        q1: "How satisfied are you with the program overall?",
        q1Desc: "Choose one. There are no wrong answers.",
        q1Min: "Very dissatisfied",
        q1Max: "Very satisfied",
        q2: "What's not working for you?",
        q2Desc: "A sentence or two is plenty.",
        q3: "How likely are you to recommend the program to a colleague?",
        q3Min: "Not at all likely",
        q3Max: "Extremely likely",
        q4: "Which program features do you use most?",
        q4Desc: "Choose all that apply.",
        q4Options: ["Earning points", "Redeeming rewards", "Promotions", "Rewards arcade", "Reports"],
        q5: "What would make the program more valuable to you?",
        q5Desc: "Optional.",
    },
    fr: {
        title: "Satisfaction 2026 à l'égard du programme",
        introTitle: "Sondage 2026 sur la satisfaction à l'égard du programme",
        introBody: "Dites-nous comment le programme fonctionne pour vous. Vos commentaires orientent les changements de l'an prochain.",
        cardBody: "Dites-nous comment le programme fonctionne pour vous.",
        thanksTitle: "Merci!",
        thanksBody: "Vos commentaires nous aident à façonner le programme de l'an prochain.",
        browseRewards: "Parcourir les récompenses",
        backToDashboard: "Retour au tableau de bord",
        q1: "Dans l'ensemble, êtes-vous satisfait du programme?",
        q1Desc: "Choisissez une réponse. Il n'y a pas de mauvaise réponse.",
        q1Min: "Très insatisfait",
        q1Max: "Très satisfait",
        q2: "Qu'est-ce qui ne fonctionne pas pour vous?",
        q2Desc: "Une phrase ou deux suffisent.",
        q3: "Quelle est la probabilité que vous recommandiez le programme à un collègue?",
        q3Min: "Pas du tout probable",
        q3Max: "Très probable",
        q4: "Quelles fonctionnalités du programme utilisez-vous le plus?",
        q4Desc: "Choisissez toutes les réponses qui s'appliquent.",
        q4Options: ["Accumuler des points", "Échanger des récompenses", "Promotions", "Arcade Récompenses", "Rapports"],
        q5: "Qu'est-ce qui rendrait le programme plus utile pour vous?",
        q5Desc: "Facultatif.",
    },
};

const FEATURE_IDS = ["earn", "redeem", "promotions", "arcade", "reports"];

/** The 5-question satisfaction survey from the wireframes. Q1 at 1 or 2 asks Q2; otherwise it skips to Q3. */
export const getSatisfactionSurvey = (locale: SurveyLocale = "en", overrides: Partial<Survey> = {}): Survey => {
    const t = text[locale];
    return {
        id: "srv-2026-satisfaction",
        programId: "advisor-advantage",
        title: t.title,
        status: "live",
        locale,
        anonymity: "anonymous",
        opensAt: "2026-11-15T09:00:00-05:00",
        closesAt: "2026-12-15T23:59:00-05:00",
        timezone: "America/Toronto",
        reward: { type: "points", amount: 500 },
        intro: { title: t.introTitle, body: t.introBody },
        thankYou: {
            title: t.thanksTitle,
            body: t.thanksBody,
            primaryAction: { label: t.browseRewards, destination: "rewards" },
            secondaryAction: { label: t.backToDashboard, destination: "dashboard" },
        },
        card: { enabled: true, headline: t.title, body: t.cardBody },
        enabledLocales: ["en", "fr"],
        emails: { inviteAtOpen: true, reminder: true, reminderDaysBeforeClose: 3 },
        questions: [
            {
                id: "q1",
                type: "opinion_scale",
                title: t.q1,
                description: t.q1Desc,
                required: true,
                min: 1,
                max: 5,
                minLabel: t.q1Min,
                maxLabel: t.q1Max,
                logic: [{ when: { questionId: "q1", operator: "is_any_of", values: [1, 2] }, goTo: "q2" }],
                defaultTarget: "q3",
            },
            {
                id: "q2",
                type: "long_text",
                title: t.q2,
                description: t.q2Desc,
                required: false,
                maxLength: 500,
                defaultTarget: "q3",
            },
            {
                id: "q3",
                type: "nps",
                title: t.q3,
                required: true,
                minLabel: t.q3Min,
                maxLabel: t.q3Max,
            },
            {
                id: "q4",
                type: "multiple_choice",
                title: t.q4,
                description: t.q4Desc,
                required: true,
                multiple: true,
                options: t.q4Options.map((label, i) => ({ id: FEATURE_IDS[i], label })),
            },
            {
                id: "q5",
                type: "long_text",
                title: t.q5,
                description: t.q5Desc,
                required: false,
                maxLength: 1000,
            },
        ],
        ...overrides,
    };
};

/** The same survey with the optional intro image. */
export const getSatisfactionSurveyWithImage = (locale: SurveyLocale = "en") => {
    const survey = getSatisfactionSurvey(locale);
    return {
        ...survey,
        intro: { ...survey.intro, imageSrc: sampleIntroImage, imageAlt: "" },
    };
};

// ─── Responses ───────────────────────────────────────────────────────────────

export const notStartedResponse = (locale: SurveyLocale = "en"): SurveyResponse => ({
    surveyId: "srv-2026-satisfaction",
    status: "not_started",
    locale,
    answers: {},
    history: [],
});

/** Answered Q1 (2, so Q2 is asked) and Q2. Resumes at Q3. */
export const inProgressResponse = (locale: SurveyLocale = "en"): SurveyResponse => ({
    surveyId: "srv-2026-satisfaction",
    status: "in_progress",
    locale,
    answers: {
        q1: 2,
        q2: locale === "fr" ? "Le catalogue de récompenses est difficile à parcourir." : "The rewards catalog is hard to browse.",
    },
    history: ["q1", "q2"],
    startedAt: "2026-11-18T14:02:00-05:00",
});

export const completedResponse = (locale: SurveyLocale = "en"): SurveyResponse => ({
    surveyId: "srv-2026-satisfaction",
    status: "complete",
    locale,
    answers: { q1: 4, q3: 9, q4: { selected: ["earn", "redeem"] } },
    history: ["q1", "q3", "q4", "q5"],
    startedAt: "2026-11-18T14:02:00-05:00",
    submittedAt: "2026-11-18T14:04:10-05:00",
});

// ─── Every question type ─────────────────────────────────────────────────────

const regions = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"];

/** One example of each question type, in the order the type picker groups them. */
export const sampleQuestions: Record<SurveyQuestion["type"], SurveyQuestion> = {
    multiple_choice: {
        id: "mc",
        type: "multiple_choice",
        title: "How did you first hear about the program?",
        required: true,
        allowOther: true,
        options: [
            { id: "rep", label: "My sales rep" },
            { id: "email", label: "An email from the program" },
            { id: "colleague", label: "A colleague" },
            { id: "event", label: "A trade event" },
        ],
    },
    dropdown: {
        id: "dd",
        type: "dropdown",
        title: "Which province is your business in?",
        required: true,
        options: regions.map((label) => ({
            id: label.toLowerCase().replace(/\s+/g, "-"),
            label,
        })),
    },
    yes_no: {
        id: "yn",
        type: "yes_no",
        title: "Have you redeemed a reward in the last 3 months?",
        required: true,
    },
    rating: {
        id: "rt",
        type: "rating",
        title: "How would you rate the rewards catalog?",
        required: true,
        scale: 5,
        icon: "star",
    },
    opinion_scale: {
        id: "os",
        type: "opinion_scale",
        title: "Submitting a sale is quick and easy.",
        description: "How much do you agree?",
        required: true,
        min: 1,
        max: 7,
        minLabel: "Strongly disagree",
        maxLabel: "Strongly agree",
    },
    nps: {
        id: "nps",
        type: "nps",
        title: "How likely are you to recommend the program to a colleague?",
        required: true,
        minLabel: "Not at all likely",
        maxLabel: "Extremely likely",
    },
    ranking: {
        id: "rk",
        type: "ranking",
        title: "Rank these rewards from most to least appealing.",
        required: true,
        options: [
            { id: "gift-cards", label: "Gift cards" },
            { id: "merch", label: "Branded merchandise" },
            { id: "travel", label: "Travel" },
            { id: "electronics", label: "Electronics" },
        ],
    },
    matrix: {
        id: "mx",
        type: "matrix",
        title: "How satisfied are you with each part of the program?",
        required: true,
        rows: [
            { id: "earning", label: "Earning points" },
            { id: "catalog", label: "Rewards catalog" },
            { id: "support", label: "Customer support" },
        ],
        columns: [
            { id: "1", label: "Dissatisfied" },
            { id: "2", label: "Neutral" },
            { id: "3", label: "Satisfied" },
        ],
    },
    short_text: {
        id: "st",
        type: "short_text",
        title: "What's your job title?",
        required: false,
        maxLength: 80,
        placeholder: "e.g. Crop advisor",
    },
    long_text: {
        id: "lt",
        type: "long_text",
        title: "What would make the program more valuable to you?",
        required: false,
        maxLength: 1000,
    },
    number: {
        id: "num",
        type: "number",
        title: "How many acres do you advise on?",
        required: true,
        min: 0,
        max: 100000,
        unit: "acres",
    },
    date: {
        id: "dt",
        type: "date",
        title: "When did you last place an order?",
        required: false,
        maxDate: "2026-11-20",
    },
    file_upload: {
        id: "fu",
        type: "file_upload",
        title: "Share a photo of your best display this season.",
        description: "Optional. JPG, PNG or PDF.",
        required: false,
        acceptedTypes: ["image/jpeg", "image/png", "application/pdf"],
        maxSizeMb: 10,
        maxFiles: 3,
    },
    statement: {
        id: "stm",
        type: "statement",
        title: "Thanks! The next few questions are about rewards.",
        description: "They take about 30 seconds.",
        required: false,
        buttonLabel: "Continue",
    },
};

/** A gallery survey with one question of every type. */
export const getAllTypesSurvey = (): Survey => ({
    ...getSatisfactionSurvey("en"),
    id: "srv-all-types",
    title: "Every question type",
    questions: Object.values(sampleQuestions),
});
