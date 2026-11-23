import { ArrowRight, Calendar, CalendarDate, ClipboardCheck, PlayCircle } from "@untitledui/icons";
import { ActionRow } from "@/components/base/action-card/action-row";
import { Button } from "@/components/base/buttons/button";
import { useSurveyCopy } from "../survey-context";
import { formatSurveyDate } from "../survey-copy";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import type { SurveyLocale } from "../survey-types";
import type { ActivityItem } from "./activity-logic";
import { activityStatus, groupActivities, kindOf, pickForDashboard } from "./activity-logic";
import { describeActivity } from "./activity-view";
import { RewardBadge } from "./reward-badge";
import { SurveyDashboardCard } from "./survey-dashboard-card";

export interface DashboardActivitiesProps {
    items: ActivityItem[];
    onOpen: (item: ActivityItem, mode: "start" | "resume") => void;
    /** Opens the Surveys & quizzes page. */
    onViewAll: () => void;
    locale?: SurveyLocale;
    /** Rows under the featured card. Defaults to 2. */
    maxRows?: number;
    /**
     * `full` (default): a featured card, up to two rows and View all.
     * `compact`: one row with how many are available, the reward on offer and View all.
     */
    variant?: "full" | "compact";
    now?: Date;
}

/**
 * The dashboard's surveys and quizzes, without stacking a full card per item: the
 * most relevant one as a featured card (started first, then closing soonest, then
 * the bigger reward), up to two more as compact rows, and "View all" for the rest.
 * The `compact` variant is a single summary row instead. Renders nothing when
 * there's nothing to show.
 */
export const DashboardActivities = ({ locale = "en", ...props }: DashboardActivitiesProps) => (
    <SurveyLocaleProvider locale={locale}>
        <DashboardActivitiesInner {...props} />
    </SurveyLocaleProvider>
);

const DashboardActivitiesInner = ({ items, onOpen, onViewAll, maxRows = 2, variant = "full", now = new Date() }: Omit<DashboardActivitiesProps, "locale">) => {
    const { copy, locale } = useSurveyCopy();
    if (variant === "compact") return <CompactSummary items={items} onViewAll={onViewAll} now={now} />;
    const { featured, others, totalAvailable } = pickForDashboard(items, now, maxRows);
    if (!featured) return null;
    const hidden = totalAvailable - 1 - others.length;

    return (
        <section aria-label={copy.hubTitle} className="flex flex-col gap-3">
            <SurveyDashboardCard survey={featured.survey} response={featured.response} now={now} onOpen={(mode) => onOpen(featured, mode)} />

            {others.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-tertiary">{copy.moreToDo}</h2>
                    <ul className="flex flex-col gap-2">
                        {others.map((item) => {
                            const view = describeActivity(item, copy, locale, now, (mode) => onOpen(item, mode));
                            return (
                                <li key={item.survey.id}>
                                    <ActionRow
                                        icon={view.kindIcon}
                                        eyebrow={view.eyebrow}
                                        title={view.title}
                                        meta={view.meta?.slice(0, 2)}
                                        badge={view.badge}
                                        status={view.status}
                                        action={view.action}
                                        statusLine={view.statusLine}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {(hidden > 0 || items.length > 1) && (
                <Button color="link-color" size="sm" iconTrailing={ArrowRight} onClick={onViewAll} className="self-start">
                    {hidden > 0 ? copy.viewAll(totalAvailable) : copy.hubTitle}
                </Button>
            )}
        </section>
    );
};

/**
 * The compact dashboard summary: one row saying how many surveys and quizzes are
 * open ("1 survey and 2 quizzes available"), how many are started, when the next
 * one closes and the points on offer, with View all. With nothing open it says when
 * the next one opens; with nothing at all it renders nothing.
 */
const CompactSummary = ({ items, onViewAll, now }: { items: ActivityItem[]; onViewAll: () => void; now: Date }) => {
    const { copy, locale } = useSurveyCopy();
    const { available, upcoming } = groupActivities(items, now);
    const fmt = (iso: string, tz: string) => formatSurveyDate(iso, locale, tz);

    if (available.length === 0) {
        const next = upcoming[0];
        if (!next) return null;
        return (
            <ActionRow
                icon={ClipboardCheck}
                eyebrow={copy.hubTitle}
                title={copy.nothingOpenYet}
                status="upcoming"
                meta={[{ label: copy.nextOpens(fmt(next.survey.opensAt, next.survey.timezone)), icon: CalendarDate }]}
                action={{ label: copy.viewAllShort, onPress: onViewAll }}
            />
        );
    }

    const quizzes = available.filter((i) => kindOf(i.survey) === "quiz").length;
    const started = available.filter((i) => activityStatus(i, now) === "in_progress").length;
    const soonest = [...available].sort((a, b) => new Date(a.survey.closesAt).getTime() - new Date(b.survey.closesAt).getTime())[0];
    // Points on offer: each item's best case (a tiered quiz's top tier).
    const points = available.reduce((sum, i) => sum + (i.survey.reward?.type === "points" ? i.survey.reward.amount : 0), 0);

    return (
        <ActionRow
            icon={ClipboardCheck}
            eyebrow={copy.hubTitle}
            title={copy.availableSummary(available.length - quizzes, quizzes)}
            status={started ? "in_progress" : "new"}
            meta={[
                ...(started ? [{ label: copy.inProgressCount(started), icon: PlayCircle }] : []),
                { label: copy.closesSoonest(fmt(soonest.survey.closesAt, soonest.survey.timezone)), icon: Calendar },
            ]}
            badge={points > 0 ? <RewardBadge reward={{ type: "points", amount: points }} label={copy.earnUpTo(points)} /> : undefined}
            action={{ label: copy.viewAllShort, onPress: onViewAll }}
            className="border-brand ring-1 ring-brand ring-inset"
        />
    );
};
