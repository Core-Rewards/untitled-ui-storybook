import type { FC } from "react";
import type { SurveyAnonymity, SurveyLocale, SurveyReward, SurveyStatus } from "../survey-types";

/** One row on the admin survey list (A1). Counts come from the platform; the list never loads full responses. */
export interface SurveyListItem {
    id: string;
    title: string;
    status: SurveyStatus;
    questionCount: number;
    /** Estimated minutes to finish. */
    minutes: number;
    anonymity: SurveyAnonymity;
    /** ISO date-times. Drafts may not have dates yet. */
    opensAt?: string;
    closesAt?: string;
    timezone: string;
    /** Completed responses. Undefined before the survey opens. */
    responses?: number;
    /** Finished ÷ started, 0 to 1. */
    completionRate?: number;
    reward?: SurveyReward;
    /** Base language first. */
    locales: SurveyLocale[];
    /** ISO date-time of the last save. Shown for drafts ("Draft saved 2 hours ago"). */
    updatedAt: string;
}

/** Row actions in the ··· menu. Which ones show depends on the survey's status. */
export type SurveyRowAction = "edit" | "preview" | "results" | "duplicate" | "close" | "archive";

/** A Core-managed starter template (shown in the empty state, template library and New survey modal). */
export interface SurveyTemplate {
    id: string;
    title: string;
    description: string;
    questionCount: number;
    minutes: number;
    /** Comes with French already written. */
    hasFrench: boolean;
    icon: FC<{ className?: string }>;
    /** Library grouping, e.g. "Satisfaction". */
    category: string;
    /** One of the three starters shown first and in the empty state. */
    isStarter?: boolean;
    /** The template's questions as "type · title", shown in the preview. */
    questions: { type: string; title: string }[];
}

/** How a new survey starts. */
export type NewSurveySource = "template" | "blank" | "duplicate";

export interface NewSurveyRequest {
    source: NewSurveySource;
    /** For `template`. */
    templateId?: string;
    /** For `duplicate`. */
    duplicateOfId?: string;
    name: string;
    baseLocale: SurveyLocale;
}
