/**
 * Framework-free scroll engine behind `Carousel`.
 *
 * The model is borrowed from Embla Carousel (MIT, github.com/davidjerleke/embla-carousel),
 * rewritten from scratch and cut down to what this library needs:
 *
 * - The track is moved with a transform, never with native scrolling, so looping,
 *   snapping and continuous scrolling all share one position value (`location`).
 * - Motion is a damped spring integrated on a fixed 60fps step: velocity chases
 *   the target, friction bleeds it off. The same body carries a snap, a flick and
 *   a free glide, so they all feel related.
 * - Looping moves individual slides by one whole content width once they fall off
 *   an edge, rather than cloning the DOM. When there are too few slides to fill
 *   the view that trick leaves a hole, so the engine reports how many copies it
 *   needs and the React layer renders inert clones to make up the width.
 *
 * Everything is measured from the DOM, so slide width, gap and slides-per-view are
 * purely a CSS concern and can change at any breakpoint.
 *
 * Sign convention: `location` is the track's translateX. Moving forward (towards
 * later slides) makes it more negative.
 */

// ── Options ───────────────────────────────────────────────────────────────────

export type CarouselAlign = "start" | "center" | "end";

export interface CarouselEngineOptions {
    /** Where a snapped slide (or group) sits in the viewport. */
    align: CarouselAlign;
    /** Wrap from the last slide back to the first. */
    loop: boolean;
    /** Slides moved per step. `auto` moves by however many fit in view. */
    slidesToScroll: number | "auto";
    /**
     * Without looping, stop the track at its ends instead of letting the first and
     * last snaps align into empty space. Trims the snaps that would be duplicates.
     */
    containScroll: boolean;
    /** Allow mouse and touch dragging. */
    draggable: boolean;
    /** Let a drag glide to a stop anywhere instead of settling on a snap. */
    dragFree: boolean;
    /** Pixels a pointer has to travel before a click on a slide is cancelled. */
    dragThreshold: number;
    /** Scroll with horizontal trackpad swipes and shift + mouse wheel. */
    wheel: boolean;
    /**
     * Spring stiffness for snaps. Higher is slower; 25 feels like ~500ms. 0 jumps
     * instantly, which is what reduced motion gets.
     */
    duration: number;
    /** Snap index to start on. */
    startIndex: number;
}

export const defaultEngineOptions: CarouselEngineOptions = {
    align: "start",
    loop: false,
    slidesToScroll: 1,
    containScroll: true,
    draggable: true,
    dragFree: false,
    dragThreshold: 10,
    wheel: true,
    duration: 25,
    startIndex: 0,
};

export type CarouselAutoScrollDirection = "forward" | "backward";

export type CarouselInteraction = "pointerdown" | "pointerup" | "wheelstart" | "wheelend";

interface EngineEvents {
    /** The selected snap changed. Fires as soon as a move is decided, not when it lands. */
    select: (index: number) => void;
    /** The track came to rest. */
    settle: () => void;
    /** Layout was re-measured: snap count or required copies may have changed. */
    reinit: () => void;
    /** A pointer or wheel gesture started or ended on the viewport. */
    interaction: (kind: CarouselInteraction) => void;
}

export interface CarouselEngine {
    scrollTo: (index: number, direction?: -1 | 0 | 1) => void;
    next: () => void;
    prev: () => void;
    selectedIndex: () => number;
    snapCount: () => number;
    canPrev: () => boolean;
    canNext: () => boolean;
    /** Snap index each real slide belongs to. */
    slideSnaps: () => number[];
    /** Real slide indexes at least half inside the viewport once the track comes to rest. */
    slidesInView: () => number[];
    /** Copies of the slide list the loop needs to cover the viewport. 1 means none. */
    requiredCopies: () => number;
    /** Continuous scrolling in px per second. 0 stops it where it is. */
    setAutoScroll: (speed: number, direction?: CarouselAutoScrollDirection) => void;
    on: <E extends keyof EngineEvents>(event: E, listener: EngineEvents[E]) => () => void;
    reInit: () => void;
    destroy: () => void;
}

// ── Tuning ────────────────────────────────────────────────────────────────────

const FIXED_STEP_MS = 1000 / 60;
const BASE_FRICTION = 0.68;
/** Free glides use a softer spring so a flick coasts. */
const DRAG_FREE_DURATION = 43;
/** Only this much of the pointer's recent history counts towards a flick. */
const FLICK_WINDOW_MS = 100;
/** Pointer velocity (px/ms) is multiplied by these to turn a flick into distance. */
const SNAP_BOOST = { mouse: 300, touch: 400 };
const FREE_BOOST = { mouse: 500, touch: 600 };
/** Fastest flick honoured, in px/ms. A jumpy pointer can report far more. */
const MAX_FLICK_VELOCITY = 6;
/** Drag distance kept past a non-looping edge. */
const EDGE_RESISTANCE = 0.3;
/** Quiet time after the last wheel event before the track snaps. */
const WHEEL_SETTLE_MS = 140;
/** Movement below this, in px, is not yet a drag. */
const DRAG_SLOP = 4;
/** Close enough to call it landed; the spring's last half pixel takes longer than the rest of the move. */
const SETTLE_EPSILON = 0.5;

const FORM_FIELDS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

/** Marks a clone the React layer rendered to pad out a short loop. */
export const CLONE_ATTRIBUTE = "data-carousel-clone";

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Signed remainder in (-period/2, period/2]: the short way round a ring. */
function wrapDelta(delta: number, period: number): number {
    if (!period) return delta;
    const wrapped = ((((delta + period / 2) % period) + period) % period) - period / 2;
    return wrapped === -period / 2 ? period / 2 : wrapped;
}

interface Layout {
    viewSize: number;
    /** Start of every DOM slide relative to the viewport with the track at 0. */
    bases: number[];
    sizes: number[];
    realCount: number;
    /** Width of one copy of the real slides, including the gap that closes the ring. */
    period: number;
    /** Width of every copy together. What slides wrap by when they fall off an edge. */
    displayPeriod: number;
    snaps: number[];
    slideSnaps: number[];
    /** Non-looping bounds for `location`. */
    min: number;
    max: number;
    canLoop: boolean;
    requiredCopies: number;
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function createCarouselEngine(viewport: HTMLElement, container: HTMLElement, userOptions: Partial<CarouselEngineOptions> = {}): CarouselEngine {
    // Undefined means "use the default", not "unset it".
    const defined = Object.fromEntries(Object.entries(userOptions).filter(([, value]) => value !== undefined));
    const options: CarouselEngineOptions = { ...defaultEngineOptions, ...defined };
    const win = viewport.ownerDocument.defaultView ?? window;

    const listeners: { [E in keyof EngineEvents]: Set<EngineEvents[E]> } = {
        select: new Set(),
        settle: new Set(),
        reinit: new Set(),
        interaction: new Set(),
    };

    function emit<E extends keyof EngineEvents>(event: E, ...args: Parameters<EngineEvents[E]>) {
        listeners[event].forEach((listener) => (listener as (...a: Parameters<EngineEvents[E]>) => void)(...args));
    }

    let layout: Layout;
    let slides: HTMLElement[] = [];
    let shifts: number[] = [];

    let location = 0;
    let target = 0;
    let velocity = 0;
    let duration = options.duration;
    let selected = 0;

    /** Recompute the selection from position each frame, rather than trusting a scrollTo. */
    let trackClosest = false;

    let autoSpeed = 0;
    let autoDirection: CarouselAutoScrollDirection = "forward";
    /** A user move interrupted continuous scrolling; resume it once the track settles. */
    let autoSuspended = false;

    // ── Measurement ──────────────────────────────────────────────────────────

    function alignOffset(size: number, viewSize: number): number {
        if (options.align === "center") return (viewSize - size) / 2;
        if (options.align === "end") return viewSize - size;
        return 0;
    }

    /** Groups of real slide indexes that move together. */
    function groupSlides(bases: number[], sizes: number[], count: number, viewSize: number): number[][] {
        const groups: number[][] = [];
        if (options.slidesToScroll === "auto") {
            let group: number[] = [];
            for (let i = 0; i < count; i += 1) {
                const start = group.length ? bases[group[0]] : bases[i];
                if (group.length && bases[i] + sizes[i] - start > viewSize + 0.5) {
                    groups.push(group);
                    group = [];
                }
                group.push(i);
            }
            if (group.length) groups.push(group);
            return groups;
        }
        const step = Math.max(1, Math.floor(options.slidesToScroll));
        for (let i = 0; i < count; i += step) groups.push(Array.from({ length: Math.min(step, count - i) }, (_, k) => i + k));
        return groups;
    }

    function measure(): Layout {
        slides = Array.from(container.children) as HTMLElement[];
        const realCount = slides.filter((slide) => !slide.hasAttribute(CLONE_ATTRIBUTE)).length;

        // Measure the untransformed layout; transforms are restored by render().
        container.style.transform = "";
        slides.forEach((slide) => (slide.style.transform = ""));
        shifts = slides.map(() => 0);

        const viewRect = viewport.getBoundingClientRect();
        const viewSize = viewRect.width;
        const rects = slides.map((slide) => slide.getBoundingClientRect());
        const bases = rects.map((rect) => rect.left - viewRect.left);
        const sizes = rects.map((rect) => rect.width);
        const gap = parseFloat(win.getComputedStyle(container).columnGap) || 0;

        const empty: Layout = {
            viewSize,
            bases,
            sizes,
            realCount,
            period: 0,
            displayPeriod: 0,
            snaps: [0],
            slideSnaps: [],
            min: 0,
            max: 0,
            canLoop: false,
            requiredCopies: 1,
        };
        if (!realCount || !viewSize) return empty;

        const last = realCount - 1;
        const realEnd = bases[last] + sizes[last];
        const period = slides.length > realCount ? bases[realCount] - bases[0] : realEnd - bases[0] + gap;
        const lastDom = slides.length - 1;
        const displayPeriod = slides.length > realCount ? bases[lastDom] + sizes[lastDom] - bases[0] + gap : period;
        const widest = Math.max(...sizes.slice(0, realCount));

        const loopWanted = options.loop && realCount > 1 && period > 0;
        // A slide is only moved once it is fully off the leading edge, so the ring
        // has to be at least a view plus the widest slide to never show a hole.
        const requiredCopies = loopWanted ? Math.max(1, Math.ceil((viewSize + widest + gap) / period)) : 1;
        const canLoop = loopWanted && displayPeriod >= viewSize + widest - 0.5;

        const groups = groupSlides(bases, sizes, realCount, viewSize);
        const aligned = groups.map((group) => {
            const first = group[0];
            const end = group[group.length - 1];
            return alignOffset(bases[end] + sizes[end] - bases[first], viewSize) - bases[first];
        });

        let snaps: number[];
        let groupSnaps: number[];
        let min: number;
        let max: number;

        const extent = realEnd - bases[0];
        if (canLoop) {
            snaps = aligned;
            groupSnaps = aligned.map((_, index) => index);
            min = -Infinity;
            max = Infinity;
        } else if (extent <= viewSize + 0.5) {
            // Everything fits: one resting place, aligned as a block.
            snaps = [alignOffset(extent, viewSize) - bases[0]];
            groupSnaps = aligned.map(() => 0);
            min = max = snaps[0];
        } else if (options.containScroll) {
            max = -bases[0];
            min = viewSize - realEnd;
            snaps = [];
            groupSnaps = aligned.map((snap) => {
                const bounded = clamp(snap, min, max);
                const previous = snaps[snaps.length - 1];
                if (previous === undefined || Math.abs(previous - bounded) > 1) snaps.push(bounded);
                return snaps.length - 1;
            });
        } else {
            snaps = aligned;
            groupSnaps = aligned.map((_, index) => index);
            min = Math.min(...aligned);
            max = Math.max(...aligned);
        }

        const slideSnaps: number[] = [];
        groups.forEach((group, groupIndex) => group.forEach((slideIndex) => (slideSnaps[slideIndex] = groupSnaps[groupIndex])));

        return { viewSize, bases, sizes, realCount, period, displayPeriod, snaps, slideSnaps, min, max, canLoop, requiredCopies };
    }

    // ── Position maths ───────────────────────────────────────────────────────

    const snapCount = () => layout.snaps.length;

    function boundLocation(value: number): number {
        return layout.canLoop ? value : clamp(value, layout.min, layout.max);
    }

    function closestIndex(position: number): number {
        let best = 0;
        let bestDistance = Infinity;
        layout.snaps.forEach((snap, index) => {
            const delta = layout.canLoop ? wrapDelta(snap - position, layout.period) : snap - boundLocation(position);
            if (Math.abs(delta) < bestDistance) {
                bestDistance = Math.abs(delta);
                best = index;
            }
        });
        return best;
    }

    /** Distance to a snap, taking the short way round (or the given way) on a loop. */
    function distanceTo(index: number, direction: -1 | 0 | 1): number {
        const diff = layout.snaps[index] - target;
        if (!layout.canLoop) return diff;
        const candidates = [diff, diff + layout.period, diff - layout.period];
        // Forward means location decreases, so a forward move has a negative distance.
        const valid = direction ? candidates.filter((c) => Math.sign(c) === -direction || Math.abs(c) < 0.5) : candidates;
        return (valid.length ? valid : candidates).reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a));
    }

    /** Keep a looping track within one period of its first snap. */
    function wrap() {
        if (!layout.canLoop) return;
        const anchor = layout.snaps[0];
        let shift = 0;
        if (location > anchor + 0.5) shift = -layout.period;
        else if (location <= anchor - layout.period + 0.5) shift = layout.period;
        if (!shift) return;
        location += shift;
        target += shift;
    }

    function select(index: number) {
        if (index === selected) return;
        selected = index;
        emit("select", index);
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    function render() {
        container.style.transform = `translate3d(${location}px, 0, 0)`;
        if (!layout.canLoop) return;

        const { viewSize, displayPeriod, bases } = layout;
        slides.forEach((slide, index) => {
            // Place every slide in [viewSize - displayPeriod, viewSize): each one
            // appears exactly once, and anything off the left edge waits on the right.
            const natural = bases[index] + location;
            const shift = (Math.ceil((viewSize - natural) / displayPeriod) - 1) * displayPeriod;
            if (shift === shifts[index]) return;
            shifts[index] = shift;
            slide.style.transform = shift ? `translate3d(${shift}px, 0, 0)` : "";
        });
    }

    function slideSpan(index: number): [number, number] {
        const start = layout.bases[index] + location + (shifts[index] ?? 0);
        return [start, start + layout.sizes[index]];
    }

    // ── Animation loop ───────────────────────────────────────────────────────

    let frame = 0;
    let lastTime: number | null = null;
    let accumulated = 0;

    const pointer = {
        active: false,
        dragging: false,
        id: -1,
        type: "mouse" as "mouse" | "touch",
        startX: 0,
        startY: 0,
        lastX: 0,
        startIndex: 0,
        samples: [] as { x: number; t: number }[],
        preventClick: false,
    };
    let wheelActive = false;
    let wheelTimer = 0;

    const isHeld = () => pointer.dragging || wheelActive;
    const isAutoScrolling = () => autoSpeed > 0 && !autoSuspended && !isHeld();

    function update() {
        if (isAutoScrolling()) {
            const step = ((autoDirection === "forward" ? -1 : 1) * autoSpeed) / 60;
            const next = boundLocation(location + step);
            // A track that cannot loop just runs out; stop rather than spin in place.
            if (next === location) autoSpeed = 0;
            location = target = next;
            velocity = 0;
        } else if (!isHeld()) {
            const displacement = target - location;
            if (!duration) {
                location = target;
                velocity = 0;
            } else {
                velocity += displacement / duration;
                velocity *= BASE_FRICTION;
                location += velocity;
            }
        }
        wrap();
        if (trackClosest) select(closestIndex(location));
    }

    function settled(): boolean {
        if (isHeld() || isAutoScrolling()) return false;
        return Math.abs(target - location) < SETTLE_EPSILON && Math.abs(velocity) < SETTLE_EPSILON;
    }

    function tick(time: number) {
        if (lastTime === null) lastTime = time;
        // Cap the catch-up so a backgrounded tab does not replay seconds of physics.
        accumulated += Math.min(time - lastTime, 100);
        lastTime = time;
        while (accumulated >= FIXED_STEP_MS) {
            update();
            accumulated -= FIXED_STEP_MS;
        }
        render();

        if (settled()) {
            location = target;
            velocity = 0;
            render();
            stop();
            if (trackClosest) select(closestIndex(location));
            trackClosest = autoSpeed > 0;
            duration = options.duration;
            autoSuspended = false;
            emit("settle");
            // Continuous scrolling was only suspended for the move; pick it back up.
            if (autoSpeed > 0) start();
            return;
        }
        frame = win.requestAnimationFrame(tick);
    }

    function start() {
        if (frame) return;
        lastTime = null;
        accumulated = 0;
        frame = win.requestAnimationFrame(tick);
    }

    function stop() {
        if (!frame) return;
        win.cancelAnimationFrame(frame);
        frame = 0;
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    function scrollTo(index: number, direction: -1 | 0 | 1 = 0) {
        const count = snapCount();
        if (!count) return;
        const next = layout.canLoop ? ((index % count) + count) % count : clamp(index, 0, count - 1);
        target += distanceTo(next, direction);
        if (!layout.canLoop) target = boundLocation(target);
        duration = options.duration;
        trackClosest = false;
        if (autoSpeed > 0) autoSuspended = true;
        select(next);
        start();
    }

    const canPrev = () => (layout.canLoop ? snapCount() > 1 : target < layout.max - 0.5);
    const canNext = () => (layout.canLoop ? snapCount() > 1 : target > layout.min + 0.5);

    function step(delta: 1 | -1) {
        if (delta > 0 ? !canNext() : !canPrev()) return;
        // Free-dragged tracks rest between snaps, so step from the nearest one.
        const from = options.dragFree ? closestIndex(target) : selected;
        const index = from + delta;
        scrollTo(layout.canLoop ? index : clamp(index, 0, snapCount() - 1), delta);
    }

    // ── Pointer dragging ─────────────────────────────────────────────────────

    /** Beyond a non-looping edge, only part of each drag delta lands. */
    function resisted(next: number, delta: number): number {
        if (layout.canLoop) return next;
        if (next > layout.max || next < layout.min) return target + delta * EDGE_RESISTANCE;
        return next;
    }

    function onPointerDown(event: PointerEvent) {
        if (!options.draggable || pointer.active) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const element = event.target as HTMLElement;
        if (FORM_FIELDS.has(element.nodeName) || element.closest("[data-carousel-no-drag]")) return;

        pointer.active = true;
        pointer.dragging = false;
        pointer.id = event.pointerId;
        pointer.type = event.pointerType === "mouse" ? "mouse" : "touch";
        pointer.startX = pointer.lastX = event.clientX;
        pointer.startY = event.clientY;
        pointer.samples = [{ x: event.clientX, t: event.timeStamp }];
        pointer.preventClick = false;
        emit("interaction", "pointerdown");
    }

    function beginDrag() {
        pointer.dragging = true;
        // Catch the track where it is, including mid-glide.
        target = location;
        velocity = 0;
        pointer.startIndex = closestIndex(location);
        trackClosest = true;
        viewport.setAttribute("data-dragging", "");
        start();
    }

    function onPointerMove(event: PointerEvent) {
        if (!pointer.active || event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;

        if (!pointer.dragging) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_SLOP) return;
            // A mostly vertical touch is the page scrolling; let it go.
            if (pointer.type === "touch" && Math.abs(dy) >= Math.abs(dx)) return endPointer(false);
            beginDrag();
            try {
                viewport.setPointerCapture(event.pointerId);
            } catch {
                // The pointer may already be gone; the drag still works without capture.
            }
        }

        const delta = event.clientX - pointer.lastX;
        pointer.lastX = event.clientX;
        target = resisted(target + delta, delta);
        location = target;
        wrap();
        // Draw now rather than on the next frame: the track stays under the finger.
        render();
        if (Math.abs(dx) > options.dragThreshold) pointer.preventClick = true;

        pointer.samples.push({ x: event.clientX, t: event.timeStamp });
        while (pointer.samples.length > 2 && event.timeStamp - pointer.samples[0].t > FLICK_WINDOW_MS) pointer.samples.shift();
    }

    /** Pointer speed over the last moments of the drag, in px/ms. */
    function releaseVelocity(upTime: number): number {
        const first = pointer.samples[0];
        const last = pointer.samples[pointer.samples.length - 1];
        if (!first || !last || last.t === first.t) return 0;
        // Holding still before letting go is a placement, not a flick.
        if (upTime - last.t > FLICK_WINDOW_MS) return 0;
        const velocity = (last.x - first.x) / Math.max(last.t - first.t, 1);
        return clamp(velocity, -MAX_FLICK_VELOCITY, MAX_FLICK_VELOCITY);
    }

    function release(force: number) {
        if (options.dragFree) {
            target = boundLocation(target + force);
            duration = DRAG_FREE_DURATION;
            trackClosest = true;
            if (autoSpeed > 0) autoSuspended = true;
            start();
            return;
        }

        const threshold = clamp(layout.viewSize * 0.2, 50, 225);
        if (Math.abs(force) < threshold) {
            // A gentle release lands on whichever snap the momentum carries it nearest.
            scrollTo(closestIndex(target + force));
            return;
        }
        // A real flick moves one snap on from where the drag started, however
        // short the drag, and never further: a hard flick should not spin a loop.
        const direction = force < 0 ? 1 : -1;
        const here = closestIndex(target);
        const count = snapCount();
        const moved = layout.canLoop ? Math.round(wrapDelta(here - pointer.startIndex, count)) : here - pointer.startIndex;
        // Already dragged a snap or more the same way: land there. Otherwise take one step.
        const next = Math.sign(moved) === direction ? here : pointer.startIndex + direction;
        scrollTo(layout.canLoop ? next : clamp(next, 0, count - 1), direction);
    }

    function endPointer(wasRelease: boolean, event?: PointerEvent) {
        const dragged = pointer.dragging;
        pointer.active = false;
        pointer.dragging = false;
        viewport.removeAttribute("data-dragging");
        if (event && viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);

        if (dragged) {
            const boost = options.dragFree ? FREE_BOOST[pointer.type] : SNAP_BOOST[pointer.type];
            release(wasRelease && event ? releaseVelocity(event.timeStamp) * boost : 0);
        }
        emit("interaction", "pointerup");
    }

    const onPointerUp = (event: PointerEvent) => event.pointerId === pointer.id && pointer.active && endPointer(true, event);
    const onPointerCancel = (event: PointerEvent) => event.pointerId === pointer.id && pointer.active && endPointer(false, event);

    function onClickCapture(event: MouseEvent) {
        if (!pointer.preventClick) return;
        event.preventDefault();
        event.stopPropagation();
        pointer.preventClick = false;
    }

    // ── Wheel and trackpad ───────────────────────────────────────────────────

    function onWheel(event: WheelEvent) {
        if (!options.wheel || pointer.dragging) return;
        const horizontal = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        // Vertical intent belongs to the page.
        if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        if (!horizontal) return;
        event.preventDefault();

        if (!wheelActive) {
            wheelActive = true;
            target = location;
            velocity = 0;
            trackClosest = true;
            emit("interaction", "wheelstart");
        }
        const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? layout.viewSize : 1;
        target = boundLocation(target - horizontal * scale);
        location = target;
        wrap();
        render();
        start();

        win.clearTimeout(wheelTimer);
        wheelTimer = win.setTimeout(() => {
            wheelActive = false;
            if (options.dragFree) {
                if (autoSpeed > 0) autoSuspended = true;
                start();
            } else {
                scrollTo(closestIndex(location));
            }
            emit("interaction", "wheelend");
        }, WHEEL_SETTLE_MS);
    }

    // ── Focus ────────────────────────────────────────────────────────────────

    function onFocusIn(event: FocusEvent) {
        const slide = slides.find((node) => node.contains(event.target as Node));
        if (!slide || slide.hasAttribute(CLONE_ATTRIBUTE)) return;
        // overflow: clip stops the browser scrolling the viewport itself, so a
        // tabbed-to slide that is out of view has to be brought in by the track.
        viewport.scrollLeft = 0;
        const index = slides.indexOf(slide);
        const [start, end] = slideSpan(index);
        if (start >= -0.5 && end <= layout.viewSize + 0.5) return;
        const snap = layout.slideSnaps[index];
        if (snap !== undefined) scrollTo(snap);
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    let observedSize = "";

    function reInit() {
        const keep = selected;
        const autoWasOn = autoSpeed > 0;
        layout = measure();
        observedSize = `${layout.viewSize}:${layout.sizes.join(",")}`;
        selected = clamp(keep, 0, snapCount() - 1);
        // Continuous scrolling keeps its place; everything else rests on its snap.
        location = autoWasOn ? boundLocation(location) : layout.snaps[selected];
        target = location;
        velocity = 0;
        wrap();
        render();
        emit("reinit");
        if (autoWasOn) start();
    }

    const resizeObserver = new ResizeObserver(() => {
        const size = `${viewport.getBoundingClientRect().width}:${slides.map((slide) => slide.getBoundingClientRect().width).join(",")}`;
        if (size !== observedSize) reInit();
    });

    const mutationObserver = new MutationObserver(() => {
        reInit();
        observeSlides();
    });

    function observeSlides() {
        resizeObserver.disconnect();
        resizeObserver.observe(viewport);
        slides.forEach((slide) => resizeObserver.observe(slide));
    }

    function onVisibilityChange() {
        if (viewport.ownerDocument.hidden) lastTime = null;
    }

    const preventNativeDrag = (event: DragEvent) => event.preventDefault();

    layout = measure();
    selected = clamp(options.startIndex, 0, snapCount() - 1);
    location = target = layout.snaps[selected];
    render();
    observedSize = `${layout.viewSize}:${layout.sizes.join(",")}`;
    observeSlides();
    mutationObserver.observe(container, { childList: true });

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerCancel);
    viewport.addEventListener("lostpointercapture", onPointerCancel);
    viewport.addEventListener("click", onClickCapture, true);
    viewport.addEventListener("dragstart", preventNativeDrag);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("focusin", onFocusIn);
    viewport.ownerDocument.addEventListener("visibilitychange", onVisibilityChange);

    function destroy() {
        stop();
        win.clearTimeout(wheelTimer);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointermove", onPointerMove);
        viewport.removeEventListener("pointerup", onPointerUp);
        viewport.removeEventListener("pointercancel", onPointerCancel);
        viewport.removeEventListener("lostpointercapture", onPointerCancel);
        viewport.removeEventListener("click", onClickCapture, true);
        viewport.removeEventListener("dragstart", preventNativeDrag);
        viewport.removeEventListener("wheel", onWheel);
        viewport.removeEventListener("focusin", onFocusIn);
        viewport.ownerDocument.removeEventListener("visibilitychange", onVisibilityChange);
        viewport.removeAttribute("data-dragging");
        container.style.transform = "";
        slides.forEach((slide) => (slide.style.transform = ""));
        Object.values(listeners).forEach((set) => set.clear());
    }

    return {
        scrollTo,
        next: () => step(1),
        prev: () => step(-1),
        selectedIndex: () => selected,
        snapCount,
        canPrev,
        canNext,
        slideSnaps: () => layout.slideSnaps.slice(),
        slidesInView: () => {
            // Measured where the track is headed, so it is right the moment a move is decided.
            const { viewSize, displayPeriod, bases, sizes } = layout;
            const seen = new Set<number>();
            slides.forEach((_, index) => {
                let start = bases[index] + target;
                if (layout.canLoop) start += (Math.ceil((viewSize - start) / displayPeriod) - 1) * displayPeriod;
                const visible = Math.min(start + sizes[index], viewSize) - Math.max(start, 0);
                if (visible >= sizes[index] / 2) seen.add(index % Math.max(1, layout.realCount));
            });
            return [...seen].sort((a, b) => a - b);
        },
        requiredCopies: () => layout.requiredCopies,
        setAutoScroll: (speed, direction = "forward") => {
            autoSpeed = Math.max(0, speed);
            autoDirection = direction;
            if (autoSpeed > 0) {
                // Resuming mid-glide (say, just after a drag) lets the glide land first.
                if (Math.abs(target - location) >= SETTLE_EPSILON || Math.abs(velocity) >= SETTLE_EPSILON) autoSuspended = true;
                trackClosest = true;
                start();
            } else {
                // Stop where it is. Snapping on pause would make the strip jump.
                target = location;
                velocity = 0;
            }
        },
        on: (event, listener) => {
            listeners[event].add(listener);
            return () => listeners[event].delete(listener);
        },
        reInit,
        destroy,
    };
}
