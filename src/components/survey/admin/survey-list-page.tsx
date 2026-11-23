import { useMemo, useState } from "react";
import type { Key } from "react-aria-components";
import { Archive, BarChart07, ClipboardCheck, Copy06, Edit05, Eye, Plus, XCircle } from "@untitledui/icons";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { DataTable } from "@/components/base/table";
import type { TableColumn } from "@/components/base/table";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { SurveyKind, SurveyStatus } from "../survey-types";
import type { SurveyListItem, SurveyRowAction, SurveyTemplate } from "./admin-types";
import { formatDateRange, formatListReward, formatRelative, rowActionsFor, statusBadge } from "./admin-format";

type StatusTab = "all" | Exclude<SurveyStatus, "archived">;

const TABS: { id: StatusTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "draft", label: "Drafts" },
    { id: "scheduled", label: "Scheduled" },
    { id: "live", label: "Live" },
    { id: "closed", label: "Closed" },
];

const ROW_ACTIONS: Record<SurveyRowAction, { label: string; icon: typeof Edit05 }> = {
    edit: { label: "Edit", icon: Edit05 },
    preview: { label: "Preview", icon: Eye },
    results: { label: "View results", icon: BarChart07 },
    duplicate: { label: "Duplicate", icon: Copy06 },
    close: { label: "Close now", icon: XCircle },
    archive: { label: "Archive", icon: Archive },
};

export interface SurveyListPageProps {
    surveys: SurveyListItem[];
    /** Program name for the page description. */
    programName: string;
    templates: SurveyTemplate[];
    /** Opens the New survey page, which also holds the template library. */
    onNewSurvey: () => void;
    /** A starter template picked from the empty state. Opens the New survey page with it selected. */
    onUseTemplate: (template: SurveyTemplate) => void;
    onRowAction: (action: SurveyRowAction, survey: SurveyListItem) => void;
    /** Defaults to now. Set in stories so relative times never drift. */
    now?: Date;
    /** Tab shown first. Defaults to All. */
    defaultTab?: StatusTab;
    /** Kind filter shown first, when the program has quizzes. Defaults to All. */
    defaultKind?: KindFilter;
}

type KindFilter = "all" | SurveyKind;

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "survey", label: "Surveys" },
    { id: "quiz", label: "Quizzes" },
];

/**
 * Survey list (A1): page header with New survey (which holds the template library), status tabs
 * with counts, search, and a table with a ··· menu per row. With no surveys yet it
 * shows an empty state with the three starter templates.
 */
export const SurveyListPage = ({
    surveys,
    programName,
    templates,
    onNewSurvey,
    onUseTemplate,
    onRowAction,
    now = new Date(),
    defaultTab = "all",
    defaultKind = "all",
}: SurveyListPageProps) => {
    const [tab, setTab] = useState<StatusTab>(defaultTab);
    const [kind, setKind] = useState<KindFilter>(defaultKind);
    const hasQuizzes = surveys.some((s) => s.kind === "quiz" && s.status !== "archived");
    const visible = useMemo(
        () => surveys.filter((s) => s.status !== "archived" && (!hasQuizzes || kind === "all" || (s.kind ?? "survey") === kind)),
        [surveys, kind, hasQuizzes],
    );
    const rows = tab === "all" ? visible : visible.filter((s) => s.status === tab);
    const countFor = (id: StatusTab) => (id === "all" ? visible.length : visible.filter((s) => s.status === id).length);

    const columns: TableColumn<SurveyListItem>[] = [
        {
            id: "title",
            header: "Survey",
            isRowHeader: true,
            sortValue: (s) => s.title,
            cellClassName: "min-w-64",
            cell: (s) => (
                <div className="flex flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onRowAction(s.status === "live" || s.status === "closed" ? "results" : "edit", s)}
                            className="cursor-pointer rounded-sm text-left font-medium text-primary outline-focus-ring hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            {s.title}
                        </button>
                        {s.kind === "quiz" && (
                            <Badge color="brand" size="sm">
                                Quiz
                            </Badge>
                        )}
                    </span>
                    <span className="text-sm text-tertiary">
                        {s.questionCount} questions ·{" "}
                        {s.status === "draft"
                            ? `Draft saved ${formatRelative(s.updatedAt, now)}`
                            : `About ${s.minutes} min · ${s.kind === "quiz" ? "Scored" : s.anonymity === "anonymous" ? "Anonymous" : "Identified"}`}
                    </span>
                </div>
            ),
        },
        {
            id: "status",
            headerClassName: "px-3",
            cellClassName: "px-3",
            header: "Status",
            sortValue: (s) => s.status,
            cell: (s) => {
                const b = statusBadge[s.status];
                return (
                    <Badge color={b.color} size="sm" dot>
                        {b.label}
                    </Badge>
                );
            },
        },
        {
            id: "dates",
            header: "Dates",
            sortValue: (s) => s.opensAt ?? "",
            headerClassName: "px-3",
            cellClassName: "px-3 whitespace-nowrap",
            cell: (s) => (s.opensAt && s.closesAt ? formatDateRange(s.opensAt, s.closesAt, s.timezone) : <span className="text-tertiary">Not scheduled</span>),
        },
        {
            id: "responses",
            headerClassName: "px-3",
            cellClassName: "px-3",
            header: "Responses",
            align: "right",
            sortValue: (s) => s.responses ?? -1,
            cell: (s) => (s.responses !== undefined ? s.responses.toLocaleString("en-US") : <span className="text-quaternary">–</span>),
        },
        {
            id: "completion",
            headerClassName: "px-3",
            cellClassName: "px-3",
            header: "Completion",
            align: "right",
            sortValue: (s) => s.completionRate ?? -1,
            cell: (s) => (s.completionRate !== undefined ? `${Math.round(s.completionRate * 100)}%` : <span className="text-quaternary">–</span>),
        },
        {
            id: "reward",
            header: "Reward",
            sortValue: (s) => s.reward?.amount ?? 0,
            headerClassName: "px-3",
            cellClassName: "px-3 whitespace-nowrap",
            cell: (s) => formatListReward(s),
        },
        {
            id: "languages",
            headerClassName: "px-3",
            cellClassName: "px-3 whitespace-nowrap",
            header: "Languages",
            cell: (s) => s.locales.map((l) => l.toUpperCase()).join(" · "),
        },
        {
            id: "actions",
            headerClassName: "px-3",
            cellClassName: "px-3",
            header: "Actions",
            srOnlyHeader: true,
            align: "right",
            cell: (s) => <RowMenu survey={s} onAction={(action) => onRowAction(action, s)} />,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-semibold text-primary">Surveys</h1>
                    <p className="text-md text-tertiary">
                        Collect feedback from {programName} participants{hasQuizzes ? ", test what they know," : ""} and reward them for taking part.
                    </p>
                </div>
                <div className="flex shrink-0 gap-3 sm:mr-12">
                    <Button size="md" iconLeading={Plus} onClick={onNewSurvey}>
                        New survey
                    </Button>
                </div>
            </header>

            {hasQuizzes && (
                <div role="group" aria-label="Show" className="-mb-2 flex flex-wrap gap-2">
                    {KIND_FILTERS.map((k) => (
                        <button
                            key={k.id}
                            type="button"
                            aria-pressed={kind === k.id}
                            onClick={() => setKind(k.id)}
                            className={cx(
                                "cursor-pointer rounded-full px-3 py-1 text-sm font-medium ring-1 outline-focus-ring transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                                kind === k.id
                                    ? "bg-brand-primary_alt text-brand-secondary ring-brand"
                                    : "bg-primary text-secondary ring-primary hover:bg-primary_hover",
                            )}
                        >
                            {k.label}
                        </button>
                    ))}
                </div>
            )}

            {surveys.every((s) => s.status === "archived") ? (
                <EmptyState templates={templates} onUseTemplate={onUseTemplate} onNewSurvey={onNewSurvey} />
            ) : (
                <Tabs selectedKey={tab} onSelectionChange={(key: Key) => setTab(key as StatusTab)}>
                    <Tabs.List
                        type="underline"
                        size="sm"
                        aria-label="Survey status"
                        items={TABS.map((t) => ({ id: t.id, label: t.label, badge: String(countFor(t.id)) }))}
                    >
                        {(item) => <Tabs.Item {...item} />}
                    </Tabs.List>
                    <Tabs.Panel id={tab} className="pt-6">
                        <DataTable
                            aria-label={`${TABS.find((t) => t.id === tab)?.label} surveys`}
                            columns={columns}
                            data={rows}
                            getRowId={(s) => s.id}
                            badge={null}
                            size="sm"
                            tableClassName="min-w-240"
                            search={{ placeholder: hasQuizzes ? "Search surveys and quizzes" : "Search surveys", getText: (s) => s.title }}
                            defaultSortDescriptor={{ column: "dates", direction: "descending" }}
                            noResultsState={<p className="px-6 py-10 text-center text-sm text-tertiary">No surveys match your search.</p>}
                            emptyState={
                                <p className="px-6 py-10 text-center text-sm text-tertiary">
                                    No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} {kind === "quiz" ? "quizzes" : kind === "all" && hasQuizzes ? "surveys or quizzes" : "surveys"}.
                                </p>
                            }
                        />
                    </Tabs.Panel>
                </Tabs>
            )}
        </div>
    );
};

const RowMenu = ({ survey, onAction }: { survey: SurveyListItem; onAction: (action: SurveyRowAction) => void }) => (
    <Dropdown.Root>
        <Dropdown.DotsButton aria-label={`Actions for ${survey.title}`} className="p-1" />
        <Dropdown.Popover className="w-48">
            <Dropdown.Menu onAction={(key) => onAction(key as SurveyRowAction)}>
                {rowActionsFor(survey.status).map((id) => (
                    <Dropdown.Item key={id} id={id} label={ROW_ACTIONS[id].label} icon={ROW_ACTIONS[id].icon} />
                ))}
            </Dropdown.Menu>
        </Dropdown.Popover>
    </Dropdown.Root>
);

const EmptyState = ({
    templates,
    onUseTemplate,
    onNewSurvey,
}: {
    templates: SurveyTemplate[];
    onUseTemplate: (t: SurveyTemplate) => void;
    onNewSurvey: () => void;
}) => (
    <section className="flex flex-col items-center gap-8 rounded-2xl border border-secondary bg-primary px-6 py-12 text-center">
        <div className="flex max-w-lg flex-col items-center gap-4">
            <FeaturedIcon icon={ClipboardCheck} color="brand" theme="light" size="lg" />
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">Ask participants what they think</h2>
                <p className="text-md text-tertiary">
                    Build a short survey, reward people for finishing it, and see the results here. Start from a template written by Core Rewards, with French
                    included, or start blank.
                </p>
            </div>
        </div>
        <ul className="grid w-full max-w-4xl gap-4 text-left md:grid-cols-3">
            {templates.map((t) => (
                <li key={t.id}>
                    <button
                        type="button"
                        onClick={() => onUseTemplate(t)}
                        className={cx(
                            "flex h-full w-full cursor-pointer flex-col gap-3 rounded-xl border border-secondary bg-primary p-5 text-left shadow-xs outline-focus-ring transition duration-100 ease-linear",
                            "hover:border-brand hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                        )}
                    >
                        <FeaturedIcon icon={t.icon} color="gray" theme="modern" size="md" />
                        <span className="flex flex-col gap-1">
                            <span className="text-md font-semibold text-primary">{t.title}</span>
                            <span className="text-sm text-tertiary">{t.description}</span>
                        </span>
                        <span className="mt-auto text-xs text-tertiary">
                            {t.questionCount} questions · About {t.minutes} min{t.hasFrench ? " · EN and FR" : ""}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
        <Button color="link-color" size="md" onClick={onNewSurvey}>
            Browse all templates or start blank
        </Button>
    </section>
);
