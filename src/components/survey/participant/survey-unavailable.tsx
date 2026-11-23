import { CalendarDate, CheckCircle, ClockStopwatch } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useSurveyCopy } from "../survey-context";
import { formatSurveyDate } from "../survey-copy";
import type { Survey, SurveyReward } from "../survey-types";
import type { SurveyAvailability } from "./survey-availability";
import { SurveyTakeover } from "./survey-takeover";

export interface SurveyUnavailableProps {
    survey: Survey;
    reason: Exclude<SurveyAvailability, "open">;
    /** For "completed": the reward they earned. */
    rewardEarned?: SurveyReward;
    onBack: () => void;
}

/** What a participant sees when a survey link isn't usable: not open yet, closed, or already done. */
export const SurveyUnavailable = ({ survey, reason, rewardEarned, onBack }: SurveyUnavailableProps) => {
    const { copy, locale } = useSurveyCopy();
    const opens = formatSurveyDate(survey.opensAt, locale, survey.timezone);
    const closed = formatSurveyDate(survey.closesAt, locale, survey.timezone);

    const content = {
        not_open: {
            Icon: CalendarDate,
            title: copy.notOpenTitle(opens),
            body: copy.notOpenBody,
            tone: "bg-secondary text-fg-secondary",
        },
        closed: {
            Icon: ClockStopwatch,
            title: copy.closedTitle,
            body: copy.closedBody(closed),
            tone: "bg-secondary text-fg-secondary",
        },
        completed: {
            Icon: CheckCircle,
            title: copy.alreadyDoneTitle,
            body: copy.alreadyDoneBody(rewardEarned ?? survey.reward),
            tone: "bg-success-secondary text-fg-success-primary",
        },
    }[reason];

    const back = (
        <Button size="xl" color="secondary" className="w-full @3xl/takeover:w-auto" onClick={onBack}>
            {copy.backToDashboard}
        </Button>
    );

    return (
        <SurveyTakeover surveyTitle={survey.title} onExit={onBack} exitKind="close" footer={back}>
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-5 pt-12 text-center @3xl/takeover:flex-none @3xl/takeover:pt-0">
                <span className={`flex size-16 items-center justify-center rounded-full ${content.tone}`}>
                    <content.Icon className="size-8" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-brand-secondary">{survey.title}</p>
                <h1 className="text-display-xs font-semibold text-primary">{content.title}</h1>
                <p className="text-lg text-tertiary">{content.body}</p>
                <div className="hidden pt-2 @3xl/takeover:block">{back}</div>
            </div>
        </SurveyTakeover>
    );
};
