import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { HeroBannerProduct } from "./hero-banner-types";
import { ShopHeroBanner } from "./shop-hero-banner";

// ─── Sample Data ──────────────────────────────────────────────────────────────

/** Stand-in for the newest items in the Sale category. */
const saleProducts: HeroBannerProduct[] = [
    {
        id: "APL-IPADP13-512-SLV",
        name: 'Apple 13" iPad Pro Wifi + Cellular 512GB Silver',
        imageSrc: "/mock-products/ipad-pro-silver.jpg",
        points: 54125,
        originalPoints: 62500,
        href: "#ipad-pro-512",
    },
    {
        id: "TRG-TIMBERLINE-XL",
        name: "Traeger Timberline XL Wood Pellet Grill",
        imageSrc: "/mock-products/traeger-timberline-grill.jpg",
        points: 78900,
        originalPoints: 92400,
        href: "#traeger-timberline-xl",
    },
    {
        id: "YTI-ROADIE-24-CHR",
        name: "YETI Roadie 24 Hard Cooler Charcoal",
        imageSrc: "/mock-products/yeti-roadie-cooler.jpg",
        points: 12450,
        originalPoints: 15800,
        href: "#yeti-roadie-24",
    },
    {
        id: "TM-TP5X-DZ",
        name: "TaylorMade TP5x Golf Balls, One Dozen",
        imageSrc: "/mock-products/taylormade-golf-balls.jpg",
        points: 3980,
        originalPoints: 4950,
        href: "#taylormade-tp5x",
    },
    {
        id: "APL-IPADP13-1TB-SLV",
        name: 'Apple 13" iPad Pro Wifi + Cellular 1TB Silver',
        imageSrc: "/mock-products/ipad-pro-silver.jpg",
        points: 68400,
        originalPoints: 79900,
        href: "#ipad-pro-1tb",
    },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/ShopHeroBanner",
    component: ShopHeroBanner,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onCtaClick: { action: "onCtaClick" },
        onProductClick: { action: "onProductClick" },
        onActiveIndexChange: { action: "onActiveIndexChange" },
        motion: { control: "inline-radio", options: ["auto", "full", "reduced"] },
        autoRotateDirection: { control: "inline-radio", options: ["left", "right"] },
    },
    args: {
        products: saleProducts,
    },
} satisfies Meta<typeof ShopHeroBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Shop hero with the newest Sale-category rewards rotating every five seconds. */
export const Default: Story = {
    args: {
        ctaHref: "#shop-sale",
    },
};

/**
 * Autoplay switched off. The fan still rotates on click and on arrow keys, which
 * is the configuration to reach for when the banner sits above other moving content.
 */
export const NoAutoRotate: Story = {
    args: {
        autoRotateInterval: 0,
    },
};

/** Cards travel leftward instead — the incoming card arrives from the right. */
export const RotatingLeft: Story = {
    args: {
        autoRotateDirection: "left",
    },
};

/** Skeleton shown while the catalog request is in flight. */
export const Loading: Story = {
    args: {
        isLoading: true,
    },
};

/** Copy overridden for a different merchandising push. */
export const CustomCopy: Story = {
    args: {
        eyebrow: "CATEGORY: NEW ARRIVALS",
        heading: "Just Landed in the Catalog",
        supportingText: "Fresh rewards added this week, from backyard gear to the latest tech. Redeem them before they move to the main catalog.",
        ctaLabel: "Browse new arrivals",
        ctaHref: "#new-arrivals",
    },
};

/**
 * A two-product catalog. The fan narrows to one card either side of centre so the
 * same product never appears twice in the same frame.
 */
export const TwoProducts: Story = {
    args: {
        products: saleProducts.slice(0, 2),
    },
};

/** Animation forced off, matching what a viewer with Reduce Motion enabled sees. */
export const ReducedMotion: Story = {
    args: {
        motion: "reduced",
    },
};

/**
 * Controlled mode: the parent owns `activeIndex`, so external controls and the
 * banner's own rotation stay in step.
 */
export const Controlled: Story = {
    render: function ControlledBanner(args) {
        const [activeIndex, setActiveIndex] = useState(0);

        return (
            <div className="flex flex-col gap-4">
                <ShopHeroBanner {...args} activeIndex={activeIndex} onActiveIndexChange={setActiveIndex} />

                <div className="flex flex-wrap gap-2">
                    {args.products.map((product, index) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={
                                index === activeIndex
                                    ? "rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white"
                                    : "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-secondary ring-inset hover:bg-primary_hover"
                            }
                        >
                            {product.name.split(" ").slice(0, 2).join(" ")}
                        </button>
                    ))}
                </div>
            </div>
        );
    },
};
