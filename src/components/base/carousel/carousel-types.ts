import type { HeroBannerProduct } from "@/components/base/hero-banner/hero-banner-types";

/**
 * A card in the deck.
 *
 * The same shape the shop hero banner takes, so one mapped catalog response
 * feeds both components. Re-exported under a local name so callers of the
 * carousel do not have to import from the banner's folder.
 */
export type CarouselProduct = HeroBannerProduct;

export interface ProductCarouselProps {
    /** Cards in display order. Three or more keeps the deck from repeating a card. */
    products: CarouselProduct[];

    /** Controlled front-card index. Leave undefined to let the carousel own it. */
    activeIndex?: number;
    /** Starting index when uncontrolled. Defaults to 0. */
    defaultActiveIndex?: number;
    onActiveIndexChange?: (index: number, product: CarouselProduct) => void;

    /** Fired when the front card is activated. Cards behind it advance the deck instead. */
    onProductClick?: (product: CarouselProduct, index: number) => void;

    /** Advance every N milliseconds. 0 disables it. Pauses on hover and focus. */
    autoRotateInterval?: number;

    /**
     * Which way the deck travels when autoplay advances, named for what the viewer
     * sees. `left` (default) matches the source animation: the next card arrives
     * from the right and the spent card slides off to the left.
     */
    autoRotateDirection?: "left" | "right";

    /** Renders the skeleton deck — use while the catalog request is in flight. */
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

    /** Labels the carousel for assistive tech. */
    label?: string;

    className?: string;
    id?: string;
}
