import { useState } from "react";
import type { Key } from "react-aria-components";
import { Tabs } from "@/components/application/tabs/tabs";
import { ActionRow } from "@/components/base/action-card/action-row";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import type { SurveyKind, SurveyLocale } from "../survey-types";
import type { ActivityItem } from "./activity-logic";
import { groupActivities, kindOf } from "./activity-logic";
import { describeActivity } from "./activity-view";

export type SurveysPageTab = "available" | "upcoming" | "completed";

export interface SurveysPageProps {
    items: ActivityItem[];
    /** Start or resume one. */
    onOpen: (item: ActivityItem, mode: "start" | "resume") => void;
    /** The participant's language. */
    locale?: SurveyLocale;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
    initialTab?: SurveysPageTab;
}

type KindFilter = "all" | SurveyKind;

/**
 * The participant's Surveys & quizzes page: everything open to them, what's coming
 * up, and what they've finished (with the reward earned and, for quizzes, the
 * score). Started items come first, then whatever closes soonest. Items that closed
 * before they took part aren't shown. Answers to anonymous surveys never appear here.
 */
export const SurveysPage = ({ locale = "en", ...props }: SurveysPageProps) => (
    <SurveyLocaleProvider locale={locale}>
        <SurveysPageInner {...props} />
    </SurveyLocaleProvider>
);

const SurveysPageInner = ({ items, onOpen, now = new Date(), initialTab = "available" }: Omit<SurveysPageProps, "locale">) => {
    const { copy, locale } = useSurveyCopy();
    const [tab, setTab] = useState<SurveysPageTab>(initialTab);
    const [kind, setKind] = useState<KindFilter>("all");
    const groups = groupActivities(items, now);
    const hasQuizzes = items.some((i) => kindOf(i.survey) === "quiz");
    const filtered = groups[tab].filter((i) => kind === "all" || kindOf(i.survey) === kind);

    const tabs: { id: SurveysPageTab; label: string }[] = [
        { id: "available", label: copy.tabAvailable },
        { id: "upcoming", label: copy.tabUpcoming },
        { id: "completed", label: copy.tabCompleted },
    ];
    const empty = { available: copy.emptyAvailable, upcoming: copy.emptyUpcoming, completed: copy.emptyCompleted }[tab];

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-display-xs font-semibold text-primary">{copy.hubTitle}</h1>
                <p className="text-md text-tertiary">{copy.hubIntro}</p>
            </header>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <Tabs selectedKey={tab} onSelectionChange={(k: Key) => setTab(k as SurveysPageTab)} className="w-auto">
                    <Tabs.List
                        type="underline"
                        size="sm"
                        aria-label={copy.hubTitle}
                        items={tabs.map((t) => ({ id: t.id, label: t.label, badge: String(groups[t.id].length) }))}
                    >
                        {(t) => <Tabs.Item {...t} />}
                    </Tabs.List>
                </Tabs>

                {hasQuizzes && (
                    <div role="group" aria-label={copy.hubTitle} className="flex gap-2">
                        {(
                            [
                                ["all", copy.filterAll],
                                ["survey", copy.filterSurveys],
                                ["quiz", copy.filterQuizzes],
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={kind === id}
                                onClick={() => setKind(id)}
                                className={cx(
                                    "cursor-pointer rounded-full px-3 py-1 text-sm font-medium ring-1 outline-focus-ring transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                                    kind === id
                                        ? "bg-brand-primary_alt text-brand-secondary ring-brand"
                                        : "bg-primary text-secondary ring-primary hover:bg-primary_hover",
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-secondary px-6 py-12 text-center text-sm text-tertiary">
                    {groups[tab].length > 0 && kind !== "all" ? copy.emptyFilter(kind === "quiz" ? copy.filterQuizzes : copy.filterSurveys) : empty}
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {filtered.map((item) => {
                        const view = describeActivity(item, copy, locale, now, (mode) => onOpen(item, mode));
                        return (
                            <li key={item.survey.id}>
                                <ActionRow
                                    icon={view.kindIcon}
                                    eyebrow={view.eyebrow}
                                    title={view.title}
                                    meta={view.meta}
                                    badge={view.badge}
                                    status={view.status}
                                    action={view.action}
                                    statusLine={view.statusLine}
                                    statusIcon={view.statusIcon}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
