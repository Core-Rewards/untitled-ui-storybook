import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { createCarouselEngine } from "./carousel-engine";
import type { CarouselAutoScrollDirection, CarouselEngine, CarouselEngineOptions } from "./carousel-engine";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutoplayCommon {
    /** Hold while a mouse is over the carousel. Defaults to true. */
    pauseOnHover?: boolean;
    /**
     * Turn autoplay off for good once the viewer drags, swipes or uses a control.
     * They can still turn it back on with the play button. Defaults to false.
     */
    stopOnInteraction?: boolean;
}

/** Advance one step at a time on a timer. */
export interface CarouselStepAutoplay extends AutoplayCommon {
    mode?: "step";
    /** Milliseconds each slide is shown. Defaults to 5000. */
    interval?: number;
}

/** Scroll smoothly and endlessly, like a logo strip. Implies `loop`. */
export interface CarouselContinuousAutoplay extends AutoplayCommon {
    mode: "continuous";
    /** Pixels per second. Defaults to 40. */
    speed?: number;
    direction?: CarouselAutoScrollDirection;
}

export type CarouselAutoplay = CarouselStepAutoplay | CarouselContinuousAutoplay;

/**
 * Animation policy, shared with `ProductCarousel`.
 * - `auto` (default) follows the viewer's `prefers-reduced-motion` setting.
 * - `full` always animates. Use it for design review, not production.
 * - `reduced` jumps between slides and does not autoplay until asked to.
 */
export type CarouselMotion = "auto" | "full" | "reduced";

export interface UseCarouselOptions extends Partial<Omit<CarouselEngineOptions, "startIndex">> {
    /** `true` is a step autoplay every five seconds. */
    autoplay?: boolean | CarouselAutoplay;
    motion?: CarouselMotion;
    /** Controlled snap index. */
    index?: number;
    /** Starting snap index when uncontrolled. */
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
}

export interface CarouselAutoplayState {
    /** Autoplay was configured at all. Controls use this to decide whether to render a play button. */
    enabled: boolean;
    mode: "step" | "continuous";
    interval: number;
    /** What the viewer asked for: the play button's state. */
    playing: boolean;
    /** Whether it is moving right now, after hover, focus and visibility holds. */
    running: boolean;
    toggle: () => void;
}

export interface CarouselState {
    selectedIndex: number;
    snapCount: number;
    canPrev: boolean;
    canNext: boolean;
    /** Snap index for each real slide. */
    slideSnaps: number[];
    /** Copies of the slide list to render. More than one only for a short loop. */
    copies: number;
    /** Bumped whenever the engine is rebuilt, so effects can re-apply to the new one. */
    version: number;
}

export interface UseCarouselResult extends CarouselState {
    attachViewport: (node: HTMLElement | null) => void;
    attachTrack: (node: HTMLElement | null) => void;
    attachRoot: (node: HTMLElement | null) => void;
    scrollTo: (index: number) => void;
    next: () => void;
    prev: () => void;
    autoplay: CarouselAutoplayState;
    /** Polite status text for the live region. Only user-driven moves set it. */
    announcement: string;
    /** Spread onto the element that carries `attachRoot`. */
    rootProps: {
        onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
        onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
        onFocus: (event: FocusEvent<HTMLElement>) => void;
        onBlur: (event: FocusEvent<HTMLElement>) => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    };
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_INTERVAL = 5000;
const DEFAULT_SPEED = 40;

const EMPTY_STATE: CarouselState = { selectedIndex: 0, snapCount: 0, canPrev: false, canNext: false, slideSnaps: [], copies: 1, version: 0 };

function normaliseAutoplay(autoplay: UseCarouselOptions["autoplay"]): CarouselAutoplay | null {
    if (!autoplay) return null;
    return autoplay === true ? { mode: "step" } : autoplay;
}

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Holds the engine between renders and exposes its state to React through
 * `useSyncExternalStore`, so the component re-renders on real changes (a new
 * selection, a new snap count) and never once per animation frame.
 */
function createStore() {
    let engine: CarouselEngine | null = null;
    let state = EMPTY_STATE;
    const subscribers = new Set<() => void>();

    function refresh(force = false) {
        if (!engine) return;
        const next: CarouselState = {
            selectedIndex: engine.selectedIndex(),
            snapCount: engine.snapCount(),
            canPrev: engine.canPrev(),
            canNext: engine.canNext(),
            slideSnaps: engine.slideSnaps(),
            copies: engine.requiredCopies(),
            version: state.version + (force ? 1 : 0),
        };
        const same =
            next.selectedIndex === state.selectedIndex &&
            next.snapCount === state.snapCount &&
            next.canPrev === state.canPrev &&
            next.canNext === state.canNext &&
            next.copies === state.copies &&
            next.slideSnaps.join() === state.slideSnaps.join();
        if (same && !force) return;
        state = next;
        subscribers.forEach((notify) => notify());
    }

    return {
        get engine() {
            return engine;
        },
        getState: () => state,
        subscribe(notify: () => void) {
            subscribers.add(notify);
            return () => subscribers.delete(notify);
        },
        attach(viewport: HTMLElement, track: HTMLElement, options: Partial<CarouselEngineOptions>) {
            // A rebuilt engine (new options) picks up where the last one was.
            engine = createCarouselEngine(viewport, track, { ...options, startIndex: state.version > 0 ? state.selectedIndex : options.startIndex });
            const sync = () => refresh();
            const offs = [engine.on("select", sync), engine.on("settle", sync), engine.on("reinit", sync)];
            refresh(true);
            const attached = engine;
            return () => {
                offs.forEach((off) => off());
                attached.destroy();
                // The state is deliberately kept: clearing it would drop the loop
                // copies for a render, and the next engine would measure a short track.
                if (engine === attached) engine = null;
            };
        },
    };
}

const isTypingTarget = (element: EventTarget) => element instanceof HTMLElement && (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) || element.isContentEditable);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCarousel({
    autoplay: autoplayOption,
    motion = "auto",
    index,
    defaultIndex = 0,
    onIndexChange,
    ...engineOptions
}: UseCarouselOptions = {}): UseCarouselResult {
    const [store] = useState(createStore);
    const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

    const [viewport, setViewport] = useState<HTMLElement | null>(null);
    const [track, setTrack] = useState<HTMLElement | null>(null);
    const [root, setRoot] = useState<HTMLElement | null>(null);

    const prefersReducedMotion = usePrefersReducedMotion();
    const motionReduced = motion === "reduced" || (motion === "auto" && prefersReducedMotion);

    const autoplay = normaliseAutoplay(autoplayOption);
    const mode = autoplay?.mode ?? "step";
    const interval = autoplay?.mode === "continuous" ? 0 : (autoplay?.interval ?? DEFAULT_INTERVAL);
    const speed = autoplay?.mode === "continuous" ? (autoplay.speed ?? DEFAULT_SPEED) : 0;
    const direction = autoplay?.mode === "continuous" ? (autoplay.direction ?? "forward") : "forward";
    const pauseOnHover = autoplay?.pauseOnHover ?? true;
    const stopOnInteraction = autoplay?.stopOnInteraction ?? false;

    // ── Engine lifecycle ─────────────────────────────────────────────────────

    const {
        align,
        loop,
        slidesToScroll,
        containScroll,
        draggable,
        dragFree,
        dragThreshold,
        wheel,
        duration,
    } = engineOptions;
    const autoplayEnabled = !!autoplay;
    // Continuous scrolling that runs out of track just stops, so it always loops.
    const resolvedLoop = !!loop || (autoplayEnabled && mode === "continuous");
    const resolvedDuration = motionReduced ? 0 : duration;

    /** Who moved the carousel last, so only the viewer's own moves are announced. */
    const source = useRef<"user" | "auto" | "api" | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const [pointerHeld, setPointerHeld] = useState(false);
    const [userPlaying, setUserPlaying] = useState<boolean | null>(null);

    /** A drag or wheel gesture is in progress; its selection changes are not final yet. */
    const gestureActive = useRef(false);

    const announce = useEffectEvent(() => {
        const engine = store.engine;
        if (source.current !== "user" || !engine) return;
        const total = engine.slideSnaps().length;
        const inView = engine.slidesInView();
        if (!inView.length) return;
        const first = inView[0] + 1;
        const last = inView[inView.length - 1] + 1;
        setAnnouncement(first === last ? `Slide ${first} of ${total}` : `Slides ${first} to ${last} of ${total}`);
    });

    const onSelect = useEffectEvent((selectedIndex: number) => {
        onIndexChange?.(selectedIndex);
        if (!gestureActive.current) announce();
    });

    const onSettle = useEffectEvent(() => {
        source.current = null;
    });

    const onUserInteraction = useEffectEvent(() => {
        source.current = "user";
        if (stopOnInteraction && autoplayEnabled) setUserPlaying(false);
    });

    useEffect(() => {
        if (!viewport || !track) return;
        const detach = store.attach(viewport, track, {
            align,
            loop: resolvedLoop,
            slidesToScroll,
            containScroll,
            draggable,
            dragFree,
            dragThreshold,
            wheel,
            duration: resolvedDuration,
            startIndex: index ?? defaultIndex,
        });
        const engine = store.engine!;
        const offs = [
            engine.on("select", (selectedIndex) => onSelect(selectedIndex)),
            engine.on("settle", () => onSettle()),
            engine.on("interaction", (kind) => {
                if (kind === "pointerdown" || kind === "wheelstart") {
                    gestureActive.current = true;
                    onUserInteraction();
                    setPointerHeld(true);
                } else {
                    gestureActive.current = false;
                    // The release has already picked its snap; say where it landed.
                    announce();
                    setPointerHeld(false);
                }
            }),
        ];
        return () => {
            offs.forEach((off) => off());
            detach();
        };
        // `index` and `defaultIndex` only seed a new engine; changes to `index`
        // are followed by the effect below instead of a rebuild.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store, viewport, track, align, resolvedLoop, slidesToScroll, containScroll, draggable, dragFree, dragThreshold, wheel, resolvedDuration]);

    // Follow a controlled index.
    useEffect(() => {
        const engine = store.engine;
        if (index === undefined || !engine || engine.selectedIndex() === index) return;
        source.current = "api";
        engine.scrollTo(index);
    }, [store, index, state.version]);

    // ── Autoplay holds ───────────────────────────────────────────────────────

    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [pageHidden, setPageHidden] = useState(false);
    const [offscreen, setOffscreen] = useState(false);

    useEffect(() => {
        if (!autoplayEnabled) return;
        const onVisibility = () => setPageHidden(document.hidden);
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [autoplayEnabled]);

    useEffect(() => {
        if (!autoplayEnabled || !root) return;
        const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
        observer.observe(root);
        return () => observer.disconnect();
    }, [autoplayEnabled, root]);

    // Reduced motion starts paused, but the play button still works.
    const playing = autoplayEnabled && (userPlaying ?? !motionReduced);
    const running = playing && !(pauseOnHover && hovered) && !focused && !pointerHeld && !pageHidden && !offscreen && state.snapCount > 1;

    // Step autoplay: one timer per slide, restarted whenever the selection moves.
    useEffect(() => {
        if (!running || mode !== "step") return;
        const timer = window.setTimeout(() => {
            const engine = store.engine;
            if (!engine) return;
            source.current = "auto";
            if (engine.canNext()) engine.next();
            else engine.scrollTo(0);
        }, interval);
        return () => window.clearTimeout(timer);
    }, [store, running, mode, interval, state.selectedIndex, state.version]);

    // Continuous autoplay: hand the engine a speed, or zero to hold it in place.
    useEffect(() => {
        if (mode !== "continuous") return;
        store.engine?.setAutoScroll(running ? speed : 0, direction);
    }, [store, mode, running, speed, direction, state.version]);

    // ── Commands ─────────────────────────────────────────────────────────────

    const userCommand = useCallback(
        (run: (engine: CarouselEngine) => void) => {
            const engine = store.engine;
            if (!engine) return;
            source.current = "user";
            if (stopOnInteraction && autoplayEnabled) setUserPlaying(false);
            run(engine);
        },
        [store, stopOnInteraction, autoplayEnabled],
    );

    const scrollTo = useCallback((target: number) => userCommand((engine) => engine.scrollTo(target)), [userCommand]);
    const next = useCallback(() => userCommand((engine) => engine.next()), [userCommand]);
    const prev = useCallback(() => userCommand((engine) => engine.prev()), [userCommand]);
    const toggle = useCallback(() => setUserPlaying(!playing), [playing]);

    const rootProps: UseCarouselResult["rootProps"] = {
        onPointerEnter: (event) => event.pointerType === "mouse" && setHovered(true),
        onPointerLeave: (event) => event.pointerType === "mouse" && setHovered(false),
        onFocus: () => setFocused(true),
        onBlur: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        },
        onKeyDown: (event) => {
            if (event.defaultPrevented || isTypingTarget(event.target)) return;
            const last = state.snapCount - 1;
            const actions: Record<string, () => void> = {
                ArrowLeft: prev,
                ArrowRight: next,
                Home: () => scrollTo(0),
                End: () => scrollTo(last),
            };
            const action = actions[event.key];
            if (!action) return;
            event.preventDefault();
            action();
        },
    };

    return {
        ...state,
        attachViewport: setViewport,
        attachTrack: setTrack,
        attachRoot: setRoot,
        scrollTo,
        next,
        prev,
        autoplay: { enabled: autoplayEnabled, mode, interval, playing, running, toggle },
        announcement,
        rootProps,
    };
}
