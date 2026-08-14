import type { MouseEvent } from "react";

/**
 * Shape the banner needs from a catalog item.
 *
 * Map the catalog response onto this in the data layer rather than widening the
 * component — the banner should never learn the catalog's field names.
 */
export interface HeroBannerProduct {
    /** Stable identifier — used as the React key and passed back in callbacks. */
    id: string | number;
    /** Product name shown under the image. */
    name: string;
    /** Absolute or root-relative URL for the product image. */
    imageSrc: string;
    /** Alt text. Falls back to `name` when omitted. */
    imageAlt?: string;
    /** Current (discounted) point cost. */
    points: number;
    /** Pre-sale point cost. Rendered struck through when it is higher than `points`. */
    originalPoints?: number;
    /** Product detail link. Renders the card as an anchor when present. */
    href?: string;
}

export interface ShopHeroBannerProps {
    /** Featured catalog items, already ordered for display. */
    products: HeroBannerProduct[];

    /** Pill above the heading. */
    eyebrow?: string;
    heading?: string;
    supportingText?: string;

    /** Primary call to action. */
    ctaLabel?: string;
    ctaHref?: string;
    onCtaClick?: (event: MouseEvent<HTMLElement>) => void;

    /** Controlled active index. Leave undefined to let the banner own it. */
    activeIndex?: number;
    /** Starting index when uncontrolled. Defaults to 0. */
    defaultActiveIndex?: number;
    onActiveIndexChange?: (index: number, product: HeroBannerProduct) => void;

    /** Fired when the centre product card is activated. */
    onProductClick?: (product: HeroBannerProduct, index: number) => void;

    /** Advance every N milliseconds. 0 disables it. Pauses on hover and focus. */
    autoRotateInterval?: number;

    /**
     * Which way the cards travel when autoplay advances, named for what the viewer
     * sees. `right` (default) is the motion you get by clicking the left-hand card:
     * the incoming card arrives from the left and glides right into the centre.
     */
    autoRotateDirection?: "left" | "right";

    /** Renders the skeleton state — use while the catalog request is in flight. */
    isLoading?: boolean;

    /**
     * Animation policy.
     * - `auto` (default) follows the viewer's `prefers-reduced-motion` setting.
     * - `full` always animates, even when the viewer asked for reduced motion.
     *   Use this for design review, not for production.
     * - `reduced` never animates.
     */
    motion?: "auto" | "full" | "reduced";

    /** Formats a point value. Defaults to `54,125 points`. */
    formatPoints?: (points: number) => string;

    className?: string;
    id?: string;
}
