import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CarouselProduct } from "./carousel-types";
import { ProductCarousel } from "./product-carousel";

// ─── Sample Data ──────────────────────────────────────────────────────────────

/** The same Sale-category stand-ins the shop hero banner uses. */
const saleProducts: CarouselProduct[] = [
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
    title: "Base/ProductCarousel",
    component: ProductCarousel,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onProductClick: { action: "onProductClick" },
        onActiveIndexChange: { action: "onActiveIndexChange" },
        motion: { control: "inline-radio", options: ["auto", "full", "reduced"] },
        autoRotateDirection: { control: "inline-radio", options: ["left", "right"] },
    },
    args: {
        products: saleProducts,
    },
} satisfies Meta<typeof ProductCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** The deck cycling on its own every three seconds. Hover or focus it to hold. */
export const Default: Story = {};

/**
 * On the warm gradient the original animation sat on, to show the card shadow and
 * the depth stagger reading against a coloured ground.
 */
export const OnGradient: Story = {
    parameters: { layout: "fullscreen" },
    render: (args) => (
        <div className="flex min-h-[420px] items-center bg-linear-180 from-[#ffb253] to-[#f56259] p-6">
            <ProductCarousel {...args} />
        </div>
    ),
};

/**
 * Autoplay switched off. The deck still advances on click and on arrow keys, which
 * is the configuration to reach for when it sits alongside other moving content.
 */
export const NoAutoRotate: Story = {
    args: {
        autoRotateInterval: 0,
    },
};

/** Cards travel rightward instead — the incoming card arrives from the left. */
export const RotatingRight: Story = {
    args: {
        autoRotateDirection: "right",
    },
};

/** A slower cadence, for a deck sitting where the viewer is reading rather than browsing. */
export const SlowRotation: Story = {
    args: {
        autoRotateInterval: 6000,
    },
};

/** Skeleton shown while the catalog request is in flight. */
export const Loading: Story = {
    args: {
        isLoading: true,
    },
};

/** Full-price items — the struck-through original only appears when there is a discount. */
export const WithoutDiscounts: Story = {
    args: {
        products: saleProducts.map((product) => ({ ...product, originalPoints: undefined })),
    },
};

/**
 * A three-product catalog — the fewest the deck can hold without showing the same
 * card twice. The band narrows to one card either side of the front.
 */
export const ThreeProducts: Story = {
    args: {
        products: saleProducts.slice(0, 3),
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
 * carousel's own rotation stay in step.
 */
export const Controlled: Story = {
    render: function ControlledCarousel(args) {
        const [activeIndex, setActiveIndex] = useState(0);

        return (
            <div className="flex flex-col gap-4">
                <ProductCarousel {...args} activeIndex={activeIndex} onActiveIndexChange={setActiveIndex} />

                <div className="flex flex-wrap justify-center gap-2">
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
