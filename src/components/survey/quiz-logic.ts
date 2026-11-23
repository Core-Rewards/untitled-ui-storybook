import { getNextTarget, isChoiceAnswer, OTHER_OPTION_ID } from "./survey-logic";
import type {
    AnswerValue,
    QuizAnswerKey,
    QuizAnswerReveal,
    QuizScore,
    QuizSettings,
    Survey,
    SurveyAnswers,
    SurveyQuestion,
    SurveyQuestionType,
    SurveyReward,
} from "./survey-types";

/*
 * Quiz rules, shared by the player, builder, results and (as a reference) the
 * platform, which must grade on submit itself:
 *
 * - Only multiple choice, dropdown and yes / no can be scored. A question is scored
 *   when it has `correct` set; other questions in a quiz are collected, not scored.
 * - Multi-select is all or nothing: every correct option and no others.
 * - The total is the scored questions on the participant's path, so a question
 *   skipped by jump logic doesn't count against them. A scored question they
 *   left blank counts as wrong.
 * - Passing is `correct / total * 100 >= passMark`, unrounded.
 */

export const isQuiz = (survey: Pick<Survey, "kind">) => survey.kind === "quiz";

export const SCORABLE_TYPES: ReadonlySet<SurveyQuestionType> = new Set(["multiple_choice", "dropdown", "yes_no"]);

/** The type can have a right answer. */
export const canBeScored = (question: Pick<SurveyQuestion, "type">) => SCORABLE_TYPES.has(question.type);

/** The question counts toward the score (it may still be missing its answer while drafting). */
export const isScored = (question: SurveyQuestion) => canBeScored(question) && question.correct !== undefined;

export const scoredQuestions = (survey: Survey) => survey.questions.filter(isScored);

export const revealOf = (settings?: QuizSettings): QuizAnswerReveal => settings?.reveal ?? "at_end";

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = { passMark: 80, rewardRule: "completion", reveal: "at_end" };

/** The ids a participant picked, in a shape comparable with `correct`. "Other" never counts. */
export const pickedIds = (question: SurveyQuestion, value: AnswerValue | undefined): string[] => {
    if (value === undefined) return [];
    if (isChoiceAnswer(value)) return value.selected.filter((id) => id !== OTHER_OPTION_ID);
    if (typeof value === "string" && (question.type === "dropdown" || question.type === "yes_no")) return [value];
    return [];
};

/** Right, wrong, or undefined when the question isn't scored. Blank counts as wrong. */
export const isCorrect = (question: SurveyQuestion, value: AnswerValue | undefined): boolean | undefined => {
    if (!isScored(question)) return undefined;
    const correct = question.correct ?? [];
    const picked = pickedIds(question, value);
    if (!correct.length || picked.length !== correct.length) return false;
    return correct.every((id) => picked.includes(id));
};

/** Labels for the right answer(s), e.g. ["12 hours"]. Yes / No uses the question's own labels. */
export const correctLabels = (question: SurveyQuestion, yes = "Yes", no = "No"): string[] => {
    const ids = question.correct ?? [];
    if (question.type === "yes_no") return ids.map((id) => (id === "yes" ? (question.yesLabel ?? yes) : (question.noLabel ?? no)));
    if ("options" in question) return ids.map((id) => question.options.find((o) => o.id === id)?.label ?? id);
    return [];
};

/**
 * The questions a participant was shown, in order, following jump logic from the
 * first question to the end. Stops if logic loops (the builder prevents that).
 */
export const pathFor = (survey: Survey, answers: SurveyAnswers): string[] => {
    const path: string[] = [];
    const seen = new Set<string>();
    let current: string | undefined = survey.questions[0]?.id;
    while (current && current !== "end" && !seen.has(current)) {
        seen.add(current);
        path.push(current);
        current = getNextTarget(survey, current, answers);
    }
    return path;
};

/** The quiz with an answer key from the platform filled in, so the review can mark answers. */
export const withAnswerKey = (survey: Survey, key?: QuizAnswerKey): Survey =>
    key
        ? {
              ...survey,
              questions: survey.questions.map((q) =>
                  key[q.id] ? ({ ...q, correct: key[q.id].correct, explanation: key[q.id].explanation ?? q.explanation } as SurveyQuestion) : q,
              ),
          }
        : survey;

/** Grade a whole response. */
export const scoreQuiz = (survey: Survey, answers: SurveyAnswers): QuizScore => {
    const onPath = new Set(pathFor(survey, answers));
    const scored = survey.questions.filter((q) => isScored(q) && onPath.has(q.id));
    const correct = scored.filter((q) => isCorrect(q, answers[q.id])).length;
    const total = scored.length;
    return { correct, total, passed: total > 0 && meets(correct, total, survey.quiz?.passMark ?? DEFAULT_QUIZ_SETTINGS.passMark) };
};

/** True when the score reaches a percent threshold, without rounding. */
export const meets = (correct: number, total: number, minPercent: number) => total > 0 && correct * 100 >= minPercent * total;

/** Whole percent for display. Never rounds a fail up to the pass mark: 79.6% shows as 79%. */
export const scorePercent = ({ correct, total }: Pick<QuizScore, "correct" | "total">) => (total ? Math.floor((correct / total) * 100) : 0);

/** Tiers sorted best first, so the first match is the highest the score reaches. */
export const sortedTiers = (settings?: QuizSettings) => [...(settings?.tiers ?? [])].sort((a, b) => b.minScore - a.minScore);

/**
 * What a score pays under the quiz's reward rule: the full reward on completion,
 * the full reward only on a pass, or the highest tier reached. Undefined when
 * nothing is earned.
 */
export const quizRewardFor = (survey: Survey, score: QuizScore): SurveyReward | undefined => {
    const reward = survey.reward;
    if (!reward) return undefined;
    const rule = survey.quiz?.rewardRule ?? "completion";
    if (rule === "completion") return reward;
    if (rule === "pass") return score.passed ? reward : undefined;
    const tier = sortedTiers(survey.quiz).find((t) => meets(score.correct, score.total, t.minScore));
    return tier && tier.amount > 0 ? { type: reward.type, amount: tier.amount } : undefined;
};

/** The most one participant can earn, for cost estimates and "Earn up to". */
export const maxQuizReward = (survey: Survey): number => {
    if (!survey.reward) return 0;
    if (survey.quiz?.rewardRule === "tiered") return Math.max(0, ...(survey.quiz.tiers ?? []).map((t) => t.amount));
    return survey.reward.amount;
};

/** Problems with a quiz's scoring setup, for the builder and publish checklist. Empty when it's ready. */
export const quizSetupProblems = (survey: Survey): { unanswered: SurveyQuestion[]; noneScored: boolean; tierProblem?: string; passMarkProblem?: string } => {
    const scored = scoredQuestions(survey);
    const unanswered = scored.filter((q) => {
        const ids = q.correct ?? [];
        if (!ids.length) return true;
        if (q.type === "yes_no") return !ids.every((id) => id === "yes" || id === "no");
        // A correct id must still be one of the options (an option may have been deleted).
        return "options" in q && !ids.every((id) => q.options.some((o) => o.id === id));
    });
    const settings = survey.quiz ?? DEFAULT_QUIZ_SETTINGS;
    const passMarkProblem = settings.passMark < 0 || settings.passMark > 100 ? "The pass mark must be from 0 to 100%." : undefined;
    let tierProblem: string | undefined;
    if (survey.reward && settings.rewardRule === "tiered") {
        const tiers = settings.tiers ?? [];
        if (!tiers.length) tierProblem = "Add at least one reward tier.";
        else if (tiers.some((t) => t.minScore < 0 || t.minScore > 100)) tierProblem = "Tier scores must be from 0 to 100%.";
        else if (tiers.some((t) => !t.amount || t.amount <= 0)) tierProblem = "Every tier needs an amount above 0.";
        else if (new Set(tiers.map((t) => t.minScore)).size !== tiers.length) tierProblem = "Two tiers have the same score.";
    }
    return { unanswered, noneScored: scored.length === 0, tierProblem, passMarkProblem };
};
