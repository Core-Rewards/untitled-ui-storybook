import type { BadgeColor } from "@/components/base/badges/badge";
import type { SurveyReward, SurveyStatus } from "../survey-types";
import type { SurveyListItem, SurveyRowAction } from "./admin-types";

/** Status pill colour and label. Every pill also has a dot and a word, so status is never colour alone. */
export const statusBadge: Record<SurveyStatus, { label: string; color: BadgeColor }> = {
    draft: { label: "Draft", color: "gray" },
    scheduled: { label: "Scheduled", color: "blue" },
    live: { label: "Live", color: "success" },
    closed: { label: "Closed", color: "gray" },
    archived: { label: "Archived", color: "gray" },
};

const dayFormat = (timeZone: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone });

/** "Dec 1 – Dec 15", in the survey's timezone. */
export const formatDateRange = (opensAt: string, closesAt: string, timeZone: string) => {
    const f = dayFormat(timeZone);
    return `${f.format(new Date(opensAt))} – ${f.format(new Date(closesAt))}`;
};

/** "500 points", "1 sweepstakes entry", "2 arcade spins", or "No reward". */
export const formatReward = (reward?: SurveyReward) => {
    if (!reward) return "No reward";
    const n = reward.amount.toLocaleString("en-US");
    const one = reward.amount === 1;
    if (reward.type === "points") return `${n} ${one ? "point" : "points"}`;
    if (reward.type === "sweepstakes") return `${n} sweepstakes ${one ? "entry" : "entries"}`;
    return `${n} arcade ${one ? "spin" : "spins"}`;
};

/** The list's reward cell: "500 points", or for quizzes "Pass: 250 points" / "Up to 500 points". */
export const formatListReward = (item: Pick<SurveyListItem, "kind" | "reward" | "quizRewardRule">) => {
    if (!item.reward || item.kind !== "quiz") return formatReward(item.reward);
    if (item.quizRewardRule === "pass") return `Pass: ${formatReward(item.reward)}`;
    if (item.quizRewardRule === "tiered") return `Up to ${formatReward(item.reward)}`;
    return formatReward(item.reward);
};

/** "just now", "2 hours ago", "3 days ago", then the date. */
export const formatRelative = (iso: string, now: Date) => {
    const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
    return `on ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso))}`;
};

/** Which ··· actions apply: results once there can be responses, Close now only while live, Archive once it isn't live. */
export const rowActionsFor = (status: SurveyStatus): SurveyRowAction[] => {
    const actions: SurveyRowAction[] = ["edit", "preview"];
    if (status === "live" || status === "closed") actions.push("results");
    actions.push("duplicate");
    if (status === "live") actions.push("close");
    if (status !== "live" && status !== "archived") actions.push("archive");
    return actions;
};
