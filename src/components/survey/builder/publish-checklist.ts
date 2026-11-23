import { DEFAULT_QUIZ_SETTINGS, isQuiz, maxQuizReward, quizSetupProblems, revealOf, scoredQuestions } from "../quiz-logic";
import { countAnswerable, estimateMinutes } from "../survey-logic";
import type { Survey } from "../survey-types";
import { LANGUAGE_NAMES, secondLocaleOf, translationProgress } from "./builder-model";
import type { Translations } from "./builder-model";
import { analyzeLogic } from "./logic-analysis";

export type ChecklistStatus = "ok" | "warning" | "error";
export type ChecklistTarget = "questions" | "french" | "settings" | "reward" | "schedule";

export interface ChecklistItem {
    id: string;
    label: string;
    detail: string;
    /** `error` blocks publishing; `warning` doesn't. */
    status: ChecklistStatus;
    /** The step that fixes it. */
    fixIn: ChecklistTarget;
}

const fmt = (iso: string, timeZone: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" }).format(
        new Date(iso),
    );

/**
 * The review checklist shown before publishing (A8): questions and time, languages,
 * logic, reward and maximum cost, dates and anonymity. Quizzes add Scoring (every
 * scored question has its right answer, a valid pass mark) and check reward tiers.
 * Errors block Publish and each item links to the step that fixes it.
 */
export const buildChecklist = (
    survey: Survey,
    translations: Translations,
    eligibleParticipants: number,
    now: Date = new Date(),
    /** AI-drafted strings no one has edited or approved yet. */
    unreviewedDrafts = 0,
): ChecklistItem[] => {
    const items: ChecklistItem[] = [];
    const n = countAnswerable(survey.questions);
    const quiz = isQuiz(survey);
    const noun = quiz ? "quiz" : "survey";
    const qn = (id: string) => `Q${survey.questions.findIndex((q) => q.id === id) + 1}`;

    // Questions
    const untitled = survey.questions.filter((q) => !q.title.trim()).length;
    const emptyOptions = survey.questions.filter((q) => "options" in q && q.options.some((o) => !o.label.trim())).length;
    if (n === 0) items.push({ id: "questions", label: "Questions", detail: "Add at least one question.", status: "error", fixIn: "questions" });
    else if (untitled || emptyOptions)
        items.push({
            id: "questions",
            label: "Questions",
            detail: [untitled && `${untitled} without text`, emptyOptions && `${emptyOptions} with empty answer options`].filter(Boolean).join(" and ") + ".",
            status: "error",
            fixIn: "questions",
        });
    else
        items.push({
            id: "questions",
            label: "Questions",
            detail: `${n} ${n === 1 ? "question" : "questions"}, about ${estimateMinutes(survey.questions)} min.${n > 10 ? ` Long ${noun === "quiz" ? "quizzes" : "surveys"} get fewer completions.` : ""}`,
            status: n > 10 ? "warning" : "ok",
            fixIn: "questions",
        });

    // Scoring (quizzes)
    const problems = quiz ? quizSetupProblems(survey) : undefined;
    if (quiz && problems) {
        const settings = survey.quiz ?? DEFAULT_QUIZ_SETTINGS;
        const scored = scoredQuestions(survey).length;
        const reveal = { at_end: "Answers shown at the end.", each_question: "Answers shown after each question.", never: "Only the score is shown." }[
            revealOf(settings)
        ];
        if (problems.noneScored)
            items.push({
                id: "scoring",
                label: "Scoring",
                detail: "No scored questions. Turn on Score this question for at least one question.",
                status: "error",
                fixIn: "questions",
            });
        else if (problems.unanswered.length)
            items.push({
                id: "scoring",
                label: "Scoring",
                detail: `${problems.unanswered.map((q) => qn(q.id)).join(", ")} ${problems.unanswered.length === 1 ? "needs" : "need"} a correct answer.`,
                status: "error",
                fixIn: "questions",
            });
        else if (problems.passMarkProblem) items.push({ id: "scoring", label: "Scoring", detail: problems.passMarkProblem, status: "error", fixIn: "settings" });
        else
            items.push({
                id: "scoring",
                label: "Scoring",
                detail: `${scored} scored ${scored === 1 ? "question" : "questions"}, pass mark ${settings.passMark}%. ${reveal}`,
                status: "ok",
                fixIn: "settings",
            });
    }

    // Languages
    // Only surveys offered in a second language need a translation.
    const second = secondLocaleOf(survey);
    if (second) {
        const name = LANGUAGE_NAMES[second];
        const fr = translationProgress(survey, translations);
        const missing = fr.total - fr.done;
        items.push({
            id: "languages",
            label: name,
            detail: missing
                ? `${missing} of ${fr.total} strings still need ${name}. Participants who read ${name} would see gaps.`
                : unreviewedDrafts
                  ? `All ${fr.total} strings have ${name}, but ${unreviewedDrafts} AI ${unreviewedDrafts === 1 ? "draft hasn't" : "drafts haven't"} been reviewed.`
                  : `All ${fr.total} strings translated.`,
            status: missing ? "error" : unreviewedDrafts ? "warning" : "ok",
            fixIn: "french",
        });
    }

    // Logic
    const logic = analyzeLogic(survey);
    if (logic.unreachable.length || logic.loops.length) {
        items.push({
            id: "logic",
            label: "Logic",
            detail: [
                logic.unreachable.length && `${logic.unreachable.map(qn).join(", ")} can't be reached`,
                logic.loops.length && `${logic.loops.map((l) => `${qn(l.from)} loops back to ${qn(l.to)}`).join(", ")}`,
            ]
                .filter(Boolean)
                .join("; ")
                .concat("."),
            status: "error",
            fixIn: "questions",
        });
    } else {
        const rules = survey.questions.reduce((s, q) => s + (q.logic?.length ?? 0), 0);
        items.push({
            id: "logic",
            label: "Logic",
            detail: rules ? `${rules} ${rules === 1 ? "rule" : "rules"}. Every question can be reached.` : "No jump logic. Everyone sees every question.",
            status: "ok",
            fixIn: "questions",
        });
    }

    // Reward
    const rule = quiz ? (survey.quiz?.rewardRule ?? "completion") : "completion";
    if (!survey.reward)
        items.push({
            id: "reward",
            label: "Reward",
            detail: `No reward. Rewarded ${quiz ? "quizzes" : "surveys"} usually get more responses.`,
            status: "warning",
            fixIn: "reward",
        });
    else if (problems?.tierProblem) items.push({ id: "reward", label: "Reward", detail: problems.tierProblem, status: "error", fixIn: "reward" });
    else if (rule !== "tiered" && (!survey.reward.amount || survey.reward.amount <= 0))
        items.push({ id: "reward", label: "Reward", detail: "Set an amount above 0.", status: "error", fixIn: "reward" });
    else {
        const unit = survey.reward.type === "points" ? "points" : survey.reward.type === "sweepstakes" ? "sweepstakes entries" : "arcade spins";
        const top = quiz ? maxQuizReward(survey) : survey.reward.amount;
        const max = (top * eligibleParticipants).toLocaleString("en-US");
        const everyone = eligibleParticipants.toLocaleString("en-US");
        const tiers = survey.quiz?.tiers?.length ?? 0;
        items.push({
            id: "reward",
            label: "Reward",
            detail:
                rule === "pass"
                    ? `${top.toLocaleString("en-US")} ${unit} for passing. Up to ${max} ${unit} if all ${everyone} participants pass.`
                    : rule === "tiered"
                      ? `Up to ${top.toLocaleString("en-US")} ${unit} each, in ${tiers} ${tiers === 1 ? "tier" : "tiers"} by score. Up to ${max} ${unit} if all ${everyone} participants score 100%.`
                      : `${top.toLocaleString("en-US")} ${unit} each. Up to ${max} ${unit} if all ${everyone} participants finish.`,
            status: "ok",
            fixIn: "reward",
        });
    }

    // Dates
    const opens = new Date(survey.opensAt).getTime();
    const closes = new Date(survey.closesAt).getTime();
    if (!survey.opensAt || !survey.closesAt || Number.isNaN(opens) || Number.isNaN(closes))
        items.push({ id: "dates", label: "Dates", detail: `Set when the ${noun} opens and closes.`, status: "error", fixIn: "schedule" });
    else if (closes <= opens)
        items.push({ id: "dates", label: "Dates", detail: "The close date must be after the open date.", status: "error", fixIn: "schedule" });
    else if (closes <= now.getTime())
        items.push({ id: "dates", label: "Dates", detail: "The close date has already passed.", status: "error", fixIn: "schedule" });
    else
        items.push({
            id: "dates",
            label: "Dates",
            detail: `${opens <= now.getTime() ? "Opens as soon as you publish" : `Opens ${fmt(survey.opensAt, survey.timezone)}`}, closes ${fmt(survey.closesAt, survey.timezone)}.`,
            status: "ok",
            fixIn: "schedule",
        });

    // Anonymity
    items.push({
        id: "anonymity",
        label: "Responses",
        detail: quiz
            ? "Identified. Results show each person's score and answers."
            : survey.anonymity === "anonymous"
              ? "Anonymous. Results never show who answered. Locks after the first response."
              : "Identified. Results show who gave each answer. Locks after the first response.",
        status: "ok",
        fixIn: "settings",
    });

    return items;
};

export const canPublish = (items: ChecklistItem[]) => items.every((i) => i.status !== "error");
