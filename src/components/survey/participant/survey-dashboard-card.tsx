import { ActionCard } from "@/components/base/action-card/action-card";
import { useSurveyCopy } from "../survey-context";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import type { Survey, SurveyResponse } from "../survey-types";
import { describeActivity } from "./activity-view";

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
 * A survey's or quiz's card on the participant dashboard: Start, Resume · 3 of 5,
 * Completed · +500 points, or a quiz score. Built on the shared ActionCard.
 */
export const SurveyDashboardCard = (props: SurveyDashboardCardProps) => (
    <SurveyLocaleProvider locale={props.survey.locale}>
        <SurveyDashboardCardInner {...props} />
    </SurveyLocaleProvider>
);

const SurveyDashboardCardInner = ({ survey, response, onOpen, now = new Date(), className }: SurveyDashboardCardProps) => {
    const { copy, locale } = useSurveyCopy();
    const view = describeActivity({ survey, response }, copy, locale, now, onOpen);
    return <ActionCard {...view} className={className} />;
};
