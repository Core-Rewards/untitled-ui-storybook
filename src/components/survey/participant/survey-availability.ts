import type { Survey, SurveyResponse } from "../survey-types";

export type SurveyAvailability = "open" | "not_open" | "closed" | "completed";

/** Hours after close that someone who started in time can still submit. Proposed in the plan; confirm before launch. */
export const DEFAULT_GRACE_PERIOD_HOURS = 24;

/** Whether this participant can take the survey right now, and if not, why. */
export const getSurveyAvailability = (
    survey: Survey,
    response: SurveyResponse | undefined,
    now: Date = new Date(),
    gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS,
): SurveyAvailability => {
    if (response?.status === "complete") return "completed";
    const t = now.getTime();
    if (survey.status === "draft" || survey.status === "scheduled" || t < new Date(survey.opensAt).getTime()) return "not_open";

    const closesAt = new Date(survey.closesAt).getTime();
    const started = response?.status === "in_progress" && !!response.startedAt && new Date(response.startedAt).getTime() <= closesAt;
    const graceEnds = closesAt + gracePeriodHours * 60 * 60 * 1000;
    if (survey.status === "archived" || t > (started ? graceEnds : closesAt)) return "closed";
    if (survey.status === "closed" && !started) return "closed";
    return "open";
};
