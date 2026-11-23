import type { SurveyAnswers, SurveyLocale } from "../survey-types";

/**
 * One response as the results view sees it. For anonymous surveys `participant`
 * is never present: the platform keeps who-finished (for rewards) apart from
 * what-they-answered, and never joins them in results or exports.
 */
export interface ResultResponse {
    /** Sequential response number, shown as "Response #412". */
    number: number;
    locale: SurveyLocale;
    status: "complete" | "partial";
    startedAt: string;
    /** Complete responses only. */
    submittedAt?: string;
    /** Seconds from start to submit, complete responses only. */
    durationSeconds?: number;
    answers: SurveyAnswers;
    /** Identified surveys only. */
    participant?: { name: string; account: string; region: string; role: string };
}

export type DateFilter = "all" | "7d" | "24h";
export type LanguageFilter = "all" | SurveyLocale;

export interface ResultsFilters {
    dates: DateFilter;
    language: LanguageFilter;
    includePartial: boolean;
    /** Identified surveys only. */
    region?: string;
}

export interface ExportOptions {
    format: "csv" | "xlsx";
    content: "raw" | "summary";
    includePartial: boolean;
}
