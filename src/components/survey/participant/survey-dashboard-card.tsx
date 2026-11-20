import { Calendar, CalendarDate, Clock, ClockStopwatch, List } from "@untitledui/icons";
import { ActionCard } from "@/components/base/action-card/action-card";
import type { ActionCardMeta } from "@/components/base/action-card/action-card";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { useSurveyCopy } from "../survey-context";
import { formatSurveyDate } from "../survey-copy";
import { countAnswerable, estimateMinutes, getResumePoint } from "../survey-logic";
import type { Survey, SurveyResponse } from "../survey-types";
import { RewardBadge } from "./reward-badge";
import { getSurveyAvailability } from "./survey-availability";

export interface SurveyDashboardCardProps {
    survey: Survey;
    response?: SurveyResponse;
    /** Start or resume. The player resumes at the next unanswered question. */
    onOpen: (mode: "start" | "resume") => void;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
    className?: string;
}

/**
 * The survey's card on the participant dashboard: Start, Resume · 3 of 5, or
 * Completed · +500 points. Built on the shared ActionCard.
 */
export const SurveyDashboardCard = (props: SurveyDashboardCardProps) => (
    <SurveyLocaleProvider locale={props.survey.locale}>
        <SurveyDashboardCardInner {...props} />
    </SurveyLocaleProvider>
);

const SurveyDashboardCardInner = ({ survey, response, onOpen, now, className }: SurveyDashboardCardProps) => {
    const { copy, locale } = useSurveyCopy();
    const availability = getSurveyAvailability(survey, response, now);
    const total = countAnswerable(survey.questions);
    const closes = formatSurveyDate(survey.closesAt, locale, survey.timezone);
    // Footer facts: time, question count and the close date.
    const meta: ActionCardMeta[] = [
        { label: copy.minutes(estimateMinutes(survey.questions)), icon: Clock },
        { label: copy.questions(total), icon: List },
        { label: copy.closes(closes), icon: Calendar },
    ];
    const shared = {
        title: survey.card.headline,
        description: survey.card.body,
        badge: survey.reward && availability !== "completed" ? <RewardBadge reward={survey.reward} /> : undefined,
        className,
    };

    if (availability === "completed") {
        return <ActionCard {...shared} eyebrow={copy.surveyCompleted} status="completed" statusLine={copy.completedWith(survey.reward)} />;
    }
    if (availability === "not_open") {
        const opens = formatSurveyDate(survey.opensAt, locale, survey.timezone);
        return (
            <ActionCard
                {...shared}
                eyebrow={copy.newSurvey}
                status="upcoming"
                meta={meta.slice(0, 2)}
                statusLine={copy.opens(opens)}
                statusIcon={CalendarDate}
            />
        );
    }
    if (availability === "closed") {
        return <ActionCard {...shared} eyebrow={copy.newSurvey} status="closed" statusLine={copy.closedBody(closes)} statusIcon={ClockStopwatch} />;
    }

    if (response?.status === "in_progress") {
        const resume = getResumePoint(survey, response.answers);
        const answerable = survey.questions.filter((q) => q.type !== "statement");
        const done = answerable.filter((q) => resume.history.includes(q.id)).length;
        const current = Math.min(total, done + 1);
        return (
            <ActionCard
                {...shared}
                eyebrow={copy.surveyInProgress}
                status="in_progress"
                meta={meta}
                progress={{ current: done, total, label: copy.progressLabel }}
                action={{ label: copy.resumeAt(current, total), onPress: () => onOpen("resume") }}
            />
        );
    }

    return <ActionCard {...shared} eyebrow={copy.newSurvey} status="new" meta={meta} action={{ label: copy.start, onPress: () => onOpen("start") }} />;
};
