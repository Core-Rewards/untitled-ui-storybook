import { useMemo } from "react";
import type { CSSProperties, FC, ReactNode } from "react";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";
import { MilestoneBadge } from "./milestone-badge";
import type { Milestone, MilestoneType, MilestoneUnit, ResolvedMilestone } from "./milestone-timeline-types";
import {
    badgeCaption,
    dateText,
    milestoneLabel,
    progressFraction,
    progressSummary,
    resolveMilestones,
    statusText,
    tenureYears,
} from "./milestone-timeline-utils";

const BADGE_PX = { sm: 44, md: 64 } as const;

const styles = sortCx({
    track: "absolute h-1.5 rounded-full bg-quaternary",
    fillX: "h-full origin-left rounded-full bg-linear-to-r from-brand-400 to-brand-600 motion-safe:animate-[milestone-fill-x_1.1s_cubic-bezier(0.2,0.7,0.2,1)_200ms_both]",
    fillY: "w-full origin-top rounded-full bg-linear-to-b from-brand-400 to-brand-600 motion-safe:animate-[milestone-fill-y_1.1s_cubic-bezier(0.2,0.7,0.2,1)_200ms_both]",
    marker: "absolute -translate-x-1/2 rounded-md bg-brand-solid px-2 py-0.5 text-[10px] font-semibold tracking-wider whitespace-nowrap text-white uppercase",
    markerArrow: "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-(--color-bg-brand-solid)",
    eyebrow: "text-xs font-semibold tracking-wider text-tertiary uppercase",
    title: "text-sm leading-tight font-semibold text-primary",
    readyChip: "rounded-full bg-brand-solid px-2 py-0.5 font-semibold text-white",
    action: "rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4",
    image: "size-12 rounded-lg border border-secondary bg-secondary object-cover",
});

export interface MilestoneTimelineProps {
    /** Milestones in any order; they are sorted by `value`. */
    milestones: Milestone[];
    /** What milestones count. Defaults to `years`. */
    type?: MilestoneType;
    /** What `activity` milestones count, e.g. `{ singular: "course", plural: "courses" }`. */
    unit?: MilestoneUnit;
    /** Hire or enrollment date (`YYYY-MM-DD`). For `years`, sets every anniversary date and, unless `progress` is given, the tenure. */
    startDate?: string;
    /** Years of service (fractional) or activities completed. `years` timelines work it out from `startDate` when left off. */
    progress?: number;
    /** Today, for countdowns and tenure. Pass a fixed date to keep stories and tests stable. */
    now?: Date;
    /** Milestones whose product reward has already been redeemed. */
    redeemedIds?: string[];
    /** When rewards began (`YYYY-MM-DD`). Milestones reached before it are celebrated but pay nothing. */
    rewardsStartDate?: string;
    /** What shows under each title: a status (`Ready to redeem`, `In 120 days`) or the month it was or will be reached. */
    detail?: "status" | "date";
    /** `sm` suits a card or sidebar; `md` a page section. */
    size?: "sm" | "md";
    /** `auto` is horizontal when the container is at least 672px wide and vertical below that. */
    layout?: "auto" | "horizontal" | "vertical";
    /** Shows the "You are here" marker on the track. */
    showCurrentMarker?: boolean;
    currentMarkerLabel?: string;
    /** Shows product photos under their titles. */
    showRewardImages?: boolean;
    /** Makes ready badges buttons. */
    onRedeem?: (milestone: ResolvedMilestone) => void;
    /** Makes ready badges links. Takes priority over `onRedeem`. */
    getRedeemHref?: (milestone: ResolvedMilestone) => string;
    className?: string;
}

/**
 * A row of milestones on a progress track, e.g. service anniversaries or
 * courses completed, each with its reward and where the participant stands.
 * Horizontal on wide containers, vertical on narrow ones.
 */
export const MilestoneTimeline: FC<MilestoneTimelineProps> = ({
    milestones,
    type = "years",
    unit,
    startDate,
    progress: progressProp,
    now: nowProp,
    redeemedIds,
    rewardsStartDate,
    detail = "status",
    size = "md",
    layout = "auto",
    showCurrentMarker = true,
    currentMarkerLabel = "You are here",
    showRewardImages = false,
    onRedeem,
    getRedeemHref,
    className,
}) => {
    const now = useMemo(() => nowProp ?? new Date(), [nowProp]);
    const progress = progressProp ?? (type === "years" && startDate ? tenureYears(startDate, now) : 0);

    const resolved = useMemo(
        () => resolveMilestones(milestones, { type, progress, startDate, redeemedIds, rewardsStartDate }),
        [milestones, type, progress, startDate, redeemedIds, rewardsStartDate],
    );

    if (resolved.length === 0) return null;

    const fraction = progressFraction(
        resolved.map((m) => m.value),
        progress,
    );
    const columns = resolved.length;
    const d = BADGE_PX[size];
    // The horizontal track runs between the centers of the first and last columns.
    const inset = `${50 / columns}%`;

    const label = (m: ResolvedMilestone) => milestoneLabel(m, type, unit);
    const detailText = (m: ResolvedMilestone) =>
        detail === "date" ? (dateText(m) ?? statusText(m, type, progress, now, unit)) : statusText(m, type, progress, now, unit);

    const badgeLabel = (m: ResolvedMilestone) => {
        const name = type === "years" ? `${m.value}-year milestone` : `${label(m)} milestone`;
        const where = {
            ready: "reached, reward ready to redeem",
            redeemed: m.reward.type === "points" ? "reached, points added" : "reached, reward redeemed",
            reached: "reached",
            next: "up next",
            upcoming: "upcoming",
        }[m.state];
        return `${name}, ${where}`;
    };

    const badge = (m: ResolvedMilestone, badgeSize: "sm" | "md") => {
        const node = (
            <MilestoneBadge
                value={m.value}
                caption={badgeCaption(m.value, type, unit)}
                state={m.state}
                rewardType={m.reward.type}
                size={badgeSize}
                label={badgeLabel(m)}
            />
        );
        if (m.state !== "ready") return node;

        const actionLabel = `Redeem your ${label(m)} reward: ${m.title}`;
        if (getRedeemHref) {
            return (
                <AriaLink href={getRedeemHref(m)} aria-label={actionLabel} className={styles.action}>
                    {node}
                </AriaLink>
            );
        }
        if (onRedeem) {
            return (
                <AriaButton onPress={() => onRedeem(m)} aria-label={actionLabel} className={cx(styles.action, "cursor-pointer")}>
                    {node}
                </AriaButton>
            );
        }
        return node;
    };

    const image = (m: ResolvedMilestone): ReactNode =>
        showRewardImages && m.reward.type === "product" && m.reward.imageSrc ? <img src={m.reward.imageSrc} alt="" className={styles.image} /> : null;

    const horizontal = layout === "horizontal" ? "block" : layout === "vertical" ? "hidden" : "hidden @2xl:block";
    const vertical = layout === "vertical" ? "block" : layout === "horizontal" ? "hidden" : "@2xl:hidden";

    return (
        <div className={cx("@container", className)}>
            <p className="sr-only">{progressSummary(resolved, type, progress, now, unit)}</p>

            {/* ── Horizontal ─────────────────────────────────────────────── */}
            <div className={cx(horizontal, showCurrentMarker && "pt-11")}>
                <div className="relative">
                    <div className={styles.track} style={{ left: inset, right: inset, top: d / 2 - 3 }} aria-hidden="true">
                        <div className={styles.fillX} style={{ width: `${fraction * 100}%` }} />
                        {showCurrentMarker && (
                            <span className={styles.marker} style={{ left: `${fraction * 100}%`, top: -(d / 2 + 32) }}>
                                {currentMarkerLabel}
                                <span className={styles.markerArrow} />
                            </span>
                        )}
                    </div>

                    <ol
                        aria-label="Milestones"
                        className="relative grid"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } as CSSProperties}
                    >
                        {resolved.map((m) => (
                            <li key={m.id} className="flex flex-col items-center text-center">
                                {badge(m, size)}
                                <p className={cx(styles.eyebrow, size === "sm" ? "mt-2.5" : "mt-3")}>{label(m)}</p>
                                <p className={cx(styles.title, "mt-1 px-1")}>{m.title}</p>
                                {image(m) && <div className="mt-2">{image(m)}</div>}
                                <p className={cx("mt-1.5 text-xs", m.state === "ready" && detail === "status" ? styles.readyChip : "text-tertiary")}>
                                    {detailText(m)}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* ── Vertical ───────────────────────────────────────────────── */}
            <ol aria-label="Milestones" className={cx("space-y-4", vertical)}>
                {resolved.map((m, i) => (
                    <li key={m.id} className="relative flex items-start gap-4">
                        {/* One connector per row, from this badge's center to the next, so rows of any height stay joined. */}
                        {i < columns - 1 && (
                            <span className="absolute top-5.5 left-5 h-[calc(100%+1rem)] w-1 bg-quaternary" aria-hidden="true">
                                <span
                                    className={cx(styles.fillY, "block")}
                                    style={{ height: `${Math.min(Math.max(fraction * (columns - 1) - i, 0), 1) * 100}%` }}
                                />
                            </span>
                        )}
                        <span className="relative flex">{badge(m, "sm")}</span>
                        <div className="min-w-0 flex-1 self-center">
                            <p className={styles.title}>
                                {label(m)} · {m.title}
                            </p>
                            <p className={cx("mt-0.5 text-xs", m.state === "ready" ? "font-semibold text-brand-secondary" : "text-tertiary")}>
                                {detailText(m)}
                            </p>
                        </div>
                        {image(m)}
                    </li>
                ))}
            </ol>
        </div>
    );
};
