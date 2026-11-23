import { Calendar, CalendarDate, ClipboardCheck, Clock, GraduationHat01, List, XCircle } from "@untitledui/icons";
import type { FC, ReactNode } from "react";
import type { ActionCardAction, ActionCardMeta, ActionCardStatus } from "@/components/base/action-card/action-card";
import type { SurveyCopy } from "../survey-copy";
import { formatSurveyDate } from "../survey-copy";
import { countAnswerable, estimateMinutes, getResumePoint } from "../survey-logic";
import type { SurveyLocale } from "../survey-types";
import type { ActivityItem } from "./activity-logic";
import { activityStatus, kindOf, rewardText } from "./activity-logic";
import { RewardBadge } from "./reward-badge";

export interface ActivityView {
    status: ActionCardStatus;
    kindIcon: FC<{ className?: string }>;
    kindLabel: string;
    eyebrow: string;
    title: string;
    description?: string;
    meta?: ActionCardMeta[];
    badge?: ReactNode;
    progress?: { current: number; total: number; label?: string };
    action?: ActionCardAction;
    statusLine?: string;
    statusIcon?: FC<{ className?: string }>;
}

/**
 * Everything a card or row says about one survey or quiz for this participant:
 * its label, reward wording, facts, and either a button (Start, Resume · 3 of 5)
 * or a status line (Opens Jan 5, Scored 5 of 6 · Passed · +300 points).
 */
export const describeActivity = (
    item: ActivityItem,
    copy: SurveyCopy,
    locale: SurveyLocale,
    now: Date,
    onOpen: (mode: "start" | "resume") => void,
): ActivityView => {
    const { survey, response } = item;
    const isQuiz = kindOf(survey) === "quiz";
    const status = activityStatus(item, now);
    const total = countAnswerable(survey.questions);
    const fmt = (iso: string) => formatSurveyDate(iso, locale, survey.timezone);
    const reward = rewardText(survey, copy);
    const base = {
        kindIcon: isQuiz ? GraduationHat01 : ClipboardCheck,
        kindLabel: isQuiz ? copy.kindQuiz : copy.kindSurvey,
        title: survey.card.headline || survey.title,
        description: survey.card.body,
        badge: survey.reward && reward && status !== "completed" ? <RewardBadge reward={survey.reward} label={reward} /> : undefined,
    };
    const meta: ActionCardMeta[] = [
        { label: copy.minutes(estimateMinutes(survey.questions)), icon: Clock },
        { label: copy.questions(total), icon: List },
        { label: copy.closes(fmt(survey.closesAt)), icon: Calendar },
    ];

    if (status === "completed") {
        // Surveys always pay on completion; quizzes may pay less, or nothing, depending on the score.
        const earned = response?.rewardEarned ?? (isQuiz ? undefined : survey.reward);
        const parts = isQuiz
            ? [
                  response?.score ? copy.scoreLine(response.score.correct, response.score.total, response.score.passed) : undefined,
                  earned ? copy.earned(earned) : survey.reward ? copy.noRewardEarned : undefined,
              ].filter(Boolean)
            : [copy.completedWith(earned)];
        // A quiz that wasn't passed is finished, but it isn't a success: show it neutral, not green.
        const notPassed = isQuiz && response?.score && !response.score.passed;
        return {
            ...base,
            status: notPassed ? "closed" : "completed",
            statusIcon: notPassed ? XCircle : undefined,
            eyebrow: isQuiz ? copy.quizCompleted : copy.surveyCompleted,
            meta: response?.submittedAt ? [{ label: copy.completedOn(fmt(response.submittedAt)), icon: CalendarDate }] : undefined,
            statusLine: parts.join(" · ") || copy.completedWith(),
        };
    }
    if (status === "upcoming") {
        return {
            ...base,
            status: "upcoming",
            eyebrow: isQuiz ? copy.newQuiz : copy.newSurvey,
            meta: meta.slice(0, 2),
            statusLine: copy.opens(fmt(survey.opensAt)),
            statusIcon: CalendarDate,
        };
    }
    if (status === "missed") {
        return { ...base, status: "closed", eyebrow: base.kindLabel, statusLine: copy.closedBody(fmt(survey.closesAt)) };
    }
    if (status === "in_progress" && response) {
        const resume = getResumePoint(survey, response.answers);
        const done = survey.questions.filter((q) => q.type !== "statement" && resume.history.includes(q.id)).length;
        return {
            ...base,
            status: "in_progress",
            eyebrow: isQuiz ? copy.quizInProgress : copy.surveyInProgress,
            meta,
            progress: { current: done, total, label: copy.progressLabel },
            action: { label: copy.resumeAt(Math.min(total, done + 1), total), onPress: () => onOpen("resume") },
        };
    }
    return { ...base, status: "new", eyebrow: isQuiz ? copy.newQuiz : copy.newSurvey, meta, action: { label: copy.start, onPress: () => onOpen("start") } };
};
