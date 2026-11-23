import { CalendarDate, CheckCircle, ClockStopwatch } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useSurveyCopy } from "../survey-context";
import { formatSurveyDate } from "../survey-copy";
import { isQuiz } from "../quiz-logic";
import type { QuizScore, Survey, SurveyReward } from "../survey-types";
import type { SurveyAvailability } from "./survey-availability";
import { SurveyTakeover } from "./survey-takeover";

export interface SurveyUnavailableProps {
    survey: Survey;
    reason: Exclude<SurveyAvailability, "open">;
    /** For "completed": the reward they earned. */
    rewardEarned?: SurveyReward;
    /** Quizzes, for "completed": their score. */
    score?: QuizScore;
    onBack: () => void;
}

/** What a participant sees when a survey link isn't usable: not open yet, closed, or already done. */
export const SurveyUnavailable = ({ survey, reason, rewardEarned, score, onBack }: SurveyUnavailableProps) => {
    const { copy, locale } = useSurveyCopy();
    const opens = formatSurveyDate(survey.opensAt, locale, survey.timezone);
    const closed = formatSurveyDate(survey.closesAt, locale, survey.timezone);

    const quiz = isQuiz(survey);
    // Quizzes can't be retaken. Say how it went, and that it's one try only.
    const quizDone = [
        score && copy.scoreLine(score.correct, score.total, score.passed),
        rewardEarned ? copy.earned(rewardEarned) : survey.reward && score ? copy.noRewardEarned : undefined,
    ]
        .filter(Boolean)
        .join(" · ");

    const content = {
        not_open: {
            Icon: CalendarDate,
            title: copy.notOpenTitle(opens),
            body: quiz ? copy.quizNotOpenBody : copy.notOpenBody,
            tone: "bg-secondary text-fg-secondary",
        },
        closed: {
            Icon: ClockStopwatch,
            title: quiz ? copy.quizClosedTitle : copy.closedTitle,
            body: quiz ? copy.quizClosedBody(closed) : copy.closedBody(closed),
            tone: "bg-secondary text-fg-secondary",
        },
        completed: {
            Icon: CheckCircle,
            title: quiz ? copy.quizAlreadyDoneTitle : copy.alreadyDoneTitle,
            body: quiz ? [quizDone, copy.quizAlreadyDoneBody].filter(Boolean).join(". ") : copy.alreadyDoneBody(rewardEarned ?? survey.reward),
            // A quiz that wasn't passed is done, but not a success.
            tone: quiz && score && !score.passed ? "bg-secondary text-fg-secondary" : "bg-success-secondary text-fg-success-primary",
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
