import type { FC } from "react";
import { cx } from "@/utils/cx";
import { Carousel, CarouselContent, CarouselIndicators, CarouselNext, CarouselPlayToggle, CarouselPrevious, CarouselSlide } from "./carousel";
import type { CarouselImageSlide, SlideCarouselProps } from "./slide-carousel-types";

/** Placeholders shown while loading. Enough to fill the widest sensible layout. */
const SKELETON_SLIDES = 6;
/** Slides whose images load straight away; later ones wait until they are near. */
const EAGER_SLIDES = 5;

const frameStyles = (rounded: boolean) => cx("relative block aspect-(--carousel-aspect) w-full overflow-hidden bg-secondary", rounded && "rounded-xl");

// Inset, because the viewport clips anything drawn outside the slide.
const focusStyles = "outline-brand focus-visible:outline-2 focus-visible:-outline-offset-2";

interface ImageSlideProps {
    slide: CarouselImageSlide;
    index: number;
    rounded: boolean;
    /** Leave room at the bottom for markers laid over the image. */
    clearIndicators: boolean;
    onClick?: (slide: CarouselImageSlide, index: number) => void;
}

const ImageSlide: FC<ImageSlideProps> = ({ slide, index, rounded, clearIndicators, onClick }) => {
    const hasCaption = !!(slide.title || slide.description);

    const content = (
        <>
            <img
                src={slide.src}
                srcSet={slide.srcSet}
                sizes={slide.sizes}
                alt={slide.alt}
                loading={index < EAGER_SLIDES ? "eager" : "lazy"}
                draggable={false}
                className="pointer-events-none size-full object-cover"
            />
            {hasCaption && (
                <span className={cx("absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-black/70 to-transparent p-5 pt-16 text-left text-white", clearIndicators && "pb-14")}>
                    {slide.title && <span className="text-lg font-semibold md:text-display-xs">{slide.title}</span>}
                    {slide.description && <span className="text-sm text-white/85 md:text-md">{slide.description}</span>}
                </span>
            )}
        </>
    );

    if (slide.href) {
        return (
            <a href={slide.href} className={cx(frameStyles(rounded), focusStyles)}>
                {content}
            </a>
        );
    }
    if (onClick) {
        return (
            <button type="button" onClick={() => onClick(slide, index)} className={cx(frameStyles(rounded), focusStyles, "cursor-pointer")}>
                {content}
            </button>
        );
    }
    return <div className={frameStyles(rounded)}>{content}</div>;
};

/**
 * An image carousel assembled from the `Carousel` parts, configured by props.
 *
 * Layout (`slidesPerView`, `gap`, `aspectRatio`), movement (`loop`, `align`,
 * `slidesToScroll`, `dragFree`, `autoplay`) and chrome (`arrows`, `indicators`,
 * `playButton`) are independent, so any combination works. For a layout these
 * props cannot express, compose the parts in `./carousel` directly.
 */
export const SlideCarousel: FC<SlideCarouselProps> = ({
    slides,
    renderSlide,
    onSlideClick,
    arrows = "overlay",
    indicators = "dots",
    indicatorPlacement = "below",
    playButton = true,
    rounded = true,
    slideClassName,
    isLoading = false,
    className,
    ...carouselProps
}) => {
    if (isLoading || slides.length === 0) {
        return (
            <Carousel {...carouselProps} autoplay={false} draggable={false} wheel={false} className={className}>
                <CarouselContent>
                    {Array.from({ length: SKELETON_SLIDES }, (_, index) => (
                        <CarouselSlide key={index} aria-hidden="true" className={slideClassName}>
                            <div className={cx(frameStyles(rounded), "animate-pulse bg-quaternary motion-reduce:animate-none")} />
                        </CarouselSlide>
                    ))}
                </CarouselContent>
                {isLoading && <span className="sr-only">Loading slides</span>}
            </Carousel>
        );
    }

    const hasAutoplay = !!carouselProps.autoplay;
    const showPlay = hasAutoplay && playButton;
    const overlayMarkers = !!indicators && indicatorPlacement === "overlay";
    const belowMarkers = !!indicators && indicatorPlacement === "below";
    const hasBelowRow = arrows === "below" || belowMarkers;
    // The pause button joins whichever row of markers exists, or takes a corner.
    const playPlacement = !showPlay ? null : overlayMarkers ? "markers-overlay" : hasBelowRow ? "below" : "corner";

    return (
        <Carousel {...carouselProps} className={cx("flex flex-col gap-4", className)}>
            <div className={cx("flex items-center", arrows === "outside" && "gap-3")}>
                {arrows === "outside" && <CarouselPrevious variant="outline" />}

                <div className="relative min-w-0 flex-1">
                    {/* Ahead of the slides in tab order, so the motion can be stopped before tabbing through it. */}
                    {playPlacement === "corner" && <CarouselPlayToggle variant="overlay" className="absolute right-3 bottom-3 z-10" />}

                    <CarouselContent>
                        {slides.map((slide, index) => (
                            <CarouselSlide key={slide.id} className={slideClassName}>
                                {renderSlide ? (
                                    renderSlide(slide, index)
                                ) : (
                                    <ImageSlide slide={slide} index={index} rounded={rounded} clearIndicators={overlayMarkers} onClick={onSlideClick} />
                                )}
                            </CarouselSlide>
                        ))}
                    </CarouselContent>

                    {arrows === "overlay" && (
                        <>
                            <CarouselPrevious variant="overlay" className="absolute top-1/2 left-3 z-10 -translate-y-1/2" />
                            <CarouselNext variant="overlay" className="absolute top-1/2 right-3 z-10 -translate-y-1/2" />
                        </>
                    )}

                    {overlayMarkers && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2 *:pointer-events-auto">
                            {playPlacement === "markers-overlay" && <CarouselPlayToggle variant="overlay" />}
                            <CarouselIndicators variant={indicators || undefined} tone="overlay" />
                        </div>
                    )}
                </div>

                {arrows === "outside" && <CarouselNext variant="outline" />}
            </div>

            {hasBelowRow && (
                <div className="flex items-center justify-center gap-3">
                    {playPlacement === "below" && <CarouselPlayToggle variant="outline" />}
                    {arrows === "below" && <CarouselPrevious variant="outline" />}
                    {belowMarkers && <CarouselIndicators variant={indicators || undefined} />}
                    {arrows === "below" && <CarouselNext variant="outline" />}
                </div>
            )}
        </Carousel>
    );
};
