import type { QuizRewardRule, SurveyLocale, SurveyReward } from "./survey-types";

/** Fixed UI strings for the participant flow, in English and French. Survey content comes from the survey itself. */
export interface SurveyCopy {
    start: string;
    resume: string;
    next: string;
    ok: string;
    submit: string;
    back: string;
    close: string;
    saveAndExit: string;
    previousQuestion: string;
    nextQuestion: string;
    questionLabel: (n: number) => string;
    position: (current: number, total: number) => string;
    progressLabel: string;
    minutes: (n: number) => string;
    questions: (n: number) => string;
    savesAsYouGo: string;
    closes: (date: string) => string;
    opens: (date: string) => string;
    anonymousTitle: string;
    anonymousBody: string;
    identifiedTitle: string;
    identifiedBody: string;
    earn: (reward: SurveyReward) => string;
    rewardAdded: (reward: SurveyReward) => string;
    rewardDestination: (reward: SurveyReward) => string;
    newSurvey: string;
    surveyInProgress: string;
    surveyCompleted: string;
    resumeAt: (current: number, total: number) => string;
    completedWith: (reward?: SurveyReward) => string;
    notOpenTitle: (date: string) => string;
    notOpenBody: string;
    closedTitle: string;
    closedBody: (date: string) => string;
    alreadyDoneTitle: string;
    alreadyDoneBody: (reward?: SurveyReward) => string;
    backToDashboard: string;
    // Hints and validation
    pressEnter: string;
    orPressEnter: string;
    typeLetters: (last: string) => string;
    typeNumber: string;
    tapToContinue: string;
    required: string;
    pickAtLeast: (n: number) => string;
    pickAtMost: (n: number) => string;
    otherLabel: string;
    otherPlaceholder: string;
    typeYourAnswer: string;
    charactersLeft: (n: number) => string;
    numberBetween: (min?: number, max?: number) => string;
    invalidNumber: string;
    chooseOption: string;
    searchOptions: string;
    yes: string;
    no: string;
    ratingLabel: (n: number, scale: number) => string;
    rankHint: string;
    moveUp: (label: string) => string;
    moveDown: (label: string) => string;
    rowPosition: (current: number, total: number) => string;
    dropFiles: string;
    browseFiles: string;
    fileLimits: (types: string, maxMb: number) => string;
    removeFile: (name: string) => string;
    fileTooBig: (name: string, maxMb: number) => string;
    fileWrongType: (name: string) => string;
    tooManyFiles: (n: number) => string;
    selected: string;
    submitting: string;
    submitError: string;
    programHome: (name: string) => string;
    // Quizzes
    newQuiz: string;
    quizInProgress: string;
    quizCompleted: string;
    /** "Pass to earn 250 points" / "Earn up to 500 points". */
    earnQuiz: (reward: SurveyReward, rule: QuizRewardRule) => string;
    /** "Scored 9 of 10 · Passed". */
    scoreLine: (correct: number, total: number, passed: boolean) => string;
    earned: (reward: SurveyReward) => string;
    noRewardEarned: string;
    // Taking a quiz
    quizProgressLabel: string;
    passMark: (percent: number) => string;
    oneTry: string;
    quizPrivacyTitle: string;
    quizPrivacyBody: string;
    checkAnswer: string;
    correct: string;
    notQuite: string;
    /** "The correct answer is 12 hours." / "The correct answers are Wheat and Barley." */
    correctAnswerIs: (labels: string[]) => string;
    yourAnswer: string;
    correctAnswer: string;
    notAnswered: string;
    // Quiz results
    youScored: (correct: number, total: number) => string;
    passed: string;
    notPassed: string;
    /** Pass rule, not passed: "You needed 80% to earn 250 points." */
    neededToEarn: (percent: number, reward: SurveyReward) => string;
    /** Tiered, no tier reached: "Score 60% or more to earn a reward." */
    tierNotReached: (percent: number) => string;
    reviewTitle: string;
    reviewIntro: (correct: number, total: number) => string;
    answersHidden: string;
    // Quiz edge states
    quizNotOpenBody: string;
    quizClosedTitle: string;
    quizClosedBody: (date: string) => string;
    quizAlreadyDoneTitle: string;
    quizAlreadyDoneBody: string;
    // Surveys & quizzes page
    hubTitle: string;
    hubIntro: string;
    tabAvailable: string;
    tabUpcoming: string;
    tabCompleted: string;
    filterAll: string;
    filterSurveys: string;
    filterQuizzes: string;
    kindSurvey: string;
    kindQuiz: string;
    completedOn: (date: string) => string;
    emptyAvailable: string;
    emptyUpcoming: string;
    emptyCompleted: string;
    emptyFilter: (kind: string) => string;
    moreToDo: string;
    viewAll: (n: number) => string;
    // Compact dashboard summary
    /** "1 survey and 2 quizzes available". */
    availableSummary: (surveys: number, quizzes: number) => string;
    inProgressCount: (n: number) => string;
    closesSoonest: (date: string) => string;
    earnUpTo: (amount: number) => string;
    nextOpens: (date: string) => string;
    nothingOpenYet: string;
    viewAllShort: string;
}

const nf = (locale: SurveyLocale) => new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-US");

const rewardNoun = (reward: SurveyReward, locale: SurveyLocale) => {
    const one = reward.amount === 1;
    if (locale === "fr") {
        if (reward.type === "points") return one ? "point" : "points";
        if (reward.type === "sweepstakes") return one ? "participation au tirage" : "participations au tirage";
        return one ? "tour d'arcade" : "tours d'arcade";
    }
    if (reward.type === "points") return one ? "point" : "points";
    if (reward.type === "sweepstakes") return one ? "sweepstakes entry" : "sweepstakes entries";
    return one ? "arcade spin" : "arcade spins";
};

const en: SurveyCopy = {
    start: "Start",
    resume: "Resume",
    next: "Next",
    ok: "OK",
    submit: "Submit",
    back: "Previous question",
    close: "Close",
    saveAndExit: "Save and exit",
    previousQuestion: "Previous question",
    nextQuestion: "Next question",
    questionLabel: (n) => `Question ${n}`,
    position: (c, t) => `${c} of ${t}`,
    progressLabel: "Survey progress",
    minutes: (n) => `About ${n} min`,
    questions: (n) => `${n} ${n === 1 ? "question" : "questions"}`,
    savesAsYouGo: "Saves as you go",
    closes: (d) => `Closes ${d}`,
    opens: (d) => `Opens ${d}`,
    anonymousTitle: "Your answers are anonymous.",
    anonymousBody: "We only record that you finished, so we can add your reward.",
    identifiedTitle: "Your answers are linked to your account.",
    identifiedBody: "The program team can see who gave each answer.",
    earn: (r) => `Earn ${nf("en").format(r.amount)} ${rewardNoun(r, "en")}`,
    rewardAdded: (r) => `+${nf("en").format(r.amount)} ${rewardNoun(r, "en")}`,
    rewardDestination: (r) => (r.type === "arcade_spins" ? "ready in the Rewards Arcade" : "added to your account"),
    newSurvey: "New survey",
    surveyInProgress: "Survey in progress",
    surveyCompleted: "Survey completed",
    resumeAt: (c, t) => `Resume · ${c} of ${t}`,
    completedWith: (r) => (r ? `Completed · +${nf("en").format(r.amount)} ${rewardNoun(r, "en")}` : "Completed"),
    notOpenTitle: (d) => `Opens ${d}`,
    notOpenBody: "Check back then to share your feedback.",
    closedTitle: "This survey has closed",
    closedBody: (d) => `This survey closed on ${d}. Thanks for your interest.`,
    alreadyDoneTitle: "You've already completed this survey",
    alreadyDoneBody: (r) =>
        r ? `Thanks again. Your ${nf("en").format(r.amount)} ${rewardNoun(r, "en")} were added when you finished.` : "Thanks again for your feedback.",
    backToDashboard: "Back to dashboard",
    pressEnter: "press Enter ↵",
    orPressEnter: "or press Enter ↵",
    typeLetters: (last) => `or type A to ${last} to pick`,
    typeNumber: "or type a number",
    tapToContinue: "Tap a number to continue",
    required: "Please answer this question to continue.",
    pickAtLeast: (n) => `Choose at least ${n}.`,
    pickAtMost: (n) => `Choose up to ${n}.`,
    otherLabel: "Other",
    otherPlaceholder: "Type your answer",
    typeYourAnswer: "Type your answer here",
    charactersLeft: (n) => `${n} ${n === 1 ? "character" : "characters"} left`,
    numberBetween: (min, max) =>
        min !== undefined && max !== undefined
            ? `Enter a number from ${min} to ${max}.`
            : min !== undefined
              ? `Enter ${min} or more.`
              : `Enter ${max} or less.`,
    invalidNumber: "Enter a number.",
    chooseOption: "Choose an option",
    searchOptions: "Search or choose",
    yes: "Yes",
    no: "No",
    ratingLabel: (n, s) => `${n} out of ${s}`,
    rankHint: "Drag to reorder, or use the arrows. Top is most important.",
    moveUp: (l) => `Move ${l} up`,
    moveDown: (l) => `Move ${l} down`,
    rowPosition: (c, t) => `${c} of ${t}`,
    dropFiles: "Drag files here",
    browseFiles: "Choose files",
    fileLimits: (types, mb) => `${types} up to ${mb} MB`,
    removeFile: (n) => `Remove ${n}`,
    fileTooBig: (n, mb) => `${n} is larger than ${mb} MB.`,
    fileWrongType: (n) => `${n} isn't a supported file type.`,
    tooManyFiles: (n) => `You can add up to ${n} ${n === 1 ? "file" : "files"}.`,
    selected: "Selected",
    submitting: "Submitting…",
    submitError: "We couldn't submit your answers. Your answers are saved, so please try again.",
    programHome: (name) => `${name} home`,
    newQuiz: "New quiz",
    quizInProgress: "Quiz in progress",
    quizCompleted: "Quiz completed",
    earnQuiz: (r, rule) =>
        rule === "pass"
            ? `Pass to earn ${nf("en").format(r.amount)} ${rewardNoun(r, "en")}`
            : rule === "tiered"
              ? `Earn up to ${nf("en").format(r.amount)} ${rewardNoun(r, "en")}`
              : en.earn(r),
    scoreLine: (c, t, passed) => `Scored ${c} of ${t} · ${passed ? "Passed" : "Not passed"}`,
    earned: (r) => `+${nf("en").format(r.amount)} ${rewardNoun(r, "en")}`,
    noRewardEarned: "No reward earned",
    quizProgressLabel: "Quiz progress",
    passMark: (p) => `Pass mark ${p}%`,
    oneTry: "One try",
    quizPrivacyTitle: "Your score is linked to your account.",
    quizPrivacyBody: "The program team can see your answers and your score.",
    checkAnswer: "Check answer",
    correct: "Correct",
    notQuite: "Not quite",
    correctAnswerIs: (labels) =>
        labels.length > 1
            ? `The correct answers are ${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}.`
            : `The correct answer is ${labels[0] ?? ""}.`,
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    notAnswered: "Not answered",
    youScored: (c, t) => `You scored ${c} of ${t}`,
    passed: "Passed",
    notPassed: "Not passed",
    neededToEarn: (p, r) => `You needed ${p}% to earn ${nf("en").format(r.amount)} ${rewardNoun(r, "en")}.`,
    tierNotReached: (p) => `Score ${p}% or more to earn a reward.`,
    reviewTitle: "Your answers",
    reviewIntro: (c, t) => `${c} of ${t} correct. Questions that weren't scored aren't listed.`,
    answersHidden: "The answers to this quiz aren't shared, so others can take it fairly.",
    quizNotOpenBody: "Check back then to take the quiz.",
    quizClosedTitle: "This quiz has closed",
    quizClosedBody: (d) => `This quiz closed on ${d}. Thanks for your interest.`,
    quizAlreadyDoneTitle: "You've already taken this quiz",
    quizAlreadyDoneBody: "Quizzes can only be taken once.",
    hubTitle: "Surveys & quizzes",
    hubIntro: "Share your feedback and test what you know. Rewards are added the moment you finish.",
    tabAvailable: "Available",
    tabUpcoming: "Upcoming",
    tabCompleted: "Completed",
    filterAll: "All",
    filterSurveys: "Surveys",
    filterQuizzes: "Quizzes",
    kindSurvey: "Survey",
    kindQuiz: "Quiz",
    completedOn: (d) => `Completed ${d}`,
    emptyAvailable: "Nothing to take right now. New surveys and quizzes show up here.",
    emptyUpcoming: "Nothing scheduled yet.",
    emptyCompleted: "You haven't finished any yet.",
    emptyFilter: (k) => `No ${k.toLowerCase()} here.`,
    moreToDo: "More to do",
    viewAll: (n) => `View all ${n}`,
    availableSummary: (s, q) => {
        const parts = [s && `${s} ${s === 1 ? "survey" : "surveys"}`, q && `${q} ${q === 1 ? "quiz" : "quizzes"}`].filter(Boolean);
        return `${parts.join(" and ")} available`;
    },
    inProgressCount: (n) => `${n} in progress`,
    closesSoonest: (d) => `Next closes ${d}`,
    earnUpTo: (n) => `Earn up to ${nf("en").format(n)} points`,
    nextOpens: (d) => `Next one opens ${d}`,
    nothingOpenYet: "Nothing to take right now",
    viewAllShort: "View all",
};

const fr: SurveyCopy = {
    start: "Commencer",
    resume: "Reprendre",
    next: "Suivant",
    ok: "OK",
    submit: "Envoyer",
    back: "Question précédente",
    close: "Fermer",
    saveAndExit: "Enregistrer et quitter",
    previousQuestion: "Question précédente",
    nextQuestion: "Question suivante",
    questionLabel: (n) => `Question ${n}`,
    position: (c, t) => `${c} sur ${t}`,
    progressLabel: "Progression du sondage",
    minutes: (n) => `Environ ${n} min`,
    questions: (n) => `${n} ${n === 1 ? "question" : "questions"}`,
    savesAsYouGo: "Enregistrement automatique",
    closes: (d) => `Prend fin le ${d}`,
    opens: (d) => `Ouvre le ${d}`,
    anonymousTitle: "Vos réponses sont anonymes.",
    anonymousBody: "Nous notons seulement que vous avez terminé, afin d'ajouter votre récompense.",
    identifiedTitle: "Vos réponses sont liées à votre compte.",
    identifiedBody: "L'équipe du programme peut voir qui a donné chaque réponse.",
    earn: (r) => `Gagnez ${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}`,
    rewardAdded: (r) => `+${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}`,
    rewardDestination: (r) => (r.type === "arcade_spins" ? "prêts dans l'Arcade Récompenses" : "ajoutés à votre compte"),
    newSurvey: "Nouveau sondage",
    surveyInProgress: "Sondage en cours",
    surveyCompleted: "Sondage terminé",
    resumeAt: (c, t) => `Reprendre · ${c} sur ${t}`,
    completedWith: (r) => (r ? `Terminé · +${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}` : "Terminé"),
    notOpenTitle: (d) => `Ouvre le ${d}`,
    notOpenBody: "Revenez à cette date pour donner votre avis.",
    closedTitle: "Ce sondage est terminé",
    closedBody: (d) => `Ce sondage a pris fin le ${d}. Merci de votre intérêt.`,
    alreadyDoneTitle: "Vous avez déjà répondu à ce sondage",
    alreadyDoneBody: (r) =>
        r ? `Merci encore. Vos ${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")} ont été ajoutés à la fin du sondage.` : "Merci encore de votre avis.",
    backToDashboard: "Retour au tableau de bord",
    pressEnter: "appuyez sur Entrée ↵",
    orPressEnter: "ou appuyez sur Entrée ↵",
    typeLetters: (last) => `ou tapez A à ${last} pour choisir`,
    typeNumber: "ou tapez un chiffre",
    tapToContinue: "Touchez un chiffre pour continuer",
    required: "Veuillez répondre à cette question pour continuer.",
    pickAtLeast: (n) => `Choisissez-en au moins ${n}.`,
    pickAtMost: (n) => `Choisissez-en jusqu'à ${n}.`,
    otherLabel: "Autre",
    otherPlaceholder: "Tapez votre réponse",
    typeYourAnswer: "Tapez votre réponse ici",
    charactersLeft: (n) => `${n} ${n === 1 ? "caractère restant" : "caractères restants"}`,
    numberBetween: (min, max) =>
        min !== undefined && max !== undefined
            ? `Entrez un nombre de ${min} à ${max}.`
            : min !== undefined
              ? `Entrez ${min} ou plus.`
              : `Entrez ${max} ou moins.`,
    invalidNumber: "Entrez un nombre.",
    chooseOption: "Choisissez une option",
    searchOptions: "Rechercher ou choisir",
    yes: "Oui",
    no: "Non",
    ratingLabel: (n, s) => `${n} sur ${s}`,
    rankHint: "Faites glisser pour réordonner, ou utilisez les flèches. Le plus important en haut.",
    moveUp: (l) => `Monter ${l}`,
    moveDown: (l) => `Descendre ${l}`,
    rowPosition: (c, t) => `${c} sur ${t}`,
    dropFiles: "Glissez vos fichiers ici",
    browseFiles: "Choisir des fichiers",
    fileLimits: (types, mb) => `${types} jusqu'à ${mb} Mo`,
    removeFile: (n) => `Retirer ${n}`,
    fileTooBig: (n, mb) => `${n} dépasse ${mb} Mo.`,
    fileWrongType: (n) => `${n} n'est pas un type de fichier accepté.`,
    tooManyFiles: (n) => `Vous pouvez ajouter jusqu'à ${n} ${n === 1 ? "fichier" : "fichiers"}.`,
    selected: "Sélectionné",
    submitting: "Envoi…",
    submitError: "Nous n'avons pas pu envoyer vos réponses. Elles sont enregistrées, veuillez réessayer.",
    programHome: (name) => `Accueil ${name}`,
    newQuiz: "Nouveau quiz",
    quizInProgress: "Quiz en cours",
    quizCompleted: "Quiz terminé",
    earnQuiz: (r, rule) =>
        rule === "pass"
            ? `Réussissez pour gagner ${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}`
            : rule === "tiered"
              ? `Gagnez jusqu'à ${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}`
              : fr.earn(r),
    scoreLine: (c, t, passed) => `Résultat ${c} sur ${t} · ${passed ? "Réussi" : "Non réussi"}`,
    earned: (r) => `+${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}`,
    noRewardEarned: "Aucune récompense",
    quizProgressLabel: "Progression du quiz",
    passMark: (p) => `Note de passage ${p} %`,
    oneTry: "Un seul essai",
    quizPrivacyTitle: "Votre résultat est lié à votre compte.",
    quizPrivacyBody: "L'équipe du programme peut voir vos réponses et votre résultat.",
    checkAnswer: "Vérifier",
    correct: "Bonne réponse",
    notQuite: "Pas tout à fait",
    correctAnswerIs: (labels) =>
        labels.length > 1
            ? `Les bonnes réponses sont ${labels.slice(0, -1).join(", ")} et ${labels.at(-1)}.`
            : `La bonne réponse est ${labels[0] ?? ""}.`,
    yourAnswer: "Votre réponse",
    correctAnswer: "Bonne réponse",
    notAnswered: "Sans réponse",
    youScored: (c, t) => `Vous avez obtenu ${c} sur ${t}`,
    passed: "Réussi",
    notPassed: "Non réussi",
    neededToEarn: (p, r) => `Il fallait ${p} % pour gagner ${nf("fr").format(r.amount)} ${rewardNoun(r, "fr")}.`,
    tierNotReached: (p) => `Obtenez ${p} % ou plus pour gagner une récompense.`,
    reviewTitle: "Vos réponses",
    reviewIntro: (c, t) => `${c} bonnes réponses sur ${t}. Les questions non notées ne sont pas listées.`,
    answersHidden: "Les réponses de ce quiz ne sont pas partagées, pour que tous puissent le faire équitablement.",
    quizNotOpenBody: "Revenez à cette date pour faire le quiz.",
    quizClosedTitle: "Ce quiz est terminé",
    quizClosedBody: (d) => `Ce quiz a pris fin le ${d}. Merci de votre intérêt.`,
    quizAlreadyDoneTitle: "Vous avez déjà fait ce quiz",
    quizAlreadyDoneBody: "Un quiz ne peut être fait qu'une seule fois.",
    hubTitle: "Sondages et quiz",
    hubIntro: "Donnez votre avis et testez vos connaissances. Les récompenses sont ajoutées dès que vous terminez.",
    tabAvailable: "Disponibles",
    tabUpcoming: "À venir",
    tabCompleted: "Terminés",
    filterAll: "Tous",
    filterSurveys: "Sondages",
    filterQuizzes: "Quiz",
    kindSurvey: "Sondage",
    kindQuiz: "Quiz",
    completedOn: (d) => `Terminé le ${d}`,
    emptyAvailable: "Rien à faire pour le moment. Les nouveaux sondages et quiz apparaîtront ici.",
    emptyUpcoming: "Rien de prévu pour l'instant.",
    emptyCompleted: "Vous n'en avez pas encore terminé.",
    emptyFilter: (k) => `Aucun ${k.toLowerCase()} ici.`,
    moreToDo: "À faire aussi",
    viewAll: (n) => `Voir les ${n}`,
    availableSummary: (s, q) => {
        const parts = [s && `${s} ${s === 1 ? "sondage" : "sondages"}`, q && `${q} quiz`].filter(Boolean);
        return `${parts.join(" et ")} ${s + q === 1 ? "disponible" : "disponibles"}`;
    },
    inProgressCount: (n) => `${n} en cours`,
    closesSoonest: (d) => `Prochaine fin le ${d}`,
    earnUpTo: (n) => `Gagnez jusqu'à ${nf("fr").format(n)} points`,
    nextOpens: (d) => `Le prochain ouvre le ${d}`,
    nothingOpenYet: "Rien à faire pour le moment",
    viewAllShort: "Voir tout",
};

export const SURVEY_COPY: Record<SurveyLocale, SurveyCopy> = { en, fr };

/** Formats an ISO date as "Dec 15" / "15 déc.". */
export const formatSurveyDate = (iso: string, locale: SurveyLocale, timeZone?: string) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-US", {
        month: "short",
        day: "numeric",
        timeZone,
    }).format(new Date(iso));
