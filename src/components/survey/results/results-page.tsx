import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Download01, Edit05, EyeOff, XCircle } from "@untitledui/icons";
import { Heading, Radio, RadioGroup } from "react-aria-components";
import type { Key } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { DataTable } from "@/components/base/table";
import type { TableColumn } from "@/components/base/table";
import { Toast } from "@/components/base/toast/toast";
import { cx } from "@/utils/cx";
import { formatDateRange, statusBadge } from "../admin/admin-format";
import { SelectField, SettingToggle } from "../builder/settings-fields";
import { correctLabels, isCorrect, isQuiz, isScored } from "../quiz-logic";
import type { Survey, SurveyReward } from "../survey-types";
import { QuestionResultCard } from "./question-result-card";
import {
    MIN_GROUP_SIZE,
    answerText,
    applyFilters,
    computeKpis,
    computeQuizKpis,
    formatDuration,
    quizResultFor,
    scoreDistribution,
    summarize,
    toRawCsv,
    toSummaryCsv,
} from "./results-aggregate";
import type { QuizResult } from "./results-aggregate";
import type { ExportOptions, ResultResponse, ResultsFilters } from "./results-types";

export interface ResultsPageProps {
    survey: Survey;
    responses: ResultResponse[];
    onExit: () => void;
    onEditSurvey: () => void;
    /**
     * Export requested. CSV is built and downloaded in the browser; the platform
     * produces Excel files.
     */
    onExport?: (options: ExportOptions) => void;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
    initialTab?: "summary" | "responses";
}

const fmtDateTime = (iso?: string) =>
    iso ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "";

const rewardUnit = (reward?: Pick<SurveyReward, "type">) => (reward?.type === "points" ? "points" : reward?.type === "sweepstakes" ? "entries" : "spins");

const download = (filename: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Survey results (A9, A10): header metrics, filters, one card per question on the
 * Summary tab, and a Responses table whose rows open the full response in a side
 * drawer. Anonymous surveys never show identities, and any filter that leaves fewer
 * than 5 responses is hidden so no one can be singled out.
 *
 * Quizzes add scoring: average score, pass rate and what was actually paid in the
 * header, a score distribution with the pass mark, the right answer and "% answered
 * correctly" on each scored question, and Score / Result in the table and drawer.
 */
export const ResultsPage = ({ survey, responses, onExit, onEditSurvey, onExport, now = new Date(), initialTab = "summary" }: ResultsPageProps) => {
    const [tab, setTab] = useState(initialTab);
    const [filters, setFilters] = useState<ResultsFilters>({ dates: "all", language: "all", includePartial: false });
    const [openNumber, setOpenNumber] = useState<number | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

    const anonymous = survey.anonymity === "anonymous";
    const quiz = isQuiz(survey);
    const noun = quiz ? "quiz" : "survey";
    const locales = survey.enabledLocales ?? [survey.locale];
    const inScope = useMemo(() => applyFilters(responses, filters, now), [responses, filters, now]);
    const shown = filters.includePartial ? inScope : inScope.filter((r) => r.status === "complete");
    const kpis = computeKpis(survey, inScope);
    const quizKpis = useMemo(() => (quiz ? computeQuizKpis(survey, inScope) : undefined), [quiz, survey, inScope]);
    const quizResults = useMemo(() => new Map(shown.map((r) => [r.number, quizResultFor(survey, r)])), [shown, survey]);
    const suppressed = anonymous && shown.length > 0 && shown.length < MIN_GROUP_SIZE;
    const regions = useMemo(() => Array.from(new Set(responses.map((r) => r.participant?.region).filter(Boolean) as string[])).sort(), [responses]);

    const daysLeft = Math.ceil((new Date(survey.closesAt).getTime() - now.getTime()) / 86_400_000);
    const meta = [
        formatDateRange(survey.opensAt, survey.closesAt, survey.timezone),
        survey.status === "live" ? (daysLeft <= 1 ? "Closes today" : `Closes in ${daysLeft} days`) : survey.status === "closed" ? "Closed" : undefined,
        anonymous ? "Anonymous" : "Identified",
        locales.map((l) => l.toUpperCase()).join(" and "),
    ].filter(Boolean);

    const rewardLabel = survey.reward?.type === "points" ? "Points issued" : survey.reward?.type === "sweepstakes" ? "Entries issued" : "Spins issued";
    const ordered = useMemo(() => [...shown].sort((a, b) => b.number - a.number), [shown]);
    const openIndex = ordered.findIndex((r) => r.number === openNumber);
    const open = openIndex >= 0 ? ordered[openIndex] : undefined;
    const openResult = open ? quizResults.get(open.number) : undefined;

    const columns: TableColumn<ResultResponse>[] = [
        {
            id: "number",
            header: "Response",
            isRowHeader: true,
            sortValue: (r) => r.number,
            cell: (r) => (
                <button
                    type="button"
                    onClick={() => setOpenNumber(r.number)}
                    className="cursor-pointer rounded-sm font-medium text-primary outline-focus-ring hover:underline focus-visible:outline-2"
                >
                    #{r.number}
                </button>
            ),
        },
        ...(!anonymous
            ? ([
                  { id: "name", header: "Name", sortValue: (r) => r.participant?.name ?? "", cell: (r) => r.participant?.name },
                  { id: "account", header: "Account", cell: (r) => r.participant?.account },
                  { id: "region", header: "Region", sortValue: (r) => r.participant?.region ?? "", cell: (r) => r.participant?.region },
              ] as TableColumn<ResultResponse>[])
            : []),
        {
            id: "submitted",
            header: "Submitted",
            sortValue: (r) => r.submittedAt ?? r.startedAt,
            cellClassName: "whitespace-nowrap",
            cell: (r) => (r.submittedAt ? fmtDateTime(r.submittedAt) : <span className="text-tertiary">Started {fmtDateTime(r.startedAt)}</span>),
        },
        { id: "language", header: "Language", sortValue: (r) => r.locale, cell: (r) => r.locale.toUpperCase() },
        {
            id: "status",
            header: "Status",
            sortValue: (r) => r.status,
            cell: (r) => (
                <Badge size="sm" color={r.status === "complete" ? "success" : "gray"} dot>
                    {r.status === "complete" ? "Complete" : "Partial"}
                </Badge>
            ),
        },
        ...(quiz
            ? ([
                  {
                      id: "score",
                      header: "Score",
                      align: "right",
                      cellClassName: "whitespace-nowrap tabular-nums",
                      sortValue: (r) => quizResults.get(r.number)?.percent ?? -1,
                      cell: (r) => {
                          const result = quizResults.get(r.number);
                          return result ? (
                              `${result.score.correct} / ${result.score.total} · ${result.percent}%`
                          ) : (
                              <span className="text-quaternary">Not scored</span>
                          );
                      },
                  },
                  {
                      id: "result",
                      header: "Result",
                      sortValue: (r) => {
                          const result = quizResults.get(r.number);
                          return result ? (result.score.passed ? 2 : 1) : 0;
                      },
                      cell: (r) => <ResultBadge result={quizResults.get(r.number)} />,
                  },
              ] as TableColumn<ResultResponse>[])
            : []),
        { id: "time", header: "Time", align: "right", sortValue: (r) => r.durationSeconds ?? -1, cell: (r) => formatDuration(r.durationSeconds) },
    ];

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                    <button
                        type="button"
                        onClick={onExit}
                        className="flex cursor-pointer items-center gap-1.5 self-start rounded-sm text-sm font-medium text-tertiary outline-focus-ring hover:text-tertiary_hover focus-visible:outline-2"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Surveys
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-display-xs font-semibold text-primary">{survey.title}</h1>
                        <Badge color={statusBadge[survey.status].color} size="sm" dot>
                            {statusBadge[survey.status].label}
                        </Badge>
                    </div>
                    <p className="text-md text-tertiary">{meta.join(" · ")}</p>
                </div>
                <div className="flex shrink-0 gap-3 sm:mr-12">
                    <Button color="secondary" size="md" iconLeading={Edit05} onClick={onEditSurvey}>
                        Edit {noun}
                    </Button>
                    <Button size="md" iconLeading={Download01} onClick={() => setExportOpen(true)}>
                        Export
                    </Button>
                </div>
            </header>

            <Tabs selectedKey={tab} onSelectionChange={(k: Key) => setTab(k as typeof tab)}>
                <Tabs.List type="underline" size="sm" aria-label="Results view">
                    <Tabs.Item id="summary">Summary</Tabs.Item>
                    <Tabs.Item id="responses" badge={String(shown.length)}>
                        Responses
                    </Tabs.Item>
                </Tabs.List>
            </Tabs>

            {quizKpis ? (
                <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Kpi
                        label="Responses"
                        value={quizKpis.responses.toLocaleString("en-US")}
                        hint={
                            quizKpis.completionRate !== undefined
                                ? `${Math.round(quizKpis.completionRate * 100)}% of ${quizKpis.started} who started finished`
                                : undefined
                        }
                    />
                    <Kpi
                        label="Average score"
                        value={quizKpis.averagePercent !== undefined ? `${Math.round(quizKpis.averagePercent)}%` : "–"}
                        hint={`Median time ${formatDuration(quizKpis.medianSeconds)}`}
                    />
                    <Kpi
                        label="Pass rate"
                        value={quizKpis.passRate !== undefined ? `${Math.round(quizKpis.passRate * 100)}%` : "–"}
                        hint={`${quizKpis.passed} of ${quizKpis.responses} passed · pass mark ${survey.quiz?.passMark ?? 80}%`}
                    />
                    {survey.reward ? (
                        <Kpi
                            label={rewardLabel}
                            value={quizKpis.rewardIssued.toLocaleString("en-US")}
                            hint={
                                survey.quiz?.rewardRule === "pass"
                                    ? `Paid to the ${quizKpis.rewarded} who passed`
                                    : survey.quiz?.rewardRule === "tiered"
                                      ? `Tiered by score · ${quizKpis.rewarded} of ${quizKpis.responses} earned a tier`
                                      : "Paid on completion"
                            }
                        />
                    ) : (
                        <Kpi label="Reward" value="None" />
                    )}
                </dl>
            ) : (
                <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Kpi label="Responses" value={kpis.responses.toLocaleString("en-US")} />
                    <Kpi
                        label="Completion rate"
                        value={kpis.completionRate !== undefined ? `${Math.round(kpis.completionRate * 100)}%` : "–"}
                        hint={`${kpis.responses} of ${kpis.started} who started`}
                    />
                    <Kpi label="Median time" value={formatDuration(kpis.medianSeconds)} />
                    {survey.reward ? <Kpi label={rewardLabel} value={kpis.rewardIssued.toLocaleString("en-US")} /> : <Kpi label="Reward" value="None" />}
                </dl>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap gap-3 [&>*]:w-44">
                    <SelectField
                        hideLabel
                        label="Dates"
                        value={filters.dates}
                        options={[
                            { id: "all", label: "All dates" },
                            { id: "7d", label: "Last 7 days" },
                            { id: "24h", label: "Last 24 hours" },
                        ]}
                        onChange={(dates) => setFilters((f) => ({ ...f, dates }))}
                    />
                    {locales.length > 1 && (
                        <SelectField
                            hideLabel
                            label="Language"
                            value={filters.language}
                            options={[
                                { id: "all", label: "All languages" },
                                { id: "en", label: "English" },
                                { id: "fr", label: "French" },
                            ]}
                            onChange={(language) => setFilters((f) => ({ ...f, language }))}
                        />
                    )}
                    <SelectField
                        hideLabel
                        label="Status"
                        value={filters.includePartial ? "all" : "complete"}
                        options={[
                            { id: "complete", label: "Completed only" },
                            { id: "all", label: "Include partial" },
                        ]}
                        onChange={(v) => setFilters((f) => ({ ...f, includePartial: v === "all" }))}
                    />
                    {!anonymous && regions.length > 0 && (
                        <SelectField
                            hideLabel
                            label="Region"
                            value={filters.region ?? "all"}
                            options={[{ id: "all", label: "All regions" }, ...regions.map((r) => ({ id: r, label: r }))]}
                            onChange={(region) => setFilters((f) => ({ ...f, region: region === "all" ? undefined : region }))}
                        />
                    )}
                </div>
                {anonymous && (
                    <p className="flex items-center gap-1.5 text-sm text-tertiary">
                        <EyeOff className="size-4" aria-hidden="true" />
                        Anonymous survey: identities hidden, groups under {MIN_GROUP_SIZE} responses hidden
                    </p>
                )}
            </div>

            {shown.length === 0 ? (
                <Notice title="No responses match these filters" body="Try a wider date range or include partial responses." />
            ) : suppressed ? (
                <Notice
                    title={`Hidden: fewer than ${MIN_GROUP_SIZE} responses`}
                    body={`This survey is anonymous, so groups this small are hidden to protect who answered. Widen the filters to see results.`}
                    icon
                />
            ) : tab === "summary" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                    {quiz && <ScoreDistributionCard survey={survey} responses={shown} />}
                    {survey.questions
                        .filter((q) => q.type !== "statement")
                        .map((q) => (
                            <QuestionResultCard key={q.id} survey={survey} question={q} summary={summarize(q, shown)} />
                        ))}
                </div>
            ) : (
                <DataTable
                    aria-label="Responses"
                    columns={columns}
                    data={ordered}
                    getRowId={(r) => String(r.number)}
                    size="sm"
                    badge={null}
                    pagination
                    defaultPageSize={10}
                    defaultSortDescriptor={{ column: "number", direction: "descending" }}
                />
            )}

            {/* Response drawer */}
            <SlideoutMenu isOpen={!!open} onOpenChange={(o) => !o && setOpenNumber(null)} isDismissable>
                {open && (
                    <>
                        <SlideoutMenu.Header onClose={() => setOpenNumber(null)}>
                            <div className="flex flex-col gap-1 pr-8">
                                <Heading slot="title" className="text-lg font-semibold text-primary">
                                    Response #{open.number}
                                </Heading>
                                <p className="text-sm text-tertiary">
                                    {open.participant ? `${open.participant.name} · ${open.participant.account} · ` : ""}
                                    {open.status === "complete"
                                        ? `Submitted ${fmtDateTime(open.submittedAt)}`
                                        : `Started ${fmtDateTime(open.startedAt)}, not finished`}{" "}
                                    · {open.locale.toUpperCase()}
                                    {open.durationSeconds ? ` · ${formatDuration(open.durationSeconds)}` : ""}
                                </p>
                                {quiz && (
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {openResult ? (
                                            <>
                                                <span className="text-md font-semibold text-primary tabular-nums">
                                                    Scored {openResult.score.correct} of {openResult.score.total} · {openResult.percent}%
                                                </span>
                                                <ResultBadge result={openResult} />
                                                {survey.reward && (
                                                    <span className="text-sm text-tertiary">
                                                        {openResult.reward
                                                            ? `+${openResult.reward.amount.toLocaleString("en-US")} ${rewardUnit(openResult.reward)} earned`
                                                            : "No reward earned"}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-tertiary">Not scored: the quiz wasn't submitted.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </SlideoutMenu.Header>
                        <SlideoutMenu.Content>
                            <ol className="flex flex-col gap-5 pb-6">
                                {survey.questions
                                    .filter((q) => q.type !== "statement")
                                    .map((q) => {
                                        const t = answerText(q, open.answers[q.id]);
                                        const text = Array.isArray(t)
                                            ? q.type === "matrix"
                                                ? q.rows.map((r, i) => `${r.label}: ${t[i] || "–"}`).join("\n")
                                                : t.join(", ")
                                            : t;
                                        // Only submitted quizzes are graded; partial answers show as they are.
                                        const right = openResult && isScored(q) ? isCorrect(q, open.answers[q.id]) : undefined;
                                        const Mark = right ? CheckCircle : XCircle;
                                        return (
                                            <li key={q.id} className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-tertiary">
                                                    Q{survey.questions.indexOf(q) + 1}
                                                    {quiz && !isScored(q) && " · Not scored"}
                                                </span>
                                                <span className="text-sm font-medium text-secondary">{q.title}</span>
                                                <span className="flex items-start gap-2">
                                                    {right !== undefined && (
                                                        <Mark
                                                            className={cx(
                                                                "mt-0.5 size-5 shrink-0",
                                                                right ? "text-fg-success-primary" : "text-fg-error-primary",
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <span
                                                        className={cx("text-md whitespace-pre-line", text ? "text-primary" : "text-quaternary italic")}
                                                        lang={open.locale}
                                                    >
                                                        {right !== undefined && <span className="sr-only">{right ? "Correct: " : "Incorrect: "}</span>}
                                                        {text || "Not answered"}
                                                    </span>
                                                </span>
                                                {right === false && (
                                                    <span className="pl-7 text-sm text-tertiary">Correct answer: {correctLabels(q).join(", ")}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                            </ol>
                        </SlideoutMenu.Content>
                        <SlideoutMenu.Footer className="flex justify-between gap-3">
                            <Button
                                color="secondary"
                                size="sm"
                                iconLeading={ChevronLeft}
                                isDisabled={openIndex <= 0}
                                onClick={() => setOpenNumber(ordered[openIndex - 1].number)}
                            >
                                Newer
                            </Button>
                            <Button
                                color="secondary"
                                size="sm"
                                iconTrailing={ChevronRight}
                                isDisabled={openIndex >= ordered.length - 1}
                                onClick={() => setOpenNumber(ordered[openIndex + 1].number)}
                            >
                                Older
                            </Button>
                        </SlideoutMenu.Footer>
                    </>
                )}
            </SlideoutMenu>

            <ExportDialog
                isOpen={exportOpen}
                onOpenChange={setExportOpen}
                anonymous={anonymous}
                bilingual={locales.length > 1}
                initialIncludePartial={filters.includePartial}
                onExport={(options) => {
                    setExportOpen(false);
                    const rows = options.includePartial ? inScope : inScope.filter((r) => r.status === "complete");
                    const base = survey.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    if (options.format === "csv") {
                        download(`${base}-${options.content}.csv`, options.content === "raw" ? toRawCsv(survey, rows) : toSummaryCsv(survey, rows));
                        setToast({ id: Date.now(), message: `Exported ${rows.length} responses as CSV` });
                    } else {
                        setToast({ id: Date.now(), message: "Excel export started. It's ready in a moment." });
                    }
                    onExport?.(options);
                }}
            />

            {toast && <Toast id={toast.id} message={toast.message} onDismiss={() => setToast(null)} />}
        </div>
    );
};

const ResultBadge = ({ result }: { result?: QuizResult }) =>
    result ? (
        <Badge size="sm" color={result.score.passed ? "success" : "gray"} dot>
            {result.score.passed ? "Passed" : "Not passed"}
        </Badge>
    ) : (
        <span className="text-sm text-quaternary">–</span>
    );

/**
 * How complete responses scored, best first. A labelled pass-mark line splits
 * passing from failing scores, and passing bars say "Pass", so it never relies
 * on colour alone.
 */
const ScoreDistributionCard = ({ survey, responses }: { survey: Survey; responses: ResultResponse[] }) => {
    const { passMark, buckets, scored } = scoreDistribution(survey, responses);
    const rows = [...buckets].reverse();
    const passed = buckets.filter((b) => b.passes).reduce((s, b) => s + b.count, 0);
    const firstFail = rows.findIndex((b) => !b.passes);
    return (
        <section
            aria-labelledby="score-distribution"
            className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs lg:col-span-2"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 id="score-distribution" className="text-md font-semibold text-primary">
                    Score distribution
                </h3>
                <span className="text-xs text-tertiary">
                    {scored.toLocaleString("en-US")} scored · {passed.toLocaleString("en-US")} passed ({scored ? Math.round((passed / scored) * 100) : 0}%)
                </span>
            </div>
            <ul className="flex flex-col gap-2.5">
                {rows.map((b, i) => (
                    <li key={b.label} className="flex flex-col gap-2.5">
                        {i === firstFail && i > 0 && (
                            <div className="flex items-center gap-3 text-xs font-semibold text-tertiary" role="separator" aria-label={`Pass mark ${passMark}%`}>
                                <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-primary" />
                                Pass mark {passMark}%
                                <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-primary" />
                            </div>
                        )}
                        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_6.5rem] items-center gap-3 text-sm">
                            <span className="flex items-center gap-1.5 text-secondary">
                                {b.label}
                                {b.passes && <span className="text-xs font-semibold text-success-primary">Pass</span>}
                            </span>
                            <span aria-hidden="true" className="h-5 overflow-hidden rounded-md bg-secondary">
                                <span
                                    className={cx("block h-full rounded-md", b.passes ? "bg-success-solid" : "bg-utility-gray-400")}
                                    style={{ width: `${b.pct}%` }}
                                />
                            </span>
                            <span className="text-right text-tertiary tabular-nums">
                                <span className="font-semibold text-primary">{b.pct}%</span> · {b.count.toLocaleString("en-US")}
                                <span className="sr-only"> responses</span>
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const Kpi = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="flex flex-col gap-1 rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-display-sm font-semibold text-primary tabular-nums">{value}</dd>
        {hint && <dd className="text-xs text-tertiary">{hint}</dd>}
    </div>
);

const Notice = ({ title, body, icon }: { title: string; body: string; icon?: boolean }) => (
    <section role="status" className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-secondary bg-primary px-6 py-12 text-center">
        {icon && <EyeOff className="size-6 text-fg-quaternary" aria-hidden="true" />}
        <h2 className="text-md font-semibold text-primary">{title}</h2>
        <p className="max-w-md text-sm text-tertiary">{body}</p>
    </section>
);

const ExportDialog = ({
    isOpen,
    onOpenChange,
    anonymous,
    bilingual,
    initialIncludePartial,
    onExport,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    anonymous: boolean;
    bilingual: boolean;
    initialIncludePartial: boolean;
    onExport: (options: ExportOptions) => void;
}) => {
    const [format, setFormat] = useState<ExportOptions["format"]>("csv");
    const [content, setContent] = useState<ExportOptions["content"]>("raw");
    const [includePartial, setIncludePartial] = useState(initialIncludePartial);

    const choice = <T extends string>(label: string, value: T, set: (v: T) => void, options: { id: T; title: string; body: string }[]) => (
        <RadioGroup value={value} onChange={(v) => set(v as T)} className="flex flex-col gap-2">
            <span className="text-sm font-medium text-secondary">{label}</span>
            <div className="grid gap-2 sm:grid-cols-2">
                {options.map((o) => (
                    <Radio
                        key={o.id}
                        value={o.id}
                        className={({ isSelected, isFocusVisible }) =>
                            cx(
                                "flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ring-secondary outline-hidden ring-inset",
                                isSelected && "bg-brand-primary_alt ring-2 ring-brand",
                                isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                            )
                        }
                    >
                        {({ isSelected, isFocusVisible }) => (
                            <>
                                <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} className="mt-0.5" />
                                <span className="flex flex-col">
                                    <span className="text-sm font-semibold text-primary">{o.title}</span>
                                    <span className="text-xs text-tertiary">{o.body}</span>
                                </span>
                            </>
                        )}
                    </Radio>
                ))}
            </div>
        </RadioGroup>
    );

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
            <Modal className="max-w-lg">
                <Dialog aria-label="Export results">
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl">
                        <Heading slot="title" className="text-lg font-semibold text-primary">
                            Export results
                        </Heading>
                        {choice("Format", format, setFormat, [
                            { id: "csv", title: "CSV", body: "Opens anywhere" },
                            { id: "xlsx", title: "Excel", body: "Ready to filter and chart" },
                        ])}
                        {choice("What to export", content, setContent, [
                            { id: "raw", title: "Raw responses", body: "One row per response" },
                            { id: "summary", title: "Summary", body: "Counts and percentages per question" },
                        ])}
                        <SettingToggle label="Include partial responses" isSelected={includePartial} onChange={setIncludePartial} />
                        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-tertiary">
                            {bilingual ? "English and French answers share columns, with a language column added. " : ""}
                            {anonymous
                                ? "This survey is anonymous, so exports never include names or accounts."
                                : "Exports include each participant's name and account."}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button color="secondary" size="md" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button size="md" iconLeading={Download01} onClick={() => onExport({ format, content, includePartial })}>
                                Export
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
