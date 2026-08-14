import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FC, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { mod, ring, shortestDelta, visibleHalf } from "./hero-banner-geometry";
import type { HeroBannerProduct, ShopHeroBannerProps } from "./hero-banner-types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Slots either side of centre. One each way gives the three-card fan. */
const CARD_HALF_MAX = 1;

/** Extra off-screen slots kept mounted so entering slots can animate in. */
const CARD_OVERSCAN = 1;

/** Length of the launch beat. Must match the launch `--slide-duration` below. */
const LAUNCH_MS = 170;

/** Default autoplay cadence. Long enough to read a card after the ~630ms flip. */
const DEFAULT_AUTO_ROTATE_MS = 5000;

/**
 * Rotation step per travel direction. Cards travelling right means stepping to
 * the previous slot: the incoming card is the one parked on the left, and it
 * glides rightward into the centre.
 */
const STEP_BY_DIRECTION = { right: -1, left: 1 } as const;

// ── Styles ────────────────────────────────────────────────────────────────────

/*
 * The card fan is driven by a handful of custom properties. `--offset` is set
 * per slot from JS; everything else lives here so the responsive steps only
 * have to retune one or two numbers. `--motion` is a 0/1 multiplier applied to
 * every duration, so honouring reduced motion is a single assignment.
 */
const fanVariables = [
    "[--card-w:341px] [--card-h:407px] [--side-scale:0.821] [--copy-w:572px]",
    // Tuning offset for the fan's centre within the stage. Zero centres it in
    // whatever the copy column leaves behind.
    "[--fan-scale:1] [--fan-nudge:0px] [--card-shift:calc(110px*var(--fan-scale))]",
    // Choreography: the incoming card slides out to its own side, lifts to full
    // size, then glides into the centre.
    "[--card-peek:calc(var(--card-shift)*0.38)]",
    "[--slide-duration:calc(400ms*var(--motion))] [--slide-delay:calc(60ms*var(--motion))] [--slide-ease:cubic-bezier(0.32,0.72,0,1)]",
    "[--lift-duration:calc(280ms*var(--motion))] [--lift-ease:cubic-bezier(0.32,0.72,0,1)]",
].join(" ");

/*
 * Breakpoints are set by the fan's travel, not by taste. The widest thing the
 * banner ever draws is a launching card at `shift + peek + half a side card`
 * — roughly 292px * --fan-scale past the fan's centre. The fan centres in
 * whatever the copy column leaves behind, so each step down has to keep that
 * reach inside the banner's clipped edge. Side-by-side stops working around
 * `lg`, which is why the stack starts there rather than lower.
 *
 * The last step is off the theme scale on purpose: below ~450px the fan has
 * nowhere to travel without leaving the banner, so the slots collapse onto one
 * another and a single card crossfades in place. Scale can go back up because
 * nothing moves sideways any more.
 */
const fanBreakpoints = [
    "max-xl:[--fan-scale:0.78] max-xl:[--copy-w:440px]",
    "max-lg:[--fan-scale:0.86] max-lg:[--copy-w:100%]",
    "max-xs:[--fan-scale:0.62]",
    "max-[450px]:[--fan-scale:0.7] max-[450px]:[--card-shift:0px]",
].join(" ");

/** Depth tier drives z-order, scale, blur and dimming. */
type Tier = "active" | "near" | "far" | "hidden";

const tierStyles: Record<Tier, { card: string; surface: string }> = {
    active: {
        card: "z-30",
        surface: "[--slot-scale:1]",
    },
    near: {
        card: "z-20",
        surface: "[--slot-scale:var(--side-scale)] opacity-90 blur-[1.5px]",
    },
    /*
     * Off-stage slots park just outside the fan rather than a full slot further
     * out. A full slot would put them past the banner's clipped edge, and they
     * are briefly visible out there as they fade in on the way to the near slot.
     */
    far: {
        card: "pointer-events-none z-10 [--card-shift:calc(74px*var(--fan-scale))] max-[450px]:[--card-shift:0px]",
        surface: "[--slot-scale:0.7] opacity-0 blur-[3px]",
    },
    hidden: {
        card: "pointer-events-none z-10 [--card-shift:calc(74px*var(--fan-scale))] max-[450px]:[--card-shift:0px]",
        surface: "[--slot-scale:0.7] opacity-0 blur-[3px]",
    },
};

/*
 * Launch phase — the first beat of a rotation, held on the card that is
 * becoming active. It slides further out to its own side while still sitting
 * behind and at side size. Dropping these classes starts the second beat: the
 * surface lifts to full size immediately, and the slide into the centre follows
 * a moment later, so the card visibly comes forward before it travels.
 */
const launchStyles = {
    card: cx(
        "z-20 [--slide-duration:calc(170ms*var(--motion))] [--slide-delay:0ms] [--slide-ease:cubic-bezier(0.4,0,0.9,0.55)]",
        "translate-x-[calc(var(--fan-nudge)+var(--launch-dir,0)*(var(--card-shift)+var(--card-peek)))]",
    ),
    surface: "[--slot-scale:var(--side-scale)] [--lift-duration:calc(170ms*var(--motion))] opacity-90 blur-[1.5px]",
};

const cardBaseStyles = cx(
    // Travel lives on the card and size/depth-of-field on the surface, so the
    // two can be timed independently: the slide can lag while the lift leads.
    "absolute top-1/2 left-1/2 h-(--card-h) w-(--card-w) mt-[calc(var(--card-h)/-2)] ml-[calc(var(--card-w)/-2)] will-change-transform",
    "translate-x-[calc(var(--fan-nudge)+var(--offset)*var(--card-shift))]",
    "transition-transform duration-(--slide-duration) ease-(--slide-ease) delay-(--slide-delay)",
);

const cardSurfaceStyles = cx(
    "flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-secondary bg-primary px-2 pt-1.5 pb-2 text-center",
    "scale-[calc(var(--fan-scale)*var(--slot-scale,1))] will-change-transform",
    "transition-[scale,opacity,filter] duration-(--lift-duration) ease-(--lift-ease)",
    "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
);

// ── Internal helpers ──────────────────────────────────────────────────────────

const defaultFormatPoints = (points: number) => `${points.toLocaleString("en-US")} points`;

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReduced(query.matches);
        sync();
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    return reduced;
}

function tierFor(offset: number, half: number): Tier {
    const distance = Math.abs(offset);
    if (distance === 0) return "active";
    if (distance > half) return "hidden";
    return distance === 1 ? "near" : "far";
}

function slotStyle(offset: number, launchDirection?: number): CSSProperties {
    return {
        "--offset": offset,
        ...(launchDirection === undefined ? null : { "--launch-dir": launchDirection }),
    } as CSSProperties;
}

/** Name and price block, shared by the real card and its skeleton. */
const CardMeta: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex min-h-[58px] w-full flex-col justify-start gap-2.5">{children}</div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const ShopHeroBanner: FC<ShopHeroBannerProps> = ({
    products,
    eyebrow = "CATEGORY: SALE",
    heading = "Limited-Time Point Deals",
    supportingText = "Take advantage of exclusive discounted rewards before this limited-time collection disappears.",
    ctaLabel = "Shop now",
    ctaHref,
    onCtaClick,
    activeIndex,
    defaultActiveIndex = 0,
    onActiveIndexChange,
    onProductClick,
    autoRotateInterval = DEFAULT_AUTO_ROTATE_MS,
    autoRotateDirection = "right",
    isLoading = false,
    motion = "auto",
    formatPoints = defaultFormatPoints,
    className,
    id,
}) => {
    const count = products.length;
    const isControlled = activeIndex !== undefined;
    const headingId = useId();

    const [virtual, setVirtual] = useState(() => activeIndex ?? defaultActiveIndex);
    const [isPaused, setIsPaused] = useState(false);
    const prefersReducedMotion = usePrefersReducedMotion();
    const motionReduced = motion === "reduced" || (motion === "auto" && prefersReducedMotion);

    /**
     * The card mid-launch: its slot position, and which side it is arriving from.
     * Cleared once the launch beat is over, which hands the card to the second
     * beat (lift, then glide into the centre).
     */
    const [launch, setLaunch] = useState<{ position: number; direction: number } | null>(null);

    useEffect(() => {
        if (!launch) return;
        const timer = window.setTimeout(() => setLaunch(null), LAUNCH_MS);
        return () => window.clearTimeout(timer);
    }, [launch]);

    const currentIndex = count > 0 ? mod(virtual, count) : 0;

    /*
     * Follow a controlled activeIndex without losing the short-path rotation:
     * the parent hands us an index, we work out which way round the ring is
     * nearer. Adjusting during render is React's recommended alternative to a
     * sync effect — it re-renders before committing, with no extra paint, so
     * the fan never shows the stale slot first.
     */
    const [syncedIndex, setSyncedIndex] = useState(currentIndex);
    if (isControlled && count > 0) {
        const target = mod(activeIndex, count);
        if (target !== syncedIndex) {
            setSyncedIndex(target);
            if (currentIndex !== target) setVirtual(virtual + shortestDelta(currentIndex, target, count));
        }
    }

    // Kept in a ref so a new inline callback each render does not restart auto-rotate.
    const onActiveIndexChangeRef = useRef(onActiveIndexChange);
    useEffect(() => {
        onActiveIndexChangeRef.current = onActiveIndexChange;
    }, [onActiveIndexChange]);

    const stageRef = useRef<HTMLDivElement>(null);
    const refocusStage = useRef(false);

    /** Announced text. Only user-driven rotations set it — autoplay must stay quiet. */
    const [announcement, setAnnouncement] = useState("");

    const rotateBy = useCallback(
        (delta: number, source: "user" | "auto" = "user") => {
            if (delta === 0 || count === 0) return;

            const next = virtual + delta;
            const nextIndex = mod(next, count);

            if (source === "user") {
                setAnnouncement(`${products[nextIndex].name}, item ${nextIndex + 1} of ${count}`);
                // The card the user is on may be about to rotate out of the visible
                // fan, so hand focus to whichever card lands in the centre.
                if (stageRef.current?.contains(document.activeElement)) refocusStage.current = true;
            }

            if (!motionReduced) {
                setLaunch({ position: next, direction: Math.sign(delta) });
            }

            if (!isControlled) setVirtual(next);
            onActiveIndexChangeRef.current?.(nextIndex, products[nextIndex]);
        },
        [count, isControlled, motionReduced, products, virtual],
    );

    useEffect(() => {
        if (!refocusStage.current) return;
        refocusStage.current = false;
        stageRef.current?.querySelector<HTMLElement>("[data-active-card] [data-card-surface]")?.focus();
    }, [virtual]);

    /*
     * Autoplay. Held while the banner is hovered or holds focus, and skipped
     * entirely for reduced motion — flipping cards on a timer is exactly the kind
     * of unrequested movement that setting asks us to stop.
     */
    useEffect(() => {
        if (!autoRotateInterval || autoRotateInterval <= 0) return;
        if (isPaused || isLoading || motionReduced || count < 2) return;

        const step = STEP_BY_DIRECTION[autoRotateDirection];
        const timer = window.setInterval(() => rotateBy(step, "auto"), autoRotateInterval);
        return () => window.clearInterval(timer);
    }, [autoRotateDirection, autoRotateInterval, count, isPaused, isLoading, motionReduced, rotateBy]);

    const cardHalf = visibleHalf(count, CARD_HALF_MAX);

    const cardSlots = useMemo(() => (count > 0 ? ring(products, virtual, cardHalf + CARD_OVERSCAN) : []), [products, virtual, cardHalf, count]);

    const handleCardClick = (event: MouseEvent<HTMLElement>, slotOffset: number, product: HeroBannerProduct, index: number) => {
        // A side card is a rotation target first, a link second.
        if (slotOffset !== 0) {
            event.preventDefault();
            rotateBy(slotOffset);
            return;
        }
        onProductClick?.(product, index);
    };

    const handleStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowUp":
            case "ArrowLeft":
                event.preventDefault();
                rotateBy(-1);
                break;
            case "ArrowDown":
            case "ArrowRight":
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
        <section
            id={id}
            style={{ "--motion": motionReduced ? 0 : 1 } as CSSProperties}
            className={cx(
                "relative box-border w-full overflow-clip rounded-2xl bg-secondary p-8 max-lg:p-6",
                fanVariables,
                fanBreakpoints,
                className,
            )}
            aria-labelledby={headingId}
            aria-busy={isLoading || undefined}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
        >
            {/* Dot grid, faded out with a radial mask — the Figma background
                pattern rebuilt in CSS rather than shipping the exported SVG. */}
            <div
                aria-hidden="true"
                className={cx(
                    "pointer-events-none absolute inset-0",
                    "bg-[radial-gradient(circle_at_center,var(--color-border-secondary)_0_1.5px,transparent_1.6px)] bg-[length:23px_23px]",
                    "[mask-image:radial-gradient(752px_1440px_at_50%_0,#000_0%,transparent_95.3%)]",
                )}
            />

            <div className="relative flex items-center lg:min-h-[640px] max-lg:flex-col max-lg:items-stretch max-lg:gap-6">
                {/* ── Copy ─────────────────────────────────────────────────── */}
                <div className="w-(--copy-w) max-w-full shrink-0 grow-0">
                    <div className="inline-flex items-center rounded-full border border-utility-warning-200 bg-utility-warning-50 px-4 py-1">
                        <span className="text-sm font-medium whitespace-nowrap text-utility-warning-700">{eyebrow}</span>
                    </div>

                    <h2 id={headingId} className="mt-4 text-display-xl font-semibold text-primary max-xl:text-display-md max-xs:text-display-sm">
                        {heading}
                    </h2>

                    <p className="mt-6 max-w-120 text-xl text-tertiary max-xl:text-lg">{supportingText}</p>

                    <div className="mt-12 flex gap-3 max-lg:mt-6">
                        <Button color="primary" size="xl" href={ctaHref} onClick={onCtaClick}>
                            {ctaLabel}
                        </Button>
                    </div>
                </div>

                {/* ── Card fan ─────────────────────────────────────────────── */}
                <div
                    ref={stageRef}
                    className="relative min-h-[calc(var(--card-h)*var(--fan-scale))] min-w-0 grow self-stretch max-lg:self-auto"
                    role={showSkeleton ? undefined : "group"}
                    aria-roledescription={showSkeleton ? undefined : "carousel"}
                    aria-label={showSkeleton ? undefined : "Featured sale rewards"}
                    onKeyDown={showSkeleton ? undefined : handleStageKeyDown}
                >
                    {showSkeleton
                        ? Array.from({ length: 3 }, (_, position) => {
                              const tier = tierStyles[tierFor(position - 1, CARD_HALF_MAX)];
                              return (
                                  <div key={position} aria-hidden="true" className={cx(cardBaseStyles, tier.card)} style={slotStyle(position - 1)}>
                                      <div className={cx(cardSurfaceStyles, tier.surface, "cursor-default")}>
                                          <div className={cx("aspect-square w-full shrink-0 rounded-lg bg-quaternary", !motionReduced && "animate-pulse")} />
                                          <CardMeta>
                                              <span className={cx("h-3.5 w-4/5 self-center rounded bg-quaternary", !motionReduced && "animate-pulse")} />
                                              <span className={cx("h-4 w-1/2 self-center rounded bg-quaternary", !motionReduced && "animate-pulse")} />
                                          </CardMeta>
                                      </div>
                                  </div>
                              );
                          })
                        : cardSlots.map(({ position, offset, index, item }) => {
                              const tierName = tierFor(offset, cardHalf);
                              const tier = tierStyles[tierName];
                              const isHidden = Math.abs(offset) > cardHalf;

                              // Guarded on offset too: in controlled mode a parent
                              // that ignores the change must not leave a side card
                              // twitching.
                              const isLaunching = offset === 0 && launch?.position === position;

                              const surface = (
                                  <>
                                      <div className="aspect-square w-full shrink-0 overflow-hidden">
                                          <img
                                              src={item.imageSrc}
                                              alt={offset === 0 ? (item.imageAlt ?? item.name) : ""}
                                              loading={offset === 0 ? "eager" : "lazy"}
                                              draggable={false}
                                              className="pointer-events-none h-full w-full object-contain"
                                          />
                                      </div>
                                      <CardMeta>
                                          <p className="line-clamp-2 text-sm text-primary">{item.name}</p>
                                          <p className="flex justify-center gap-2.5 text-md text-brand-secondary">
                                              {item.originalPoints !== undefined && item.originalPoints > item.points && (
                                                  <span className="font-bold line-through">{formatPoints(item.originalPoints)}</span>
                                              )}
                                              <span>{formatPoints(item.points)}</span>
                                          </p>
                                      </CardMeta>
                                  </>
                              );

                              const surfaceProps = {
                                  "data-card-surface": true,
                                  className: cx(cardSurfaceStyles, tier.surface, isLaunching && launchStyles.surface),
                                  "aria-label": offset === 0 ? item.name : `Show ${item.name}`,
                                  tabIndex: isHidden ? -1 : undefined,
                                  onClick: (event: MouseEvent<HTMLElement>) => handleCardClick(event, offset, item, index),
                              };

                              return (
                                  <div
                                      key={position}
                                      data-active-card={offset === 0 ? true : undefined}
                                      aria-hidden={isHidden || undefined}
                                      className={cx(cardBaseStyles, tier.card, isLaunching && launchStyles.card)}
                                      style={slotStyle(offset, isLaunching ? launch.direction : undefined)}
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
                </div>
            </div>

            <span aria-live="polite" className="sr-only">
                {announcement}
            </span>
        </section>
    );
};
