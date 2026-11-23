import { useEffect, useState } from "react";
import { BookOpen01, CheckCircle, Lock01, Trophy01, XCircle } from "@untitledui/icons";
import { useCountUp } from "@/components/base/app-shell/use-count-up";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { AnswerFeedback, GradedAnswer } from "../questions/graded-answer";
import { DEFAULT_QUIZ_SETTINGS, isScored, pathFor, revealOf, scorePercent, sortedTiers } from "../quiz-logic";
import { useSurveyCopy } from "../survey-context";
import type { QuizScore, Survey, SurveyAnswers, SurveyReward, ThankYouDestination } from "../survey-types";
import { rewardIcons } from "./reward-icons";
import { SurveyTakeover } from "./survey-takeover";

export interface QuizResultsProps {
    survey: Survey;
    /** The submitted answers, for the review. */
    answers: SurveyAnswers;
    score: QuizScore;
    /** What was actually paid. Omit when nothing was earned. */
    reward?: SurveyReward;
    onAction: (destination: ThankYouDestination, href?: string) => void;
}

/**
 * The quiz's thank-you: score, passed or not, the reward actually earned (or what
 * it would have taken), then a review of each scored answer with explanations,
 * unless the quiz keeps its answers private.
 */
export const QuizResults = ({ survey, answers, score, reward, onAction }: QuizResultsProps) => {
    const { copy, locale } = useSurveyCopy();
    const settings = survey.quiz ?? DEFAULT_QUIZ_SETTINGS;
    const percent = scorePercent(score);
    const reveal = revealOf(settings);
    const { thankYou } = survey;

    // Count the reward up from 0 after the first frame, like the survey thank-you.
    const [started, setStarted] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setStarted(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    const shown = useCountUp(started ? (reward?.amount ?? 0) : 0);
    const RewardIcon = reward ? rewardIcons[reward.type] : null;

    // Only the scored questions the participant actually saw.
    const onPath = new Set(pathFor(survey, answers));
    const reviewed = survey.questions.filter((q) => isScored(q) && onPath.has(q.id));

    const missedReward =
        !reward && survey.reward
            ? settings.rewardRule === "pass"
                ? copy.neededToEarn(settings.passMark, survey.reward)
                : settings.rewardRule === "tiered"
                  ? copy.tierNotReached(sortedTiers(settings).at(-1)?.minScore ?? settings.passMark)
                  : undefined
            : undefined;

    const actions = (
        <div className="flex w-full flex-col items-stretch gap-3 @3xl/takeover:w-auto @3xl/takeover:flex-row @3xl/takeover:items-center">
            <Button size="xl" onClick={() => onAction(thankYou.primaryAction.destination, thankYou.primaryAction.href)}>
                {thankYou.primaryAction.label}
            </Button>
            {thankYou.secondaryAction && (
                <Button size="xl" color="tertiary" onClick={() => onAction(thankYou.secondaryAction!.destination, thankYou.secondaryAction!.href)}>
                    {thankYou.secondaryAction.label}
                </Button>
            )}
        </div>
    );

    const ResultIcon = score.passed ? Trophy01 : BookOpen01;
    const PassIcon = score.passed ? CheckCircle : XCircle;

    return (
        <SurveyTakeover surveyTitle={survey.title} progress={1} progressLabel={copy.quizProgressLabel} footer={actions}>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 pt-8 pb-4 @3xl/takeover:pt-0">
                {/* Score */}
                <section className="flex flex-col items-center gap-6 text-center">
                    <span
                        className={cx(
                            "flex size-20 items-center justify-center rounded-full animate-in duration-500 zoom-in-50 fade-in motion-reduce:animate-none",
                            score.passed ? "bg-success-secondary" : "bg-secondary",
                        )}
                    >
                        <ResultIcon className={cx("size-10", score.passed ? "text-fg-success-primary" : "text-fg-secondary")} aria-hidden="true" />
                    </span>

                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm font-semibold text-brand-secondary">{thankYou.title}</p>
                        <h1 className="text-display-sm font-semibold text-primary">{copy.youScored(score.correct, score.total)}</h1>
                        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-md">
                            <span className="text-display-xs font-semibold text-primary tabular-nums">{percent}%</span>
                            <span
                                className={cx(
                                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                                    score.passed ? "bg-success-primary text-success-primary" : "bg-secondary text-secondary",
                                )}
                            >
                                <PassIcon className="size-4" aria-hidden="true" />
                                {score.passed ? copy.passed : copy.notPassed}
                            </span>
                            <span className="text-tertiary">{copy.passMark(settings.passMark)}</span>
                        </p>
                        {thankYou.body && <p className="text-lg text-tertiary">{thankYou.body}</p>}
                    </div>

                    {reward && RewardIcon && (
                        <div className="flex w-full flex-col items-center gap-1 rounded-2xl px-6 py-6 ring-1 ring-secondary ring-inset">
                            <p className="flex items-center gap-2 text-display-sm font-semibold text-success-primary">
                                <RewardIcon className="size-7" aria-hidden="true" />
                                <span aria-hidden="true">{copy.rewardAdded({ ...reward, amount: shown })}</span>
                                <span className="sr-only">{copy.rewardAdded(reward)}</span>
                            </p>
                            <p className="text-md text-tertiary" lang={locale}>
                                {copy.rewardDestination(reward)}
                            </p>
                        </div>
                    )}
                    {missedReward && (
                        <p className="w-full rounded-2xl bg-secondary px-6 py-4 text-md text-secondary">
                            {copy.noRewardEarned}. {missedReward}
                        </p>
                    )}

                    <div className="hidden pt-2 @3xl/takeover:block">{actions}</div>
                </section>

                {/* Review */}
                {reveal === "never" ? (
                    <p className="flex items-start gap-3 rounded-xl p-4 text-sm text-tertiary ring-1 ring-secondary ring-inset">
                        <Lock01 className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        {copy.answersHidden}
                    </p>
                ) : (
                    reviewed.length > 0 && (
                        <section aria-labelledby="quiz-review" className="@container/survey flex flex-col gap-6 border-t border-secondary pt-8">
                            <div className="flex flex-col gap-1">
                                <h2 id="quiz-review" className="text-lg font-semibold text-primary">
                                    {copy.reviewTitle}
                                </h2>
                                <p className="text-sm text-tertiary">{copy.reviewIntro(score.correct, score.total)}</p>
                            </div>
                            <ol className="flex flex-col gap-8">
                                {reviewed.map((q, i) => (
                                    <li key={q.id} className="flex flex-col gap-3">
                                        <h3 id={`review-${q.id}`} className="flex gap-2 text-md font-semibold text-primary">
                                            <span className="text-quaternary tabular-nums">{i + 1}.</span>
                                            {q.title}
                                        </h3>
                                        <GradedAnswer question={q} value={answers[q.id]} labelId={`review-${q.id}`} compact />
                                        <AnswerFeedback question={q} value={answers[q.id]} announce={false} />
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )
                )}
            </div>
        </SurveyTakeover>
    );
};
