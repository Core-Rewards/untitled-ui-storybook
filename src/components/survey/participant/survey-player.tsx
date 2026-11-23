import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUTO_ADVANCE_MS } from "../questions/question-keys";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { useSurveyCopy } from "../survey-context";
import { isQuiz, isScored, quizRewardFor, revealOf, scoreQuiz, withAnswerKey } from "../quiz-logic";
import { countAnswerable, getAnswerError, getNextTarget, getResumePoint, pipeAnswers } from "../survey-logic";
import type { AnswerValue, QuizAnswerKey, QuizScore, Survey, SurveyResponse, SurveyReward, SurveySubmitResult, ThankYouDestination } from "../survey-types";
import { QuizResults } from "./quiz-results";
import { getSurveyAvailability } from "./survey-availability";
import { SurveyIntro } from "./survey-intro";
import { SurveyQuestionScreen } from "./survey-question-screen";
import { SurveyThankYou } from "./survey-thank-you";
import { SurveyUnavailable } from "./survey-unavailable";

export interface SurveyPlayerProps {
    survey: Survey;
    /** Saved progress. In-progress responses resume at the next unanswered question. */
    response?: SurveyResponse;
    /** Autosave: called after every answer and every step. */
    onResponseChange?: (response: SurveyResponse) => void;
    /**
     * Submit the finished response. The platform pays the reward once per
     * participant (idempotent on survey + participant), so retries are safe.
     */
    onSubmit: (response: SurveyResponse) => Promise<SurveySubmitResult>;
    /** Close or "Save and exit". Progress has already been saved. */
    onExit?: (response: SurveyResponse) => void;
    /** Thank-you and edge-state buttons. */
    onNavigate?: (destination: ThankYouDestination, href?: string) => void;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
    /** Skip the intro, e.g. when resuming from the dashboard card. Defaults to true for in-progress responses. */
    skipIntro?: boolean;
    /** Keyboard shortcuts. On by default; they only fire outside text fields. */
    shortcuts?: boolean;
}

type Stage =
    | { kind: "intro" }
    | { kind: "question"; id: string }
    | { kind: "thank_you"; reward?: SurveyReward; score?: QuizScore; answerKey?: QuizAnswerKey };

const emptyResponse = (survey: Survey): SurveyResponse => ({
    surveyId: survey.id,
    status: "not_started",
    locale: survey.locale,
    answers: {},
    history: [],
});

/**
 * The whole participant flow: intro, one question per screen with jump logic and
 * piping, autosave and resume, submit, and thank-you. Shows the right edge state
 * when the survey isn't open, has closed or was already completed.
 *
 * Quizzes run through the same flow. Depending on `quiz.reveal`, scored questions
 * either get a Check answer step with feedback (and Back is off, since a revealed
 * answer can't change) or are only marked on the results screen, which replaces
 * the thank-you with the score, the reward actually earned and a review.
 */
export const SurveyPlayer = (props: SurveyPlayerProps) => (
    <SurveyLocaleProvider locale={props.survey.locale}>
        <SurveyPlayerInner {...props} />
    </SurveyLocaleProvider>
);

const SurveyPlayerInner = ({
    survey,
    response: initial,
    onResponseChange,
    onSubmit,
    onExit,
    onNavigate,
    now,
    skipIntro,
    shortcuts = true,
}: SurveyPlayerProps) => {
    const { copy } = useSurveyCopy();
    const [response, setResponse] = useState<SurveyResponse>(() => initial ?? emptyResponse(survey));
    const [stage, setStage] = useState<Stage>(() => {
        const resume = getResumePoint(survey, response.answers);
        const resuming = response.status === "in_progress";
        if (resuming && (skipIntro ?? true))
            return resume.questionId === "end" ? { kind: "question", id: survey.questions.at(-1)!.id } : { kind: "question", id: resume.questionId };
        return skipIntro ? { kind: "question", id: survey.questions[0].id } : { kind: "intro" };
    });
    const [message, setMessage] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>();
    const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const submittedRef = useRef(false);
    const quiz = isQuiz(survey);
    const revealEach = quiz && revealOf(survey.quiz) === "each_question";
    // Scored questions whose answer has been checked. Anything already passed counts, so resuming never re-asks.
    const [revealed, setRevealed] = useState<Set<string>>(() => new Set(initial?.history ?? []));

    // When resuming, rebuild the Back path from the saved answers.
    useEffect(() => {
        if (response.status === "in_progress" && response.history.length === 0) {
            const { history } = getResumePoint(survey, response.answers);
            setResponse((r) => ({ ...r, history }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => clearTimeout(advanceTimer.current), []);

    const save = useCallback(
        (next: SurveyResponse) => {
            setResponse(next);
            onResponseChange?.(next);
        },
        [onResponseChange],
    );

    const availability = getSurveyAvailability(survey, initial, now);
    const answerable = useMemo(() => survey.questions.filter((q) => q.type !== "statement"), [survey.questions]);
    const total = countAnswerable(survey.questions);

    if (availability !== "open" && stage.kind !== "thank_you") {
        return (
            <SurveyUnavailable
                survey={survey}
                reason={availability}
                rewardEarned={initial?.rewardEarned}
                score={initial?.score}
                onBack={() => onNavigate?.("dashboard")}
            />
        );
    }

    if (stage.kind === "intro") {
        return (
            <SurveyIntro
                survey={survey}
                shortcuts={shortcuts}
                onClose={() => onExit?.(response)}
                onStart={() => {
                    const started = {
                        ...response,
                        status: "in_progress" as const,
                        startedAt: response.startedAt ?? (now ?? new Date()).toISOString(),
                    };
                    save(started);
                    setStage({ kind: "question", id: survey.questions[0].id });
                }}
            />
        );
    }

    if (stage.kind === "thank_you" && quiz) {
        return (
            <QuizResults
                survey={withAnswerKey(survey, stage.answerKey)}
                answers={response.answers}
                score={stage.score ?? scoreQuiz(survey, response.answers)}
                reward={stage.reward}
                onAction={(d, href) => onNavigate?.(d, href)}
            />
        );
    }

    if (stage.kind === "thank_you") {
        return <SurveyThankYou surveyTitle={survey.title} settings={survey.thankYou} reward={stage.reward} onAction={(d, href) => onNavigate?.(d, href)} />;
    }

    const question = survey.questions.find((q) => q.id === stage.id)!;
    const value = response.answers[question.id];
    const nextTarget = getNextTarget(survey, question.id, response.answers);
    const isLast = nextTarget === "end";
    const checkFirst = revealEach && isScored(question);
    const isRevealed = checkFirst && revealed.has(question.id);
    // Statements take the number of the question after them.
    const index = survey.questions.indexOf(question);
    const number = Math.min(total, Math.max(1, answerable.filter((q) => survey.questions.indexOf(q) < index).length + 1));
    const progress = Math.min(1, response.history.length / Math.max(1, total));

    const submit = async (final: SurveyResponse) => {
        if (submittedRef.current) return; // never pay twice from a double tap or retry race
        submittedRef.current = true;
        setSubmitting(true);
        setSubmitError(undefined);
        try {
            // Quizzes are graded here for display; the platform grades again and its score wins.
            const localScore = quiz ? scoreQuiz(survey, final.answers) : undefined;
            const complete: SurveyResponse = {
                ...final,
                status: "complete",
                submittedAt: (now ?? new Date()).toISOString(),
                ...(localScore && { score: localScore, rewardEarned: quizRewardFor(survey, localScore) }),
            };
            const result = await onSubmit(complete);
            if (quiz) {
                const score = result.score ?? localScore!;
                // When the platform graded it, its reward (or none) stands.
                const reward = result.score ? result.reward : (result.reward ?? quizRewardFor(survey, score));
                save({ ...complete, score, rewardEarned: reward });
                setStage({ kind: "thank_you", reward, score, answerKey: result.answerKey });
                return;
            }
            save(complete);
            setStage({ kind: "thank_you", reward: result.reward ?? survey.reward });
        } catch {
            submittedRef.current = false;
            setSubmitError(copy.submitError);
        } finally {
            setSubmitting(false);
        }
    };

    /** Validate, record the step and move to the next question (or submit). */
    const advance = (answer: AnswerValue | undefined = value) => {
        clearTimeout(advanceTimer.current);
        const error = getAnswerError(question, answer, copy);
        if (error) {
            setMessage(error);
            return;
        }
        setMessage(undefined);
        // Check answer: show the result and stay. The next press moves on.
        if (checkFirst && !isRevealed) {
            save({ ...response, status: "in_progress", answers: { ...response.answers, [question.id]: answer } });
            setRevealed((r) => new Set([...r, question.id]));
            return;
        }
        const answers = { ...response.answers, [question.id]: answer };
        const history = response.history.at(-1) === question.id ? response.history : [...response.history, question.id];
        const next: SurveyResponse = {
            ...response,
            status: "in_progress",
            answers,
            history,
        };
        const target = getNextTarget(survey, question.id, answers);
        if (target === "end") {
            void submit(next);
            return;
        }
        save(next);
        setStage({ kind: "question", id: target });
    };

    const back = () => {
        clearTimeout(advanceTimer.current);
        setMessage(undefined);
        const history = [...response.history];
        const previous = history.pop();
        if (!previous) return;
        save({ ...response, history });
        setStage({ kind: "question", id: previous });
    };

    return (
        <SurveyQuestionScreen
            surveyTitle={survey.title}
            question={question}
            title={pipeAnswers(question.title, survey, response.answers, copy)}
            description={question.description && pipeAnswers(question.description, survey, response.answers, copy)}
            number={number}
            total={total}
            progress={progress}
            value={value}
            onChange={(v) => {
                if (isRevealed) return; // a checked answer is final
                setMessage(undefined);
                save({
                    ...response,
                    status: "in_progress",
                    answers: { ...response.answers, [question.id]: v },
                });
            }}
            onCommit={(v) => {
                // Answers that get checked wait for the Check answer button.
                if (checkFirst) return;
                // Never submit from a tap or Enter in a field; the last step needs Submit.
                if (
                    getNextTarget(survey, question.id, {
                        ...response.answers,
                        [question.id]: v,
                    }) === "end"
                )
                    return;
                clearTimeout(advanceTimer.current);
                advanceTimer.current = setTimeout(() => advance(v), AUTO_ADVANCE_MS);
            }}
            onNext={() => advance()}
            // Revealing answers one by one means earlier answers are final, so there's no going back.
            onBack={response.history.length > 0 && !revealEach ? back : undefined}
            onExit={() => onExit?.(response)}
            message={message}
            submitError={submitError}
            isLast={isLast}
            isSubmitting={submitting}
            shortcuts={shortcuts}
            checkFirst={checkFirst}
            revealed={isRevealed}
            progressLabel={quiz ? copy.quizProgressLabel : undefined}
        />
    );
};
