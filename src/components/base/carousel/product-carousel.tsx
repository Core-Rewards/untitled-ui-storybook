import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FC, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { mod, ring, shortestDelta, visibleHalf } from "@/components/base/hero-banner/hero-banner-geometry";
import { cx } from "@/utils/cx";
import type { CarouselProduct, ProductCarouselProps } from "./carousel-types";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Cards either side of the front card. Two back and two forward makes the deck. */
const DECK_HALF_MAX = 2;

/** Extra off-stage cards kept mounted so an entering card can animate in. */
const DECK_OVERSCAN = 1;

/** Default autoplay cadence, matching the 3s dwell in the source animation. */
const DEFAULT_AUTO_ROTATE_MS = 3000;

/**
 * Rotation step per travel direction. Cards travelling left means stepping to the
 * next card: the incoming card waits on the right and slides leftward to the front.
 */
const STEP_BY_DIRECTION = { left: 1, right: -1 } as const;

// ── Stage ─────────────────────────────────────────────────────────────────────

/**
 * Where a card sits, by how far it is from the front.
 *
 * This is the source animation's four-beat loop turned on its side. There the
 * deck ran bottom to top; here it runs right to left, so the vertical travel
 * became `x` and the small lateral kink that gave the stack its depth became
 * `y`. Negative offsets are cards the viewer has already seen, on their way off
 * the left edge; positive ones are queued to the right.
 *
 * `x` is in multiples of `--card-shift`, so one responsive step retunes the
 * whole deck. Anything past the ends clamps to them.
 */
interface Stage {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    blur: number;
    z: number;
    /** Staggered so the deck settles back to front rather than all at once. */
    delay: number;
}

/*
 * The cards behind stay close to opaque and take their depth from scale and
 * blur instead. Dropping their opacity further would read better standing
 * still, but a card is see-through for the whole 620ms it spends arriving, and
 * on a narrow deck it arrives on top of the card behind it.
 */
const STAGES: Record<number, Stage> = {
    "-2": { x: -2.5, y: -34, scale: 0.86, opacity: 0, blur: 4, z: 0, delay: 0 },
    "-1": { x: -1.15, y: -22, scale: 0.93, opacity: 0.92, blur: 1.5, z: 20, delay: 0 },
    "0": { x: 0, y: 0, scale: 1, opacity: 1, blur: 0, z: 30, delay: 60 },
    "1": { x: 1.15, y: 22, scale: 0.93, opacity: 0.92, blur: 1.5, z: 20, delay: 30 },
    "2": { x: 2.1, y: 34, scale: 0.86, opacity: 0, blur: 4, z: 0, delay: 0 },
};

function stageFor(offset: number, half: number): Stage {
    // Beyond the visible band a card parks on the outermost stage, which is
    // already transparent, rather than travelling further and further out.
    const clamped = Math.max(-DECK_HALF_MAX, Math.min(DECK_HALF_MAX, offset));
    const stage = STAGES[clamped];
    return Math.abs(offset) > half ? { ...stage, opacity: 0 } : stage;
}

function slotStyle(stage: Stage): CSSProperties {
    return {
        transform: `translate(calc(var(--card-shift) * ${stage.x}), calc(var(--deck-depth) * ${stage.y}px)) scale(${stage.scale})`,
        opacity: stage.opacity,
        filter: stage.blur ? `blur(${stage.blur}px)` : undefined,
        zIndex: stage.z,
        transitionDelay: `calc(${stage.delay}ms * var(--motion))`,
    };
}

// ── Styles ────────────────────────────────────────────────────────────────────

/*
 * The deck is driven by a handful of custom properties so the responsive steps
 * only have to retune one or two numbers. `--motion` is a 0/1 multiplier applied
 * to every duration, so honouring reduced motion is a single assignment.
 */
const deckVariables = [
    // Portrait: the image takes the card's width, and the name and points sit
    // under it, so the height is roughly the width plus a fixed caption block.
    "[--card-w:296px] [--card-h:404px]",
    // How far apart the stages sit, and how much of the vertical kink survives.
    // Dropping --deck-depth to 0 would give a flat left-to-right shuffle.
    "[--card-shift:150px] [--deck-depth:1]",
    "[--slide-duration:calc(620ms*var(--motion))] [--slide-ease:cubic-bezier(0.32,0.72,0,1)]",
].join(" ");

/*
 * Breakpoints are set by the deck's reach, not by taste: the furthest visible
 * card sits `1.15 * --card-shift` past centre with half a card either side of
 * it, so each step down has to keep `card-w/2 + 1.15 * card-shift` inside the
 * frame. Travel is what goes first — the card keeps a readable size while the
 * deck flattens towards a crossfade in place.
 */
const deckBreakpoints = [
    // Height tracks width: the image well is square, so it eats every pixel the
    // card loses, over a caption block that is 88px wide and 112px narrow.
    "max-md:[--card-w:264px] max-md:[--card-h:396px] max-md:[--card-shift:112px] max-md:[--deck-depth:0.7]",
    "max-sm:[--card-w:232px] max-sm:[--card-h:364px] max-sm:[--card-shift:52px] max-sm:[--deck-depth:0.5]",
].join(" ");

const cardBaseStyles = cx(
    // Negative margins do the centring, which leaves the transform free to carry
    // nothing but the stage.
    "absolute top-1/2 left-1/2 h-(--card-h) w-(--card-w) max-w-[calc(100%-2rem)] mt-[calc(var(--card-h)/-2)] ml-[calc(var(--card-w)/-2)]",
    "will-change-transform transition-[transform,opacity,filter] duration-(--slide-duration) ease-(--slide-ease)",
);

const cardSurfaceStyles = cx(
    "flex h-full w-full cursor-pointer flex-col items-center gap-4 rounded-2xl bg-primary p-4 text-center shadow-lg ring-1 ring-secondary_alt",
    "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
);

/**
 * Name and points block. Fixed height so cards line up whatever the name length,
 * and taller on narrow cards, where a discounted price takes two lines.
 */
const cardCaptionStyles = "flex h-22 max-md:h-28 w-full flex-col justify-start gap-2";

// ── Internal helpers ──────────────────────────────────────────────────────────

const defaultFormatPoints = (points: number) => `${points.toLocaleString("en-US")} points`;

/** Square image well, shared by the real card and its skeleton. */
const ImageWell: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary_subtle p-3">{children}</div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const ProductCarousel: FC<ProductCarouselProps> = ({
    products,
    activeIndex,
    defaultActiveIndex = 0,
    onActiveIndexChange,
    onProductClick,
    autoRotateInterval = DEFAULT_AUTO_ROTATE_MS,
    autoRotateDirection = "left",
    isLoading = false,
    motion = "auto",
    formatPoints = defaultFormatPoints,
    label = "Featured rewards",
    className,
    id,
}) => {
    const count = products.length;
    const isControlled = activeIndex !== undefined;

    const [virtual, setVirtual] = useState(() => activeIndex ?? defaultActiveIndex);
    const [isPaused, setIsPaused] = useState(false);
    const prefersReducedMotion = usePrefersReducedMotion();
    const motionReduced = motion === "reduced" || (motion === "auto" && prefersReducedMotion);

    const currentIndex = count > 0 ? mod(virtual, count) : 0;

    /*
     * Follow a controlled activeIndex without losing the short-path rotation: the
     * parent hands us an index, we work out which way round the ring is nearer.
     * Adjusting during render is React's recommended alternative to a sync effect
     * — it re-renders before committing, with no extra paint, so the deck never
     * shows the stale card first.
     */
    const [syncedIndex, setSyncedIndex] = useState(currentIndex);
    if (isControlled && count > 0) {
        const target = mod(activeIndex, count);
        if (target !== syncedIndex) {
            setSyncedIndex(target);
            if (currentIndex !== target) setVirtual(virtual + shortestDelta(currentIndex, target, count));
        }
    }

    // Kept in a ref so a new inline callback each render does not restart autoplay.
    const onActiveIndexChangeRef = useRef(onActiveIndexChange);
    useEffect(() => {
        onActiveIndexChangeRef.current = onActiveIndexChange;
    }, [onActiveIndexChange]);

    const deckRef = useRef<HTMLDivElement>(null);
    const refocusDeck = useRef(false);

    /** Announced text. Only user-driven rotations set it — autoplay must stay quiet. */
    const [announcement, setAnnouncement] = useState("");

    const rotateBy = useCallback(
        (delta: number, source: "user" | "auto" = "user") => {
            if (delta === 0 || count === 0) return;

            const next = virtual + delta;
            const nextIndex = mod(next, count);

            if (source === "user") {
                setAnnouncement(`${products[nextIndex].name}, item ${nextIndex + 1} of ${count}`);
                // The card the user is on is about to slide out of the deck, so
                // hand focus to whichever card lands at the front.
                if (deckRef.current?.contains(document.activeElement)) refocusDeck.current = true;
            }

            if (!isControlled) setVirtual(next);
            onActiveIndexChangeRef.current?.(nextIndex, products[nextIndex]);
        },
        [count, isControlled, products, virtual],
    );

    useEffect(() => {
        if (!refocusDeck.current) return;
        refocusDeck.current = false;
        deckRef.current?.querySelector<HTMLElement>("[data-active-card] [data-card-surface]")?.focus();
    }, [virtual]);

    /*
     * Autoplay. Held while the carousel is hovered or holds focus, and skipped
     * entirely for reduced motion — cards turning over on a timer are exactly the
     * kind of unrequested movement that setting asks us to stop.
     */
    useEffect(() => {
        if (!autoRotateInterval || autoRotateInterval <= 0) return;
        if (isPaused || isLoading || motionReduced || count < 2) return;

        const step = STEP_BY_DIRECTION[autoRotateDirection];
        const timer = window.setInterval(() => rotateBy(step, "auto"), autoRotateInterval);
        return () => window.clearInterval(timer);
    }, [autoRotateDirection, autoRotateInterval, count, isPaused, isLoading, motionReduced, rotateBy]);

    const deckHalf = visibleHalf(count, DECK_HALF_MAX);

    const cardSlots = useMemo(() => (count > 0 ? ring(products, virtual, deckHalf + DECK_OVERSCAN) : []), [products, virtual, deckHalf, count]);

    const handleCardClick = (event: MouseEvent<HTMLElement>, slotOffset: number, product: CarouselProduct, index: number) => {
        // A card behind the front one is a rotation target first, a link second.
        if (slotOffset !== 0) {
            event.preventDefault();
            rotateBy(slotOffset);
            return;
        }
        onProductClick?.(product, index);
    };

    const handleDeckKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                rotateBy(-1);
                break;
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                rotateBy(1);
                break;
            case "Home":
                event.preventDefault();
                rotateBy(shortestDelta(currentIndex, 0, count));
                break;
            default:
                break;
        }
    };

    const showSkeleton = isLoading || count === 0;

    return (
        <div
            id={id}
            ref={deckRef}
            style={{ "--motion": motionReduced ? 0 : 1 } as CSSProperties}
            className={cx(
                "relative isolate flex min-h-[calc(var(--card-h)+5rem)] w-full items-center overflow-clip px-4 py-10",
                deckVariables,
                deckBreakpoints,
                className,
            )}
            role={showSkeleton ? undefined : "group"}
            aria-roledescription={showSkeleton ? undefined : "carousel"}
            aria-label={showSkeleton ? undefined : label}
            aria-busy={isLoading || undefined}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onKeyDown={showSkeleton ? undefined : handleDeckKeyDown}
        >
            {showSkeleton
                ? [1, 0, -1].map((offset) => (
                      <div key={offset} aria-hidden="true" className={cardBaseStyles} style={slotStyle(stageFor(offset, DECK_HALF_MAX))}>
                          <div className={cx(cardSurfaceStyles, "cursor-default")}>
                              <ImageWell>
                                  <span className={cx("size-full rounded-lg bg-quaternary", !motionReduced && "animate-pulse")} />
                              </ImageWell>
                              <div className={cardCaptionStyles}>
                                  <span className={cx("h-3.5 w-4/5 self-center rounded bg-quaternary", !motionReduced && "animate-pulse")} />
                                  <span className={cx("h-3.5 w-3/5 self-center rounded bg-quaternary", !motionReduced && "animate-pulse")} />
                                  <span className={cx("mt-1 h-4 w-1/2 self-center rounded bg-quaternary", !motionReduced && "animate-pulse")} />
                              </div>
                          </div>
                      </div>
                  ))
                : cardSlots.map(({ position, offset, index, item }) => {
                      const isFront = offset === 0;
                      const isHidden = Math.abs(offset) > deckHalf;

                      const surface = (
                          <>
                              <ImageWell>
                                  <img
                                      src={item.imageSrc}
                                      alt={isFront ? (item.imageAlt ?? item.name) : ""}
                                      loading={isFront ? "eager" : "lazy"}
                                      draggable={false}
                                      className="pointer-events-none size-full object-contain"
                                  />
                              </ImageWell>

                              <div className={cardCaptionStyles}>
                                  {/* shrink-0 so a two-line price never squeezes the name. */}
                                  <h3 className="line-clamp-2 shrink-0 text-sm text-primary">{item.name}</h3>

                                  {/* The row wraps but its parts do not: a point total broken
                                      across two lines reads as two totals. */}
                                  <p className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-md text-brand-secondary *:whitespace-nowrap">
                                      {item.originalPoints !== undefined && item.originalPoints > item.points && (
                                          <span className="font-bold line-through">{formatPoints(item.originalPoints)}</span>
                                      )}
                                      <span>{formatPoints(item.points)}</span>
                                  </p>
                              </div>
                          </>
                      );

                      const surfaceProps = {
                          "data-card-surface": true,
                          className: cardSurfaceStyles,
                          "aria-label": isFront ? item.name : `Show ${item.name}`,
                          tabIndex: isHidden ? -1 : undefined,
                          onClick: (event: MouseEvent<HTMLElement>) => handleCardClick(event, offset, item, index),
                      };

                      return (
                          <div
                              key={position}
                              data-active-card={isFront ? true : undefined}
                              aria-hidden={isHidden || undefined}
                              className={cx(cardBaseStyles, isHidden && "pointer-events-none")}
                              style={slotStyle(stageFor(offset, deckHalf))}
                          >
                              {item.href ? (
                                  <a href={item.href} {...surfaceProps}>
                                      {surface}
                                  </a>
                              ) : (
                                  <button type="button" {...surfaceProps}>
                                      {surface}
                                  </button>
                              )}
                          </div>
                      );
                  })}

            <span aria-live="polite" className="sr-only">
                {announcement}
            </span>
        </div>
    );
};
