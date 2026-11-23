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
 * logic, reward and maximum cost, dates and anonymity. Errors block Publish and
 * each item links to the step that fixes it.
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
            detail: `${n} ${n === 1 ? "question" : "questions"}, about ${estimateMinutes(survey.questions)} min.${n > 10 ? " Long surveys get fewer completions." : ""}`,
            status: n > 10 ? "warning" : "ok",
            fixIn: "questions",
        });

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
    const qn = (id: string) => `Q${survey.questions.findIndex((q) => q.id === id) + 1}`;
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
    if (!survey.reward)
        items.push({ id: "reward", label: "Reward", detail: "No reward. Rewarded surveys usually get more responses.", status: "warning", fixIn: "reward" });
    else if (!survey.reward.amount || survey.reward.amount <= 0)
        items.push({ id: "reward", label: "Reward", detail: "Set an amount above 0.", status: "error", fixIn: "reward" });
    else {
        const unit = survey.reward.type === "points" ? "points" : survey.reward.type === "sweepstakes" ? "sweepstakes entries" : "arcade spins";
        items.push({
            id: "reward",
            label: "Reward",
            detail: `${survey.reward.amount.toLocaleString("en-US")} ${unit} each. Up to ${(survey.reward.amount * eligibleParticipants).toLocaleString("en-US")} ${unit} if all ${eligibleParticipants.toLocaleString("en-US")} participants finish.`,
            status: "ok",
            fixIn: "reward",
        });
    }

    // Dates
    const opens = new Date(survey.opensAt).getTime();
    const closes = new Date(survey.closesAt).getTime();
    if (!survey.opensAt || !survey.closesAt || Number.isNaN(opens) || Number.isNaN(closes))
        items.push({ id: "dates", label: "Dates", detail: "Set when the survey opens and closes.", status: "error", fixIn: "schedule" });
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
        detail:
            survey.anonymity === "anonymous"
                ? "Anonymous. Results never show who answered. Locks after the first response."
                : "Identified. Results show who gave each answer. Locks after the first response.",
        status: "ok",
        fixIn: "settings",
    });

    return items;
};

export const canPublish = (items: ChecklistItem[]) => items.every((i) => i.status !== "error");
