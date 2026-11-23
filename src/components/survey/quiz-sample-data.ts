import type { QuizSettings, Survey, SurveyAnswers, SurveyLocale, SurveyResponse } from "./survey-types";

/*
 * Sample quiz for stories: "2027 Fungicide Lineup Quiz", in English and French.
 * Product names are made up. Five scored questions (single choice, yes / no,
 * multi-select and dropdown) plus one unscored confidence question, so the
 * "collected, not scored" case shows up too. Ids are shared across languages.
 */

const text = {
    en: {
        title: "2027 Fungicide Lineup Quiz",
        introTitle: "2027 Fungicide Lineup Quiz",
        introBody: "Check what you know about next season's fungicides before your growers start asking.",
        cardBody: "Five questions on next season's fungicides.",
        thanksTitle: "Quiz complete",
        thanksBody: "Thanks for brushing up on the 2027 lineup.",
        backToDashboard: "Back to dashboard",
        browseRewards: "Browse rewards",
        k1: "Which product is labelled for early blight in potatoes?",
        k1Options: ["Veltrix", "Corvana", "Halden"],
        k1Why: "Corvana is the only 2027 product with early blight on its potato label.",
        k2: "What's Corvana's restricted-entry interval?",
        k2Options: ["4 hours", "12 hours", "24 hours"],
        k2Why: "Workers can go back into treated fields 12 hours after application.",
        k3: "Can Veltrix be applied by air?",
        k3Why: "Yes. The label allows aerial application in at least 20 L/ha of water.",
        k4: "Which crops is Halden registered for?",
        k4Desc: "Choose all that apply.",
        k4Options: ["Wheat", "Barley", "Canola", "Soybeans"],
        k4Why: "Halden is a cereal fungicide: wheat and barley only.",
        k5: "How many Corvana applications are allowed per season?",
        k5Options: ["1", "2", "3", "4"],
        k5Why: "Two per season, at least 14 days apart, to manage resistance.",
        k6: "How confident do you feel recommending the 2027 lineup?",
        k6Desc: "Not scored. It helps us plan training.",
        k6Min: "Not confident",
        k6Max: "Very confident",
    },
    fr: {
        title: "Quiz sur la gamme de fongicides 2027",
        introTitle: "Quiz sur la gamme de fongicides 2027",
        introBody: "Vérifiez vos connaissances sur les fongicides de la prochaine saison avant les questions de vos producteurs.",
        cardBody: "Cinq questions sur les fongicides de la prochaine saison.",
        thanksTitle: "Quiz terminé",
        thanksBody: "Merci d'avoir révisé la gamme 2027.",
        backToDashboard: "Retour au tableau de bord",
        browseRewards: "Parcourir les récompenses",
        k1: "Quel produit est homologué contre la brûlure alternarienne de la pomme de terre?",
        k1Options: ["Veltrix", "Corvana", "Halden"],
        k1Why: "Corvana est le seul produit 2027 dont l'étiquette vise la brûlure alternarienne de la pomme de terre.",
        k2: "Quel est le délai de sécurité après traitement de Corvana?",
        k2Options: ["4 heures", "12 heures", "24 heures"],
        k2Why: "Les travailleurs peuvent retourner dans les champs traités 12 heures après l'application.",
        k3: "Veltrix peut-il être appliqué par voie aérienne?",
        k3Why: "Oui. L'étiquette permet l'application aérienne dans au moins 20 L/ha d'eau.",
        k4: "Pour quelles cultures Halden est-il homologué?",
        k4Desc: "Choisissez toutes les réponses qui s'appliquent.",
        k4Options: ["Blé", "Orge", "Canola", "Soya"],
        k4Why: "Halden est un fongicide pour céréales : blé et orge seulement.",
        k5: "Combien d'applications de Corvana sont permises par saison?",
        k5Options: ["1", "2", "3", "4"],
        k5Why: "Deux par saison, à au moins 14 jours d'intervalle, pour gérer la résistance.",
        k6: "À quel point êtes-vous à l'aise de recommander la gamme 2027?",
        k6Desc: "Non noté. Cela nous aide à planifier la formation.",
        k6Min: "Pas à l'aise",
        k6Max: "Très à l'aise",
    },
};

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${String.fromCharCode(97 + i)}`);
const opts = (prefix: string, labels: string[]) => ids(prefix, labels.length).map((id, i) => ({ id, label: labels[i] }));

export const FUNGICIDE_QUIZ_ID = "quiz-fungicides-2027";

/** Pays 250 points on a pass (80%, so 4 of 5). Answers are revealed at the end unless `quiz.reveal` says otherwise. */
export const getFungicideQuiz = (locale: SurveyLocale = "en", overrides: Partial<Survey> = {}, quiz: Partial<QuizSettings> = {}): Survey => {
    const t = text[locale];
    return {
        id: FUNGICIDE_QUIZ_ID,
        kind: "quiz",
        quiz: { passMark: 80, rewardRule: "pass", reveal: "at_end", ...quiz },
        programId: "advisor-advantage",
        title: t.title,
        status: "live",
        locale,
        anonymity: "identified",
        opensAt: "2026-11-16T09:00:00-05:00",
        closesAt: "2026-12-04T23:59:00-05:00",
        timezone: "America/Toronto",
        reward: { type: "points", amount: 250 },
        intro: { title: t.introTitle, body: t.introBody },
        thankYou: {
            title: t.thanksTitle,
            body: t.thanksBody,
            primaryAction: { label: t.backToDashboard, destination: "dashboard" },
            secondaryAction: { label: t.browseRewards, destination: "rewards" },
        },
        card: { enabled: true, headline: t.title, body: t.cardBody },
        enabledLocales: ["en", "fr"],
        emails: { inviteAtOpen: true, reminder: true, reminderDaysBeforeClose: 3 },
        questions: [
            { id: "k1", type: "multiple_choice", title: t.k1, required: true, options: opts("k1", t.k1Options), correct: ["k1-b"], explanation: t.k1Why },
            { id: "k2", type: "multiple_choice", title: t.k2, required: true, options: opts("k2", t.k2Options), correct: ["k2-b"], explanation: t.k2Why },
            { id: "k3", type: "yes_no", title: t.k3, required: true, correct: ["yes"], explanation: t.k3Why },
            {
                id: "k4",
                type: "multiple_choice",
                title: t.k4,
                description: t.k4Desc,
                required: true,
                multiple: true,
                options: opts("k4", t.k4Options),
                correct: ["k4-a", "k4-b"],
                explanation: t.k4Why,
            },
            { id: "k5", type: "dropdown", title: t.k5, required: true, options: opts("k5", t.k5Options), correct: ["k5-b"], explanation: t.k5Why },
            {
                id: "k6",
                type: "opinion_scale",
                title: t.k6,
                description: t.k6Desc,
                required: false,
                min: 1,
                max: 5,
                minLabel: t.k6Min,
                maxLabel: t.k6Max,
            },
        ],
        ...overrides,
    };
};

/** Answer sets: all right, 4 of 5 (passes at 80%), and 3 of 5 (doesn't). */
export const QUIZ_ANSWERS: Record<"perfect" | "pass" | "fail", SurveyAnswers> = {
    perfect: { k1: { selected: ["k1-b"] }, k2: { selected: ["k2-b"] }, k3: "yes", k4: { selected: ["k4-a", "k4-b"] }, k5: "k5-b", k6: 4 },
    // Picks canola as well, so the multi-select is wrong.
    pass: { k1: { selected: ["k1-b"] }, k2: { selected: ["k2-b"] }, k3: "yes", k4: { selected: ["k4-a", "k4-b", "k4-c"] }, k5: "k5-b", k6: 3 },
    fail: { k1: { selected: ["k1-a"] }, k2: { selected: ["k2-b"] }, k3: "no", k4: { selected: ["k4-a", "k4-b"] }, k5: "k5-b", k6: 2 },
};

export const quizNotStarted = (locale: SurveyLocale = "en"): SurveyResponse => ({
    surveyId: FUNGICIDE_QUIZ_ID,
    status: "not_started",
    locale,
    answers: {},
    history: [],
});

/** Answered the first two. Resumes at Q3. */
export const quizInProgress = (locale: SurveyLocale = "en"): SurveyResponse => ({
    surveyId: FUNGICIDE_QUIZ_ID,
    status: "in_progress",
    locale,
    answers: { k1: QUIZ_ANSWERS.pass.k1, k2: QUIZ_ANSWERS.pass.k2 },
    history: ["k1", "k2"],
    startedAt: "2026-11-19T10:12:00-05:00",
});
