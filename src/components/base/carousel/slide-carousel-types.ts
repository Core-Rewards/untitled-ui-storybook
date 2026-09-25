import type { ReactNode } from "react";
import type { CarouselIndicatorVariant, CarouselProps } from "./carousel";

/** One image in the carousel. */
export interface CarouselImageSlide {
    id: string;
    src: string;
    /** Describes the image. Use `""` only for purely decorative imagery. */
    alt: string;
    srcSet?: string;
    sizes?: string;
    /** Makes the whole slide a link. */
    href?: string;
    /** Caption laid over the bottom of the image. */
    title?: string;
    description?: string;
}

/**
 * - `overlay`: floating over the image edges.
 * - `outside`: either side of the viewport, on the page background.
 * - `below`: in the row under the carousel, around the indicators.
 */
export type CarouselArrowPlacement = "overlay" | "outside" | "below";

export interface SlideCarouselProps extends Omit<CarouselProps, "children"> {
    slides: CarouselImageSlide[];
    /** Replaces the built-in image slide. The carousel still handles sizing, looping and clones. */
    renderSlide?: (slide: CarouselImageSlide, index: number) => ReactNode;
    /** Fired when a slide without an `href` is activated. Not fired at the end of a drag. */
    onSlideClick?: (slide: CarouselImageSlide, index: number) => void;

    /** Previous and next buttons. Defaults to `overlay`; `false` hides them. */
    arrows?: false | CarouselArrowPlacement;
    /** Scroll markers. Defaults to `dots`; `false` hides them. */
    indicators?: false | CarouselIndicatorVariant;
    /** Over the bottom of the image, or in the row below. Defaults to `below`. */
    indicatorPlacement?: "overlay" | "below";
    /**
     * Show the pause/play button when autoplay is on. Defaults to true, and should
     * stay that way: content that moves on its own needs a way to stop it (WCAG 2.2.2).
     */
    playButton?: boolean;

    /** Round the slide corners. Defaults to true; turn off for edge-to-edge strips. */
    rounded?: boolean;
    /** Extra classes for each slide. */
    slideClassName?: string;
    /** Renders placeholder slides while the images are being fetched. */
    isLoading?: boolean;
}
