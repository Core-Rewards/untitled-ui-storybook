import type { SurveyCopy } from "../survey-copy";
import type { Survey, SurveyResponse } from "../survey-types";
import { getSurveyAvailability } from "./survey-availability";

/** A survey or quiz in front of one participant, with their progress if any. */
export interface ActivityItem {
    survey: Survey;
    response?: SurveyResponse;
}

export type ActivityStatus = "in_progress" | "available" | "upcoming" | "completed" | "missed";

export const kindOf = (survey: Survey) => survey.kind ?? "survey";

export const activityStatus = ({ survey, response }: ActivityItem, now: Date): ActivityStatus => {
    const availability = getSurveyAvailability(survey, response, now);
    if (availability === "completed") return "completed";
    if (availability === "not_open") return "upcoming";
    if (availability === "closed") return "missed";
    return response?.status === "in_progress" ? "in_progress" : "available";
};

const time = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

/** Started first, then closing soonest, then the bigger reward. */
export const sortAvailable = (items: ActivityItem[], now: Date) =>
    [...items].sort((a, b) => {
        const started = Number(activityStatus(b, now) === "in_progress") - Number(activityStatus(a, now) === "in_progress");
        if (started) return started;
        const closes = time(a.survey.closesAt) - time(b.survey.closesAt);
        if (closes) return closes;
        return (b.survey.reward?.amount ?? 0) - (a.survey.reward?.amount ?? 0);
    });

/** Groups for the Surveys & quizzes page. Missed items (closed before you finished) aren't shown. */
export const groupActivities = (items: ActivityItem[], now: Date) => {
    const by = (s: ActivityStatus[]) => items.filter((i) => s.includes(activityStatus(i, now)));
    return {
        available: sortAvailable(by(["in_progress", "available"]), now),
        upcoming: by(["upcoming"]).sort((a, b) => time(a.survey.opensAt) - time(b.survey.opensAt)),
        completed: by(["completed"]).sort((a, b) => time(b.response?.submittedAt) - time(a.response?.submittedAt)),
    };
};

/** How long a completed item keeps its "Completed · +500 points" card on the dashboard. */
export const COMPLETED_CARD_DAYS = 3;

/**
 * What the dashboard shows: one featured card (the most relevant item) and up to
 * two more as compact rows, plus the total for "View all". With nothing to take,
 * a just-completed item, then the next upcoming one, takes the featured spot.
 */
export const pickForDashboard = (items: ActivityItem[], now: Date, maxRows = 2) => {
    const { available, upcoming, completed } = groupActivities(items, now);
    const recent = completed.filter((i) => now.getTime() - time(i.response?.submittedAt) < COMPLETED_CARD_DAYS * 86_400_000);
    const [featured, ...rest] = available.length ? available : recent.length ? recent : upcoming;
    return { featured, others: available.length ? rest.slice(0, maxRows) : [], totalAvailable: available.length };
};

/** "Earn 500 points", or for quizzes "Pass to earn 250 points" / "Earn up to 500 points". */
export const rewardText = (survey: Survey, copy: SurveyCopy) => {
    if (!survey.reward) return undefined;
    return kindOf(survey) === "quiz" && survey.quiz ? copy.earnQuiz(survey.reward, survey.quiz.rewardRule) : copy.earn(survey.reward);
};
