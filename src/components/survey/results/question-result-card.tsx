import { useState } from "react";
import { CheckCircle, File04, SearchLg } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { onlyIf } from "../builder/logic-analysis";
import { typeInfo } from "../builder/question-catalog";
import { isScored } from "../quiz-logic";
import type { Survey, SurveyQuestion } from "../survey-types";
import type { BarRow, QuestionSummary } from "./results-aggregate";

const fmtDate = (iso?: string) => (iso ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso)) : "");

/**
 * One results card per question (A9), drawn for its type: bars with counts and
 * percentages, NPS with its promoter/passive/detractor split, average rank, stacked
 * matrix rows, searchable text answers, number ranges or a file grid.
 */
export const QuestionResultCard = ({ survey, question, summary }: { survey: Survey; question: SurveyQuestion; summary: QuestionSummary }) => {
    const index = survey.questions.indexOf(question);
    const condition = onlyIf(survey, question);
    const baseLabel = question.type === "multiple_choice" ? `Multiple choice, ${question.multiple ? "pick any" : "pick one"}` : typeInfo(question.type).label;
    const typeLabel = isScored(question) ? `${baseLabel} · Scored` : baseLabel;
    const correctPct = summary.kind === "bars" ? summary.correctPct : undefined;
    const average =
        summary.kind === "bars" && summary.average !== undefined
            ? ` · Average ${summary.average.toFixed(1)}`
            : summary.kind === "numeric" && !summary.isDate
              ? ` · Average ${summary.average.toFixed(1)}`
              : "";

    return (
        <section aria-labelledby={`result-${question.id}`} className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                    <span className="font-semibold text-tertiary">
                        Q{index + 1} · {typeLabel}
                        {condition && ` · shown ${condition.replace(/^Only if/, "if")}`}
                    </span>
                    <span className="text-tertiary">
                        {summary.answered.toLocaleString("en-US")} {summary.answered === 1 ? "response" : "responses"}
                        {average}
                        {correctPct !== undefined && (
                            <>
                                {" · "}
                                <span className="font-semibold text-primary">{correctPct}% answered correctly</span>
                            </>
                        )}
                    </span>
                </div>
                <h3 id={`result-${question.id}`} className="text-md font-semibold text-primary">
                    {question.title}
                </h3>
            </div>
            <CardBody summary={summary} />
        </section>
    );
};

/** Bars with counts. On scored quiz questions the right answer is green with a check, so it never relies on colour alone. */
const Bars = ({ rows }: { rows: BarRow[] }) => (
    <ul className="flex flex-col gap-2.5">
        {rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                <span className={cx("flex min-w-0 items-center gap-1.5", r.correct ? "font-semibold text-success-primary" : "text-secondary")} title={r.label}>
                    {r.correct && <CheckCircle className="size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />}
                    <span className="truncate">{r.label}</span>
                    {r.correct && <span className="sr-only"> (correct answer)</span>}
                </span>
                <span aria-hidden="true" className="h-5 overflow-hidden rounded-md bg-secondary">
                    <span className={cx("block h-full rounded-md", r.correct ? "bg-success-solid" : "bg-brand-solid")} style={{ width: `${r.pct}%` }} />
                </span>
                <span className="text-right font-semibold text-primary tabular-nums">
                    {r.pct}%<span className="sr-only">, {r.count} responses</span>
                </span>
            </li>
        ))}
    </ul>
);

const CardBody = ({ summary }: { summary: QuestionSummary }) => {
    switch (summary.kind) {
        case "bars":
            return (
                <>
                    <Bars rows={summary.rows} />
                    {summary.multi && <p className="text-xs text-tertiary">People could pick more than one, so percentages add up to more than 100.</p>}
                </>
            );
        case "nps":
            return (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex flex-col">
                        <span className="text-display-md font-semibold text-primary tabular-nums">
                            {summary.score > 0 ? "+" : ""}
                            {summary.score}
                        </span>
                        <span className="text-xs text-tertiary">NPS</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                        <div aria-hidden="true" className="flex h-6 overflow-hidden rounded-md">
                            <span className="bg-brand-solid" style={{ width: `${summary.promoters}%` }} />
                            <span className="bg-utility-brand-300" style={{ width: `${summary.passives}%` }} />
                            <span className="bg-utility-orange-600" style={{ width: `${summary.detractors}%` }} />
                        </div>
                        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-tertiary">
                            <Legend swatch="bg-brand-solid" value={summary.promoters} label="Promoters (9 to 10)" />
                            <Legend swatch="bg-utility-brand-300" value={summary.passives} label="Passives (7 to 8)" />
                            <Legend swatch="bg-utility-orange-600" value={summary.detractors} label="Detractors (0 to 6)" />
                        </ul>
                    </div>
                </div>
            );
        case "ranking": {
            const max = Math.max(1, ...summary.rows.map((r) => r.averageRank));
            return (
                <ul className="flex flex-col gap-2.5">
                    {summary.rows.map((r, i) => (
                        <li key={r.label} className="grid grid-cols-[1.5rem_minmax(0,10rem)_minmax(0,1fr)_4rem] items-center gap-3 text-sm">
                            <span className="font-semibold text-quaternary">{i + 1}</span>
                            <span className="truncate text-secondary">{r.label}</span>
                            <span aria-hidden="true" className="h-5 overflow-hidden rounded-md bg-secondary">
                                <span className="block h-full rounded-md bg-brand-solid" style={{ width: `${((max - r.averageRank + 1) / max) * 100}%` }} />
                            </span>
                            <span className="text-right text-tertiary tabular-nums">avg {r.averageRank.toFixed(1)}</span>
                        </li>
                    ))}
                </ul>
            );
        }
        case "matrix": {
            const shades = ["bg-utility-orange-500", "bg-utility-brand-300", "bg-brand-solid", "bg-utility-brand-700", "bg-quaternary"];
            return (
                <div className="flex flex-col gap-3">
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tertiary">
                        {summary.columns.map((c, i) => (
                            <Legend key={c} swatch={shades[i % shades.length]} label={c} />
                        ))}
                    </ul>
                    {summary.rows.map((r) => (
                        <div key={r.label} className="flex flex-col gap-1.5">
                            <span className="text-sm text-secondary">{r.label}</span>
                            <div
                                className="flex h-5 overflow-hidden rounded-md bg-secondary"
                                aria-label={r.pcts.map((p, i) => `${summary.columns[i]} ${p}%`).join(", ")}
                                role="img"
                            >
                                {r.pcts.map((p, i) => (
                                    <span key={i} className={shades[i % shades.length]} style={{ width: `${p}%` }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        case "text":
            return <TextAnswers answers={summary.answers} />;
        case "numeric":
            return (
                <div className="flex flex-col gap-4">
                    <dl className="grid grid-cols-3 gap-3">
                        {(
                            [
                                ["Average", summary.average],
                                ["Min", summary.min],
                                ["Max", summary.max],
                            ] as const
                        ).map(([label, v]) => (
                            <div key={label} className="rounded-lg bg-secondary px-3 py-2">
                                <dt className="text-xs text-tertiary">{label}</dt>
                                <dd className="text-md font-semibold text-primary">
                                    {summary.isDate ? fmtDate(new Date(v).toISOString()) : Math.round(v * 10) / 10}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <Bars rows={summary.rows} />
                </div>
            );
        case "files":
            return summary.files.length ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {summary.files.slice(0, 9).map((f) => (
                        <li key={`${f.number}-${f.id}`} className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-3 text-center">
                            <File04 className="size-8 text-fg-quaternary" aria-hidden="true" />
                            <span className="w-full truncate text-xs text-secondary">{f.name}</span>
                            <span className="text-xs text-tertiary">Response #{f.number}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-tertiary">No files yet.</p>
            );
        case "none":
            return <p className="text-sm text-tertiary">No answers yet.</p>;
    }
};

const Legend = ({ swatch, value, label }: { swatch: string; value?: number; label: string }) => (
    <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cx("size-2.5 rounded-sm", swatch)} />
        {value !== undefined && <span className="font-semibold text-primary">{value}%</span>}
        {label}
    </li>
);

const TextAnswers = ({ answers }: { answers: { text: string; number: number; date?: string; locale: string }[] }) => {
    const [query, setQuery] = useState("");
    const [all, setAll] = useState(false);
    const q = query.trim().toLowerCase();
    const matches = q ? answers.filter((a) => a.text.toLowerCase().includes(q)) : answers;
    const shown = all ? matches : matches.slice(0, 3);

    return (
        <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand">
                <SearchLg className="size-4 text-fg-quaternary" aria-hidden="true" />
                <input
                    type="search"
                    aria-label={`Search ${answers.length} answers`}
                    placeholder={`Search ${answers.length} answers`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-hidden placeholder:text-placeholder"
                />
            </label>
            {matches.length === 0 ? (
                <p className="text-sm text-tertiary">No answers match.</p>
            ) : (
                <ul className={cx("flex flex-col divide-y divide-secondary", all && "max-h-96 overflow-y-auto")}>
                    {shown.map((a) => (
                        <li key={a.number} className="flex flex-col gap-0.5 py-3 first:pt-0">
                            <p className="text-sm text-primary" lang={a.locale}>
                                {a.text}
                            </p>
                            <p className="text-xs text-tertiary">
                                Response #{a.number} · {fmtDate(a.date)} · {a.locale.toUpperCase()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            {matches.length > 3 && (
                <Button color="link-color" size="sm" onClick={() => setAll((v) => !v)} className="self-start">
                    {all ? "Show fewer" : `View all ${matches.length} answers`}
                </Button>
            )}
        </div>
    );
};
