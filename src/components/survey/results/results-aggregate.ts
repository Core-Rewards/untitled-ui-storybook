import { isChoiceAnswer, OTHER_OPTION_ID } from "../survey-logic";
import { DEFAULT_QUIZ_SETTINGS, isCorrect, isQuiz, isScored, meets, quizRewardFor, scorePercent, scoreQuiz } from "../quiz-logic";
import type { AnswerValue, QuizScore, Survey, SurveyQuestion, SurveyReward, UploadedFile } from "../survey-types";
import type { ResultResponse, ResultsFilters } from "./results-types";

/** Groups smaller than this are hidden on anonymous surveys so no one can be singled out. */
export const MIN_GROUP_SIZE = 5;

// ─── Filters ─────────────────────────────────────────────────────────────────

export const applyFilters = (responses: ResultResponse[], filters: ResultsFilters, now: Date) => {
    const since = filters.dates === "24h" ? now.getTime() - 86_400_000 : filters.dates === "7d" ? now.getTime() - 7 * 86_400_000 : -Infinity;
    return responses.filter(
        (r) =>
            new Date(r.startedAt).getTime() >= since &&
            (filters.language === "all" || r.locale === filters.language) &&
            (!filters.region || r.participant?.region === filters.region),
    );
};

// ─── KPIs ────────────────────────────────────────────────────────────────────

const median = (values: number[]) => {
    if (!values.length) return undefined;
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export const formatDuration = (seconds?: number) =>
    seconds === undefined ? "–" : seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;

/** Header metrics over the filtered responses (date and language), before the complete/partial switch. */
export const computeKpis = (survey: Survey, inScope: ResultResponse[]) => {
    const complete = inScope.filter((r) => r.status === "complete");
    return {
        responses: complete.length,
        started: inScope.length,
        completionRate: inScope.length ? complete.length / inScope.length : undefined,
        medianSeconds: median(complete.map((r) => r.durationSeconds ?? 0)),
        rewardIssued: survey.reward ? complete.length * survey.reward.amount : 0,
    };
};

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export interface QuizResult {
    score: QuizScore;
    /** Whole percent, never rounded up to the pass mark. */
    percent: number;
    /** What this response was paid under the reward rule. */
    reward?: SurveyReward;
}

/** A complete response's quiz result. Undefined for surveys and partial responses, which have no score. */
export const quizResultFor = (survey: Survey, r: ResultResponse): QuizResult | undefined => {
    if (!isQuiz(survey) || r.status !== "complete") return undefined;
    const score = scoreQuiz(survey, r.answers);
    return { score, percent: scorePercent(score), reward: quizRewardFor(survey, score) };
};

/** Quiz header metrics over the filtered responses. Scores only count complete responses. */
export const computeQuizKpis = (survey: Survey, inScope: ResultResponse[]) => {
    const base = computeKpis(survey, inScope);
    const results = inScope.map((r) => quizResultFor(survey, r)).filter((x): x is QuizResult => !!x);
    const n = results.length;
    return {
        ...base,
        averagePercent: n ? results.reduce((s, x) => s + (x.score.total ? (x.score.correct / x.score.total) * 100 : 0), 0) / n : undefined,
        passed: results.filter((x) => x.score.passed).length,
        passRate: n ? results.filter((x) => x.score.passed).length / n : undefined,
        /** Actual payouts: a quiz may pay less than the full reward, or nothing. */
        rewardIssued: results.reduce((s, x) => s + (x.reward?.amount ?? 0), 0),
        rewarded: results.filter((x) => x.reward).length,
    };
};

export interface ScoreBucket {
    label: string;
    count: number;
    pct: number;
    /** Scores in this bucket reach the pass mark. */
    passes: boolean;
}

/**
 * How complete responses scored. When everyone had the same number of scored
 * questions (no jump logic skipped any), one bar per number correct, "0 of 5" to
 * "5 of 5"; otherwise bars by percent in steps of 10.
 */
export const scoreDistribution = (survey: Survey, responses: ResultResponse[]) => {
    const passMark = survey.quiz?.passMark ?? DEFAULT_QUIZ_SETTINGS.passMark;
    const scores = responses.map((r) => quizResultFor(survey, r)?.score).filter((s): s is QuizScore => !!s);
    const totals = new Set(scores.map((s) => s.total));
    const n = scores.length;
    if (totals.size <= 1) {
        const total = scores[0]?.total ?? 0;
        const buckets: ScoreBucket[] = Array.from({ length: total + 1 }, (_, c) => {
            const count = scores.filter((s) => s.correct === c).length;
            return { label: `${c} of ${total}`, count, pct: pct(count, n), passes: meets(c, total, passMark) };
        });
        return { passMark, byCount: true, buckets, scored: n };
    }
    const buckets: ScoreBucket[] = Array.from({ length: 11 }, (_, i) => {
        const lo = i * 10;
        const count = scores.filter((s) => Math.min(10, Math.floor((s.correct / s.total) * 10)) === i).length;
        return { label: i === 10 ? "100%" : `${lo} to ${lo + 9}%`, count, pct: pct(count, n), passes: lo >= passMark };
    });
    return { passMark, byCount: false, buckets, scored: n };
};

// ─── Per-question summaries ──────────────────────────────────────────────────

export type BarRow = {
    label: string;
    count: number;
    pct: number;
    /** Quizzes: this option is (one of) the right answer(s). */
    correct?: boolean;
};

export type QuestionSummary =
    | {
          kind: "bars";
          answered: number;
          rows: BarRow[];
          average?: number;
          multi?: boolean;
          /** Quizzes, scored questions: percent of those who answered who got it right. */
          correctPct?: number;
      }
    | { kind: "nps"; answered: number; score: number; promoters: number; passives: number; detractors: number }
    | { kind: "ranking"; answered: number; rows: { label: string; averageRank: number }[] }
    | { kind: "matrix"; answered: number; columns: string[]; rows: { label: string; pcts: number[] }[] }
    | { kind: "text"; answered: number; answers: { text: string; number: number; date?: string; locale: string }[] }
    | { kind: "numeric"; answered: number; average: number; min: number; max: number; rows: BarRow[]; isDate?: boolean }
    | { kind: "files"; answered: number; files: (UploadedFile & { number: number })[] }
    | { kind: "none"; answered: 0 };

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

const has = (v: AnswerValue | undefined) =>
    v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && !(isChoiceAnswer(v) && v.selected.length === 0);

/** Summarize one question across responses, in the shape its card draws. */
export const summarize = (q: SurveyQuestion, responses: ResultResponse[]): QuestionSummary => {
    const withAnswer = responses.filter((r) => has(r.answers[q.id]));
    const values = withAnswer.map((r) => r.answers[q.id]!);
    const n = withAnswer.length;
    // Scored quiz questions mark their right answer and how many got it.
    const scored = isScored(q);
    const right = new Set(q.correct ?? []);
    const grade = (rows: (BarRow & { id: string })[]): BarRow[] => rows.map(({ id, ...row }) => (scored ? { ...row, correct: right.has(id) } : row));
    const correctPct = scored ? pct(withAnswer.filter((r) => isCorrect(q, r.answers[q.id])).length, n) : undefined;

    switch (q.type) {
        case "multiple_choice": {
            const options = [...q.options, ...(q.allowOther ? [{ id: OTHER_OPTION_ID, label: "Other" }] : [])];
            const counts = new Map<string, number>();
            for (const v of values) if (isChoiceAnswer(v)) for (const id of v.selected) counts.set(id, (counts.get(id) ?? 0) + 1);
            return {
                kind: "bars",
                answered: n,
                multi: !!q.multiple,
                correctPct,
                rows: grade(options.map((o) => ({ id: o.id, label: o.label, count: counts.get(o.id) ?? 0, pct: pct(counts.get(o.id) ?? 0, n) }))),
            };
        }
        case "dropdown":
        case "yes_no": {
            const options =
                q.type === "dropdown"
                    ? q.options
                    : [
                          { id: "yes", label: q.yesLabel ?? "Yes" },
                          { id: "no", label: q.noLabel ?? "No" },
                      ];
            const rows = grade(
                options.map((o) => {
                    const c = values.filter((v) => v === o.id).length;
                    return { id: o.id, label: o.label, count: c, pct: pct(c, n) };
                }),
            );
            return { kind: "bars", answered: n, correctPct, rows: q.type === "dropdown" ? rows.sort((a, b) => b.count - a.count) : rows };
        }
        case "rating":
        case "opinion_scale": {
            const min = q.type === "rating" ? 1 : q.min;
            const max = q.type === "rating" ? (q.scale ?? 5) : q.max;
            const nums = values.filter((v): v is number => typeof v === "number");
            const rows: BarRow[] = [];
            for (let s = max; s >= min; s--) {
                const c = nums.filter((v) => v === s).length;
                const end = q.type === "opinion_scale" ? (s === q.max ? q.maxLabel : s === q.min ? q.minLabel : undefined) : undefined;
                rows.push({ label: end ? `${s} · ${end}` : String(s), count: c, pct: pct(c, n) });
            }
            return { kind: "bars", answered: n, rows, average: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined };
        }
        case "nps": {
            const nums = values.filter((v): v is number => typeof v === "number");
            const p = nums.filter((v) => v >= 9).length;
            const d = nums.filter((v) => v <= 6).length;
            const promoters = pct(p, n);
            const detractors = pct(d, n);
            return { kind: "nps", answered: n, promoters, detractors, passives: n ? 100 - promoters - detractors : 0, score: promoters - detractors };
        }
        case "ranking": {
            const totals = new Map<string, number>();
            for (const v of values) if (Array.isArray(v)) (v as string[]).forEach((id, i) => totals.set(id, (totals.get(id) ?? 0) + i + 1));
            return {
                kind: "ranking",
                answered: n,
                rows: q.options
                    .map((o) => ({ label: o.label, averageRank: n ? (totals.get(o.id) ?? 0) / n : 0 }))
                    .sort((a, b) => a.averageRank - b.averageRank),
            };
        }
        case "matrix": {
            return {
                kind: "matrix",
                answered: n,
                columns: q.columns.map((c) => c.label),
                rows: q.rows.map((r) => ({
                    label: r.label,
                    pcts: q.columns.map((c) => pct(values.filter((v) => (v as Record<string, string>)[r.id] === c.id).length, n)),
                })),
            };
        }
        case "short_text":
        case "long_text":
            return {
                kind: "text",
                answered: n,
                answers: withAnswer
                    .map((r) => ({ text: String(r.answers[q.id]), number: r.number, date: r.submittedAt ?? r.startedAt, locale: r.locale }))
                    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
            };
        case "number":
        case "date": {
            const nums = values.map((v) => (q.type === "date" ? new Date(String(v)).getTime() : Number(v))).filter((v) => !Number.isNaN(v));
            if (!nums.length) return { kind: "none", answered: 0 };
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            const buckets = 5;
            const width = (max - min) / buckets || 1;
            const rows = Array.from({ length: buckets }, (_, i) => {
                const lo = min + i * width;
                const hi = i === buckets - 1 ? max + 1 : lo + width;
                const c = nums.filter((v) => v >= lo && v < hi).length;
                const fmt = (x: number) =>
                    q.type === "date" ? new Date(x).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : Math.round(x).toLocaleString("en-US");
                return { label: `${fmt(lo)}–${fmt(Math.min(hi, max))}`, count: c, pct: pct(c, nums.length) };
            });
            return { kind: "numeric", answered: n, average: nums.reduce((a, b) => a + b, 0) / nums.length, min, max, rows, isDate: q.type === "date" };
        }
        case "file_upload":
            return {
                kind: "files",
                answered: n,
                files: withAnswer.flatMap((r) => ((r.answers[q.id] as UploadedFile[]) ?? []).map((f) => ({ ...f, number: r.number }))),
            };
        case "statement":
            return { kind: "none", answered: 0 };
    }
};

// ─── Export ──────────────────────────────────────────────────────────────────

const csvCell = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

/** An answer as export text, in the base language. EN and FR answers share columns because option ids are shared. */
export const answerText = (q: SurveyQuestion, v: AnswerValue | undefined): string | string[] => {
    if (v === undefined) return "";
    if (isChoiceAnswer(v) && "options" in q)
        return v.selected.map((id) => (id === OTHER_OPTION_ID ? `Other: ${v.other ?? ""}` : (q.options.find((o) => o.id === id)?.label ?? id))).join("; ");
    if (q.type === "dropdown") return q.options.find((o) => o.id === v)?.label ?? String(v);
    if (q.type === "yes_no") return v === "yes" ? "Yes" : "No";
    if (q.type === "ranking" && Array.isArray(v)) return (v as string[]).map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(" > ");
    if (q.type === "matrix") return q.rows.map((r) => q.columns.find((c) => c.id === (v as Record<string, string>)[r.id])?.label ?? "");
    if (q.type === "file_upload") return (v as UploadedFile[]).map((f) => f.name).join("; ");
    return String(v);
};

/**
 * Raw responses as CSV: one row per response, one column per question (matrix rows
 * get a column each), plus a language column. Identity columns only for identified
 * surveys.
 */
export const toRawCsv = (survey: Survey, responses: ResultResponse[]) => {
    const identified = survey.anonymity === "identified";
    const quiz = isQuiz(survey);
    const questions = survey.questions.filter((q) => q.type !== "statement");
    const header = [
        "response_number",
        "status",
        "language",
        "started_at",
        "submitted_at",
        "duration_seconds",
        ...(identified ? ["name", "account", "region", "role"] : []),
        ...(quiz ? ["score", "out_of", "percent", "passed", "reward_earned"] : []),
        ...questions.flatMap((q) => {
            const n = survey.questions.indexOf(q) + 1;
            if (q.type === "matrix") return q.rows.map((r) => `Q${n} ${q.title} [${r.label}]`);
            // Scored quiz questions get a right/wrong column beside the answer.
            return quiz && isScored(q) ? [`Q${n} ${q.title}`, `Q${n} correct`] : [`Q${n} ${q.title}`];
        }),
    ];
    const rows = responses.map((r) => [
        r.number,
        r.status,
        r.locale.toUpperCase(),
        r.startedAt,
        r.submittedAt ?? "",
        r.durationSeconds ?? "",
        ...(identified ? [r.participant?.name, r.participant?.account, r.participant?.region, r.participant?.role] : []),
        ...(quiz ? quizCells(survey, r) : []),
        ...questions.flatMap((q) => {
            const t = answerText(q, r.answers[q.id]);
            const cells = Array.isArray(t) ? t : [t];
            if (!(quiz && isScored(q))) return cells;
            // Partial responses aren't graded, and unanswered questions on them stay blank.
            return [...cells, r.status === "complete" ? (isCorrect(q, r.answers[q.id]) ? "yes" : "no") : ""];
        }),
    ]);
    return [header, ...rows].map(csvRow).join("\n");
};

const quizCells = (survey: Survey, r: ResultResponse) => {
    const result = quizResultFor(survey, r);
    if (!result) return ["", "", "", "", ""];
    return [result.score.correct, result.score.total, result.percent, result.score.passed ? "yes" : "no", result.reward?.amount ?? 0];
};

/** The summary as CSV: question, answer, count, percent. Scored quiz questions add a "% correct" line and mark the right answer. */
export const toSummaryCsv = (survey: Survey, responses: ResultResponse[]) => {
    const lines: unknown[][] = [["question", "answer", "count", "percent"]];
    survey.questions.forEach((q, i) => {
        const s = summarize(q, responses);
        const label = `Q${i + 1} ${q.title}`;
        if (s.kind === "bars" && s.correctPct !== undefined) lines.push([label, "% answered correctly", s.answered, `${s.correctPct}%`]);
        if (s.kind === "bars" || s.kind === "numeric")
            s.rows.forEach((r) => lines.push([label, r.correct ? `${r.label} (correct)` : r.label, r.count, `${r.pct}%`]));
        if (s.kind === "nps")
            lines.push(
                [label, "NPS", s.answered, s.score],
                [label, "Promoters", "", `${s.promoters}%`],
                [label, "Passives", "", `${s.passives}%`],
                [label, "Detractors", "", `${s.detractors}%`],
            );
        if (s.kind === "ranking") s.rows.forEach((r) => lines.push([label, r.label, "", `avg rank ${r.averageRank.toFixed(1)}`]));
        if (s.kind === "matrix") s.rows.forEach((r) => r.pcts.forEach((p, j) => lines.push([`${label} [${r.label}]`, s.columns[j], "", `${p}%`])));
        if (s.kind === "text") lines.push([label, "text answers", s.answered, ""]);
    });
    return lines.map(csvRow).join("\n");
};
