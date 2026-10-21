import { useId, useMemo } from "react";
import type { FC } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Carousel, CarouselContent, CarouselIndicators, CarouselNext, CarouselPrevious, CarouselSlide } from "@/components/base/carousel/carousel";
import type { CarouselProps } from "@/components/base/carousel/carousel";
import { cx } from "@/utils/cx";
import { PromotionCard, PromotionCardSkeleton, PromotionViewAllCard } from "./promotion-card";
import type { CalendarTarget } from "./promotion-calendar";
import type { PromotionCardData } from "./promotion-card-types";
import { comparePromotionsByUrgency, getPromotionTiming } from "./promotion-card-utils";

/**
 * - `paged-grid`: one, two then three cards across, paging a full row at a time.
 * - `centered-peek`: one card centred with its neighbours peeking in, looping.
 */
export type PromotionCarouselLayout = "paged-grid" | "centered-peek";

const LAYOUTS: Record<PromotionCarouselLayout, Partial<CarouselProps>> = {
    "paged-grid": { slidesPerView: { base: 1, sm: 2, lg: 3 }, slidesToScroll: "auto", gap: { base: 16, md: 24 } },
    "centered-peek": { slidesPerView: { base: 1.15, sm: 1.8, lg: 2.6 }, align: "center", loop: true, gap: { base: 12, md: 24 } },
};

const SKELETON_CARDS = 3;

export interface PromotionCarouselProps {
    promotions: PromotionCardData[];
    layout?: PromotionCarouselLayout;
    /** Section heading. Leave off when the page already names the row. */
    title?: string;
    /**
     * All Promotions page. Adds a link in the header, and in the grid a closing
     * tile after the cards. The peek loops, so it has no last tile to add.
     */
    viewAllHref?: string;
    /**
     * Ending-soonest first, then live, then upcoming. Defaults to true; turn off
     * to keep a curated order.
     */
    sortByUrgency?: boolean;
    /** Leave ended and cancelled promotions out. Defaults to true. */
    hideClosed?: boolean;
    onEnroll?: (promotion: PromotionCardData) => void;
    onAddToCalendar?: (promotion: PromotionCardData, target: CalendarTarget) => void;
    /** Id of the promotion whose enrollment is in flight. */
    enrollingId?: string;
    endingSoonDays?: number;
    now?: Date;
    isLoading?: boolean;
    /** Names the carousel for assistive tech. Defaults to `title`, then `Promotions`. */
    label?: string;
    className?: string;
}

/**
 * Promotion cards on the `Carousel` parts, in one of the two `SlideCarousel`
 * layouts that suit cards. Arrows sit outside the cards in the grid and below
 * them in the peek, so they never cover a button on a card.
 */
export const PromotionCarousel: FC<PromotionCarouselProps> = ({
    promotions,
    layout = "paged-grid",
    title,
    viewAllHref,
    sortByUrgency = true,
    hideClosed = true,
    onEnroll,
    onAddToCalendar,
    enrollingId,
    endingSoonDays = 7,
    now,
    isLoading = false,
    label,
    className,
}) => {
    const today = useMemo(() => now ?? new Date(), [now]);

    const visible = useMemo(() => {
        const list = hideClosed ? promotions.filter((promotion) => getPromotionTiming(promotion, today, endingSoonDays).isOpen) : [...promotions];
        return sortByUrgency ? list.sort(comparePromotionsByUrgency(today, endingSoonDays)) : list;
    }, [promotions, hideClosed, sortByUrgency, today, endingSoonDays]);

    const isGrid = layout === "paged-grid";
    const generatedId = useId();
    const headingId = title ? generatedId : undefined;

    const header = (title || viewAllHref) && (
        <div className="flex items-end justify-between gap-4">
            {title && (
                <h2 id={headingId} className="text-display-xs font-semibold text-primary">
                    {title}
                </h2>
            )}
            {viewAllHref && (
                <Button color="link-color" size="md" href={viewAllHref} iconTrailing={ArrowRight} className="ml-auto">
                    View all
                </Button>
            )}
        </div>
    );

    if (!isLoading && visible.length === 0) {
        return (
            <section aria-labelledby={headingId} className={cx("flex flex-col gap-5", className)}>
                {header}
                <div className="rounded-2xl border border-dashed border-secondary p-8 text-center text-sm text-tertiary">No promotions are running right now. Check back soon.</div>
            </section>
        );
    }

    return (
        <section aria-labelledby={headingId} className={cx("flex flex-col gap-5", className)}>
            {header}
            <Carousel {...LAYOUTS[layout]} label={label ?? title ?? "Promotions"} draggable={!isLoading} className="flex flex-col gap-5">
                <div className={cx("flex items-center", isGrid && "gap-3")}>
                    {isGrid && <CarouselPrevious variant="outline" className="max-sm:hidden" />}
                    <div className="min-w-0 flex-1">
                        <CarouselContent>
                            {isLoading
                                ? Array.from({ length: SKELETON_CARDS }, (_, index) => (
                                      <CarouselSlide key={index}>
                                          <PromotionCardSkeleton />
                                      </CarouselSlide>
                                  ))
                                : [
                                      ...visible.map((promotion) => (
                                          <CarouselSlide key={promotion.id}>
                                              <PromotionCard
                                                  promotion={promotion}
                                                  onEnroll={onEnroll}
                                                  onAddToCalendar={onAddToCalendar}
                                                  isEnrolling={enrollingId === promotion.id}
                                                  endingSoonDays={endingSoonDays}
                                                  now={today}
                                                  headingLevel={title ? 3 : 2}
                                              />
                                          </CarouselSlide>
                                      )),
                                      viewAllHref && isGrid ? (
                                          <CarouselSlide key="view-all">
                                              <PromotionViewAllCard href={viewAllHref} count={visible.length} />
                                          </CarouselSlide>
                                      ) : null,
                                  ]}
                        </CarouselContent>
                    </div>
                    {isGrid && <CarouselNext variant="outline" className="max-sm:hidden" />}
                </div>

                {!isLoading && (
                    <div className="flex items-center justify-center gap-3">
                        {/* On phones the grid's side arrows would squeeze the card, so they move down here. */}
                        <CarouselPrevious variant="outline" className={cx(isGrid && "sm:hidden")} />
                        <CarouselIndicators variant="dots" />
                        <CarouselNext variant="outline" className={cx(isGrid && "sm:hidden")} />
                    </div>
                )}
                {isLoading && <span className="sr-only">Loading promotions</span>}
            </Carousel>
        </section>
    );
};
