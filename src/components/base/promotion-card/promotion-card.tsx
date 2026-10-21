import type { FC } from "react";
import { Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { ArrowRight, Calendar, CalendarPlus01, CheckCircle, CoinsStacked01, Download01, Stars02, Zap } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";
import { formatNumber } from "@/utils/format";
import { CALENDAR_TARGET_LABELS, calendarHref, icsFileName } from "./promotion-calendar";
import type { CalendarTarget } from "./promotion-calendar";
import type { PromotionCardData, PromotionCardProps } from "./promotion-card-types";
import { formatOffer, formatOfferHeadline, formatPromotionDateRange, getPromotionTiming } from "./promotion-card-utils";

/** Qualifying products listed before the rest are summed up as `+N more`. */
const VISIBLE_PRODUCTS = 3;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    // h-full so cards in a carousel row or grid line up whatever their content.
    root: "flex h-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary ring-inset",
    header: "relative aspect-video w-full shrink-0 overflow-hidden",
    headerImage: "pointer-events-none size-full object-cover",
    headerLogo: "flex size-full items-center justify-center border-b border-secondary bg-secondary_subtle p-8",
    headerFallback: "flex size-full flex-col items-center justify-center bg-brand-section text-center",
    offerPill: "absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand-solid px-2.5 py-1 text-xs font-semibold text-white shadow-sm",
    statusBadge: "absolute top-3 right-3 shadow-sm",
    body: "flex flex-1 flex-col gap-3 p-5",
    meta: "flex items-center gap-1.5 text-sm text-tertiary",
    name: "line-clamp-2 text-lg font-semibold text-primary",
    description: "line-clamp-3 text-sm text-tertiary",
    potential: "flex items-center gap-1.5 text-sm font-semibold text-brand-secondary",
    personal: "flex flex-col gap-2 rounded-lg bg-secondary_subtle p-3 ring-1 ring-secondary ring-inset",
    footer: "mt-auto flex items-center gap-3 px-5 pb-5",
});

// ── Parts ─────────────────────────────────────────────────────────────────────

const Header: FC<{ promotion: PromotionCardData }> = ({ promotion }) => {
    const { media, offer } = promotion;

    if (media?.type === "image") {
        return <img src={media.src} alt={media.alt} loading="lazy" draggable={false} className={styles.headerImage} />;
    }
    if (media?.type === "logo") {
        return (
            <div className={styles.headerLogo}>
                <img src={media.src} alt={media.alt} loading="lazy" draggable={false} className="pointer-events-none max-h-full max-w-[70%] object-contain" />
            </div>
        );
    }
    // No art: the offer itself becomes the header. Decorative, since the pill says it in words.
    return (
        <div className={styles.headerFallback} aria-hidden="true">
            <span className="text-display-lg font-bold tracking-tight text-white">{formatOfferHeadline(offer)}</span>
            {offer.kind !== "custom" && <span className="text-sm font-medium tracking-wide text-white/80 uppercase">{offer.kind === "bonus" ? "Bonus points" : "Points"}</span>}
        </div>
    );
};

const ProgressBar: FC<{ current: number; target: number; label: string }> = ({ current, target, label }) => {
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return (
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(current, target)} className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
            <div className="h-full rounded-full bg-brand-solid transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
    );
};

const CALENDAR_TARGETS: CalendarTarget[] = ["google", "outlook", "office365", "ics"];

/**
 * Icon button that opens a menu of calendars. The web calendars open in a new
 * tab with the event filled in; the `.ics` item downloads a file. Links are
 * built when the menu opens, so a row of cards does no work until asked.
 */
const AddToCalendarMenu: FC<{ promotion: PromotionCardData; onSelect?: (target: CalendarTarget) => void }> = ({ promotion, onSelect }) => (
    <MenuTrigger>
        <Button color="secondary" size="md" iconLeading={CalendarPlus01} aria-label={`Add ${promotion.name} to calendar`} />
        <Popover
            placement="top end"
            offset={6}
            className="w-64 origin-bottom-right rounded-lg bg-primary py-1.5 shadow-lg ring-1 ring-secondary ring-inset entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95"
        >
            <Menu aria-label="Add to calendar" className="outline-none" onAction={(key) => onSelect?.(key as CalendarTarget)}>
                {CALENDAR_TARGETS.map((target) => (
                    <MenuItem
                        key={target}
                        id={target}
                        href={calendarHref(target, promotion)}
                        {...(target === "ics" ? { download: icsFileName(promotion) } : { target: "_blank", rel: "noreferrer" })}
                        className="flex cursor-pointer items-center px-3.5 py-2 text-sm font-medium text-secondary outline-none focus:bg-primary_hover hover:bg-primary_hover"
                    >
                        {CALENDAR_TARGET_LABELS[target]}
                    </MenuItem>
                ))}
            </Menu>
        </Popover>
    </MenuTrigger>
);

// ── Card ──────────────────────────────────────────────────────────────────────

/**
 * One promotion, sized to sit in a carousel row or a grid.
 *
 * Reads top to bottom in the order a participant decides: what it pays (the
 * offer pill), whether it is still running (the countdown), what it is, how to
 * earn, and how far along they are. The countdown is worked out from the dates,
 * so it stays right without the program updating a status.
 */
export const PromotionCard: FC<PromotionCardProps> = ({
    promotion,
    onEnroll,
    isEnrolling = false,
    showAddToCalendar = true,
    onAddToCalendar,
    endingSoonDays = 7,
    now,
    headingLevel = 3,
    className,
}) => {
    const Heading = `h${headingLevel}` as const;
    const timing = getPromotionTiming(promotion, now, endingSoonDays);
    const offerLabel = formatOffer(promotion.offer);

    const { enrollment, progress, pointsEarned, eligibleProducts = [] } = promotion;
    const needsEnrollment = !!enrollment && !enrollment.enrolled && timing.isOpen;
    const hasPersonal = pointsEarned !== undefined || !!progress || !!enrollment?.enrolled;
    const extraProducts = eligibleProducts.length - VISIBLE_PRODUCTS;
    const hasFlags = !!promotion.isNew || !!promotion.recommended;
    const calendar = showAddToCalendar && timing.isOpen && <AddToCalendarMenu promotion={promotion} onSelect={(target) => onAddToCalendar?.(promotion, target)} />;

    return (
        <article className={cx(styles.root, !timing.isOpen && "opacity-70 grayscale", className)} aria-label={`${promotion.name}, ${offerLabel}`}>
            <div className={styles.header}>
                <Header promotion={promotion} />
                <span className={styles.offerPill}>
                    <Zap className="size-3.5" aria-hidden="true" />
                    {offerLabel}
                </span>
                <Badge color={timing.color} size="sm" dot className={styles.statusBadge}>
                    {timing.label}
                </Badge>
            </div>

            <div className={styles.body}>
                {hasFlags && (
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1.5">
                            {promotion.recommended && (
                                <Badge color="brand" size="sm">
                                    <Stars02 className="size-3" aria-hidden="true" />
                                    Recommended for you
                                </Badge>
                            )}
                            {promotion.isNew && (
                                <Badge color="blue" size="sm">
                                    New
                                </Badge>
                            )}
                        </div>
                        {promotion.recommended?.reason && <p className="text-xs text-tertiary">{promotion.recommended.reason}</p>}
                    </div>
                )}

                <p className={styles.meta}>
                    <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span className="sr-only">Runs </span>
                    <time dateTime={`${promotion.startDate}/${promotion.endDate}`}>{formatPromotionDateRange(promotion.startDate, promotion.endDate)}</time>
                </p>

                <Heading className={styles.name}>{promotion.name}</Heading>
                <p className={styles.description}>{promotion.description}</p>

                {promotion.earnPotential && (
                    <p className={styles.potential}>
                        <CoinsStacked01 className="size-4 shrink-0" aria-hidden="true" />
                        {promotion.earnPotential}
                    </p>
                )}

                {eligibleProducts.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Qualifying products">
                        {eligibleProducts.slice(0, VISIBLE_PRODUCTS).map((product) => (
                            <li key={product}>
                                <Badge size="sm" type="badge-color">
                                    {product}
                                </Badge>
                            </li>
                        ))}
                        {extraProducts > 0 && (
                            <li>
                                <Badge size="sm" type="badge-modern">
                                    +{extraProducts} more
                                </Badge>
                            </li>
                        )}
                    </ul>
                )}

                {hasPersonal && (
                    <div className={styles.personal}>
                        {(enrollment?.enrolled || pointsEarned !== undefined) && (
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                {pointsEarned !== undefined && (
                                    <span className="text-secondary">
                                        You've earned <span className="font-semibold text-primary">{formatNumber(pointsEarned)} pts</span>
                                    </span>
                                )}
                                {enrollment?.enrolled && (
                                    <span className="inline-flex items-center gap-1 font-medium text-success-primary">
                                        <CheckCircle className="size-4" aria-hidden="true" />
                                        Enrolled
                                    </span>
                                )}
                            </div>
                        )}
                        {progress && (
                            <div className="flex flex-col gap-1.5">
                                <ProgressBar current={progress.current} target={progress.target} label={`Progress: ${progress.unit}`} />
                                <span className="text-xs text-tertiary">
                                    {formatNumber(progress.current)} of {formatNumber(progress.target)} {progress.unit}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                {needsEnrollment ? (
                    <>
                        <Button color="primary" size="md" className="flex-1" isLoading={isEnrolling} showTextWhileLoading onClick={() => onEnroll?.(promotion)}>
                            Enroll now
                        </Button>
                        <Button color="link-color" size="md" href={promotion.href} aria-label={`Details for ${promotion.name}`}>
                            Details
                        </Button>
                        {calendar}
                    </>
                ) : (
                    <>
                        <Button color="secondary" size="md" className="flex-1" href={promotion.href} iconTrailing={ArrowRight} aria-label={`${promotion.ctaLabel ?? "View details"}: ${promotion.name}`}>
                            {promotion.ctaLabel ?? "View details"}
                        </Button>
                        {promotion.flyerUrl && (
                            <Button color="link-gray" size="md" href={promotion.flyerUrl} target="_blank" rel="noreferrer" iconLeading={Download01} aria-label={`Flyer for ${promotion.name} (PDF)`}>
                                Flyer
                            </Button>
                        )}
                        {calendar}
                    </>
                )}
            </div>
        </article>
    );
};

// ── View all ──────────────────────────────────────────────────────────────────

export interface PromotionViewAllCardProps {
    href: string;
    /** Defaults to `View all promotions`. */
    label?: string;
    /** Live and upcoming promotions, shown as `12 live and upcoming`. */
    count?: number;
    className?: string;
}

/** The last tile in a promotion row, linking to the full list. Matches the height of the cards beside it. */
export const PromotionViewAllCard: FC<PromotionViewAllCardProps> = ({ href, label = "View all promotions", count, className }) => (
    <a
        href={href}
        className={cx(
            "group flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-secondary bg-secondary_subtle p-6 text-center",
            "transition duration-150 ease-linear hover:border-brand hover:bg-brand-primary",
            "outline-brand focus-visible:outline-2 focus-visible:-outline-offset-2",
            className,
        )}
    >
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-solid text-white shadow-sm transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none">
            <ArrowRight className="size-6" aria-hidden="true" />
        </span>
        <span className="text-md font-semibold text-primary">{label}</span>
        {count !== undefined && <span className="text-sm text-tertiary">{formatNumber(count)} live and upcoming</span>}
    </a>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

/** Placeholder with the card's proportions, for while promotions load. */
export const PromotionCardSkeleton: FC<{ className?: string }> = ({ className }) => {
    const bar = "rounded bg-quaternary animate-pulse motion-reduce:animate-none";
    return (
        <div aria-hidden="true" className={cx(styles.root, className)}>
            <div className={cx(styles.header, "animate-pulse bg-quaternary motion-reduce:animate-none")} />
            <div className={styles.body}>
                <span className={cx(bar, "h-3.5 w-2/5")} />
                <span className={cx(bar, "h-5 w-4/5")} />
                <span className={cx(bar, "h-3.5 w-full")} />
                <span className={cx(bar, "h-3.5 w-3/4")} />
            </div>
            <div className={styles.footer}>
                <span className={cx(bar, "h-10 flex-1 rounded-lg")} />
            </div>
        </div>
    );
};
