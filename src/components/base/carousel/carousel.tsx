import { Children, isValidElement, useContext, useId } from "react";
import type { CSSProperties, FC, HTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Play } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { CLONE_ATTRIBUTE } from "./carousel-engine";
import { CarouselContext, SlideContext, useCarouselContext } from "./carousel-context";
import { useCarousel } from "./use-carousel";
import type { UseCarouselOptions } from "./use-carousel";

/*
 * Composable carousel parts. `SlideCarousel` assembles these for the common
 * layouts; reach for them directly when a page needs something it does not
 * cover, such as controls in a header or a thumbnail strip.
 *
 *   <Carousel slidesPerView={{ base: 1, md: 3 }} loop>
 *       <CarouselContent>
 *           {items.map((item) => <CarouselSlide key={item.id}>…</CarouselSlide>)}
 *       </CarouselContent>
 *       <CarouselPrevious />
 *       <CarouselNext />
 *       <CarouselIndicators />
 *   </Carousel>
 */

// ── Responsive values ─────────────────────────────────────────────────────────

const BREAKPOINTS = ["base", "sm", "md", "lg", "xl", "2xl"] as const;
export type CarouselBreakpoint = (typeof BREAKPOINTS)[number];

/** A single value, or one per Tailwind breakpoint. Missing breakpoints inherit the one below. */
export type Responsive<T> = T | Partial<Record<CarouselBreakpoint, T>>;

function responsiveVars<T>(name: string, value: Responsive<T> | undefined, fallback: T, format: (value: T) => string): Record<string, string> {
    const byBreakpoint = typeof value === "object" && value !== null ? (value as Partial<Record<CarouselBreakpoint, T>>) : { base: value ?? fallback };
    const vars: Record<string, string> = {};
    let current = byBreakpoint.base ?? fallback;
    for (const breakpoint of BREAKPOINTS) {
        current = byBreakpoint[breakpoint] ?? current;
        vars[`--carousel-${name}-${breakpoint}`] = format(current);
    }
    return vars;
}

/*
 * Every breakpoint's value is written inline (filled forward from the ones
 * given), so these static classes only have to pick the right one. Tailwind
 * needs them spelled out to generate them.
 */
const responsiveVarClasses = [
    "[--carousel-basis:var(--carousel-basis-base)] sm:[--carousel-basis:var(--carousel-basis-sm)] md:[--carousel-basis:var(--carousel-basis-md)] lg:[--carousel-basis:var(--carousel-basis-lg)] xl:[--carousel-basis:var(--carousel-basis-xl)] 2xl:[--carousel-basis:var(--carousel-basis-2xl)]",
    "[--carousel-gap:var(--carousel-gap-base)] sm:[--carousel-gap:var(--carousel-gap-sm)] md:[--carousel-gap:var(--carousel-gap-md)] lg:[--carousel-gap:var(--carousel-gap-lg)] xl:[--carousel-gap:var(--carousel-gap-xl)] 2xl:[--carousel-gap:var(--carousel-gap-2xl)]",
    "[--carousel-aspect:var(--carousel-aspect-base)] sm:[--carousel-aspect:var(--carousel-aspect-sm)] md:[--carousel-aspect:var(--carousel-aspect-md)] lg:[--carousel-aspect:var(--carousel-aspect-lg)] xl:[--carousel-aspect:var(--carousel-aspect-xl)] 2xl:[--carousel-aspect:var(--carousel-aspect-2xl)]",
].join(" ");

/** Slide width for N per view, leaving room for the gaps between them. `auto` lets slides size themselves. */
const slideBasis = (perView: number | "auto") => (perView === "auto" ? "auto" : `calc((100% - ${perView - 1} * var(--carousel-gap)) / ${perView})`);

const cssLength = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

// ── Root ──────────────────────────────────────────────────────────────────────

export interface CarouselProps extends UseCarouselOptions {
    /** Slides visible at once. Fractions show a peek of the next slide. Defaults to 1. */
    slidesPerView?: Responsive<number | "auto">;
    /** Space between slides, in px or any CSS length. Defaults to 16. */
    gap?: Responsive<number | string>;
    /** Aspect ratio exposed as `--carousel-aspect` for slides to use, e.g. `"16/9"`. */
    aspectRatio?: Responsive<string>;
    /** Names the carousel for assistive tech. */
    label?: string;
    className?: string;
    style?: CSSProperties;
    id?: string;
    children: ReactNode;
}

export const Carousel: FC<CarouselProps> = ({ slidesPerView = 1, gap = 16, aspectRatio = "16/9", label = "Carousel", className, style, id, children, ...options }) => {
    const carousel = useCarousel(options);
    const trackId = useId();

    const vars = {
        ...responsiveVars("basis", slidesPerView, 1, slideBasis),
        ...responsiveVars("gap", gap, 16, cssLength),
        ...responsiveVars("aspect", aspectRatio, "16/9", String),
    };

    // Pulled out up front: the compiler treats an object passed to `ref` as a ref.
    const { attachRoot, rootProps, announcement } = carousel;

    return (
        <CarouselContext.Provider value={{ ...carousel, trackId, draggable: options.draggable ?? true }}>
            <div
                ref={attachRoot}
                id={id}
                role="region"
                aria-roledescription="carousel"
                aria-label={label}
                className={cx("relative", responsiveVarClasses, className)}
                style={{ ...vars, ...style }}
                {...rootProps}
            >
                {children}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {announcement}
                </div>
            </div>
        </CarouselContext.Provider>
    );
};

// ── Viewport and slides ───────────────────────────────────────────────────────

export interface CarouselContentProps {
    children: ReactNode;
    /** Classes for the clipping viewport. */
    className?: string;
    /** Classes for the moving track inside it. */
    trackClassName?: string;
}

export const CarouselContent: FC<CarouselContentProps> = ({ children, className, trackClassName }) => {
    const { attachViewport, attachTrack, trackId, copies, draggable } = useCarouselContext();
    const items = Children.toArray(children);

    return (
        <div
            ref={attachViewport}
            className={cx(
                // clip rather than hidden: a hidden box can still be scrolled by focus,
                // which would knock the track out of line with its transform.
                "relative overflow-clip",
                draggable && "cursor-grab touch-pan-y data-dragging:cursor-grabbing data-dragging:select-none",
                className,
            )}
        >
            <div id={trackId} ref={attachTrack} className={cx("flex gap-(--carousel-gap) will-change-transform", trackClassName)}>
                {Array.from({ length: copies }, (_, copy) =>
                    items.map((item, index) => (
                        <SlideContext.Provider key={`${copy}:${isValidElement(item) ? item.key : index}`} value={{ index, count: items.length, isClone: copy > 0 }}>
                            {item}
                        </SlideContext.Provider>
                    )),
                )}
            </div>
        </div>
    );
};

export interface CarouselSlideProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

/**
 * One slide. Sized by `slidesPerView`; override the width with a class when
 * `slidesPerView` is `auto`. `data-selected` is set on slides in the current snap.
 */
export const CarouselSlide: FC<CarouselSlideProps> = ({ className, children, ...rest }) => {
    const { index, count, isClone } = useContext(SlideContext);
    const { slideSnaps, selectedIndex } = useCarouselContext();
    const cloneProps = isClone ? { [CLONE_ATTRIBUTE]: "", "aria-hidden": true, inert: true } : {};

    return (
        <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            data-selected={slideSnaps[index] === selectedIndex || undefined}
            className={cx("min-w-0 shrink-0 grow-0 basis-(--carousel-basis)", className)}
            {...cloneProps}
            {...rest}
        >
            {children}
        </div>
    );
};

// ── Controls ──────────────────────────────────────────────────────────────────

/** `overlay` floats over imagery; `outline` sits on the page background. */
export type CarouselControlVariant = "overlay" | "outline";

const controlBase = cx(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition duration-150 ease-linear",
    "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
);

const controlVariants: Record<CarouselControlVariant, string> = {
    // At a non-looping end the arrow fades out rather than sitting greyed over the image.
    overlay: "bg-primary/90 text-fg-secondary shadow-md ring-1 ring-secondary_alt backdrop-blur-sm hover:bg-primary disabled:pointer-events-none disabled:opacity-0",
    outline: "bg-primary text-fg-secondary shadow-xs ring-1 ring-primary ring-inset hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40",
};

interface ArrowProps {
    variant?: CarouselControlVariant;
    className?: string;
    /** Accessible name. */
    label?: string;
}

export const CarouselPrevious: FC<ArrowProps> = ({ variant = "outline", className, label = "Previous slide" }) => {
    const { prev, canPrev, trackId } = useCarouselContext();
    return (
        <button type="button" aria-label={label} aria-controls={trackId} disabled={!canPrev} onClick={prev} className={cx(controlBase, controlVariants[variant], "size-10 max-sm:size-9", className)}>
            <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
    );
};

export const CarouselNext: FC<ArrowProps> = ({ variant = "outline", className, label = "Next slide" }) => {
    const { next, canNext, trackId } = useCarouselContext();
    return (
        <button type="button" aria-label={label} aria-controls={trackId} disabled={!canNext} onClick={next} className={cx(controlBase, controlVariants[variant], "size-10 max-sm:size-9", className)}>
            <ChevronRight aria-hidden="true" className="size-5" />
        </button>
    );
};

/** Two bars in the icon set's stroke style; the set has no plain pause glyph. */
const PauseGlyph = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4">
        <path d="M9 5v14M15 5v14" />
    </svg>
);

/**
 * Pauses and resumes autoplay. Anything that moves on its own needs one
 * (WCAG 2.2.2), so render it whenever autoplay is on. Renders nothing otherwise.
 */
export const CarouselPlayToggle: FC<{ variant?: CarouselControlVariant; className?: string }> = ({ variant = "outline", className }) => {
    const { autoplay, trackId } = useCarouselContext();
    if (!autoplay.enabled) return null;
    return (
        <button
            type="button"
            aria-controls={trackId}
            aria-label={autoplay.playing ? "Pause automatic slide show" : "Play automatic slide show"}
            onClick={autoplay.toggle}
            className={cx(controlBase, controlVariants[variant], "size-8", className)}
        >
            {autoplay.playing ? <PauseGlyph /> : <Play aria-hidden="true" className="size-4" />}
        </button>
    );
};

// ── Indicators ────────────────────────────────────────────────────────────────

/** `dots` and `lines` are clickable scroll markers; `fraction` is a "2 / 8" counter. */
export type CarouselIndicatorVariant = "dots" | "lines" | "fraction";

export interface CarouselIndicatorsProps {
    variant?: CarouselIndicatorVariant;
    /** `overlay` puts the markers on a dark pill so they read over any image. */
    tone?: "default" | "overlay";
    className?: string;
}

export const CarouselIndicators: FC<CarouselIndicatorsProps> = ({ variant = "dots", tone = "default", className }) => {
    const { snapCount, slideSnaps, selectedIndex, scrollTo, trackId, autoplay } = useCarouselContext();
    if (snapCount < 2) return null;

    const onImage = tone === "overlay";
    const pill = onImage && "rounded-full bg-black/35 backdrop-blur-sm";

    if (variant === "fraction") {
        return (
            <span className={cx("px-2.5 py-1 text-sm font-medium tabular-nums", onImage ? cx(pill, "text-white") : "text-tertiary", className)}>
                {selectedIndex + 1} / {snapCount}
            </span>
        );
    }

    // With several slides per snap, a marker is a page, not a slide.
    const noun = snapCount === slideSnaps.length ? "slide" : "page";
    const showProgress = variant === "lines" && autoplay.running && autoplay.mode === "step";

    return (
        <div role="group" aria-label="Choose slide" className={cx("flex items-center", onImage && cx(pill, "px-1"), className)}>
            {Array.from({ length: snapCount }, (_, index) => {
                const isSelected = index === selectedIndex;
                const inactive = onImage ? "bg-white/50 group-hover:bg-white/80" : "bg-quaternary group-hover:bg-fg-quaternary";
                const active = onImage ? "bg-white" : "bg-brand-solid";
                return (
                    <button
                        key={index}
                        type="button"
                        aria-label={`Go to ${noun} ${index + 1} of ${snapCount}`}
                        aria-current={isSelected || undefined}
                        aria-controls={trackId}
                        onClick={() => scrollTo(index)}
                        // The visible marker is small; the padding keeps the target at 24px.
                        className="group cursor-pointer rounded-full p-2 outline-brand focus-visible:outline-2"
                    >
                        {variant === "dots" ? (
                            <span className={cx("block h-2 rounded-full transition-all duration-300", isSelected ? cx("w-6", active) : cx("w-2", inactive))} />
                        ) : (
                            <span className={cx("block h-1 w-8 overflow-hidden rounded-full max-sm:w-5", inactive)}>
                                {isSelected && (
                                    <span
                                        // Remounting restarts the fill each time the timer does.
                                        key={showProgress ? `run:${selectedIndex}` : "still"}
                                        className={cx("block h-full origin-left", active, showProgress && "transition-transform ease-linear starting:scale-x-0")}
                                        style={showProgress ? { transitionDuration: `${autoplay.interval}ms` } : undefined}
                                    />
                                )}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
