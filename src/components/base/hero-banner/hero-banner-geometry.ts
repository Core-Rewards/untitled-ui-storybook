/** Ring-buffer maths behind the rotating card fan. */

/** Always-positive modulo, unlike `%` for negative operands. */
export function mod(value: number, length: number): number {
    return ((value % length) + length) % length;
}

/**
 * Signed number of steps from `from` to `to` taking the shorter way around the
 * ring, so a controlled `activeIndex` jump still rotates the short direction.
 */
export function shortestDelta(from: number, to: number, length: number): number {
    if (length <= 1) return 0;
    let delta = mod(to - from, length);
    if (delta > length / 2) delta -= length;
    return delta;
}

export interface RingSlot<T> {
    /** Virtual position. Stable across rotations, so it makes a good React key. */
    position: number;
    /** Signed distance from the active slot: 0 is centre, negative is before. */
    offset: number;
    /** Real index into the source array. */
    index: number;
    item: T;
}

/**
 * Materialises the slots around `virtual`.
 *
 * `radius` deliberately overshoots the visible band: slots mount and unmount
 * out of sight, so an entering slot is already in the DOM (and can therefore
 * transition) by the time it rotates into view.
 */
export function ring<T>(items: T[], virtual: number, radius: number): RingSlot<T>[] {
    const length = items.length;
    const slots: RingSlot<T>[] = [];
    for (let position = virtual - radius; position <= virtual + radius; position += 1) {
        const index = mod(position, length);
        slots.push({ position, offset: position - virtual, index, item: items[index] });
    }
    return slots;
}

/**
 * How many slots either side of centre stay visible. Caps out at `max` and
 * shrinks for short catalogs so the same product never shows up twice.
 */
export function visibleHalf(length: number, max: number): number {
    return Math.max(0, Math.min(max, Math.floor((length - 1) / 2)));
}
