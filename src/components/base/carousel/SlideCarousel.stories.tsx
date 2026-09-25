import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel, CarouselContent, CarouselIndicators, CarouselNext, CarouselPlayToggle, CarouselPrevious, CarouselSlide } from "./carousel";
import { SlideCarousel } from "./slide-carousel";
import type { CarouselImageSlide } from "./slide-carousel-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

/**
 * Generated placeholder art, so the stories work offline and every slide is
 * obviously numbered. Swap `src` for real imagery in product code.
 */
function placeholder(label: string, hue: number, width = 1600, height = 900): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="hsl(${hue} 70% 58%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 38%)"/>
        </linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, system-ui, sans-serif"
            font-size="${Math.round(height / 5)}" font-weight="700" fill="white" fill-opacity="0.9">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const HUES = [210, 262, 330, 20, 45, 150, 185, 290];

const heroSlides: CarouselImageSlide[] = [
    { title: "Summer rewards are here", description: "Double points on outdoor gear through August." },
    { title: "New in electronics", description: "Tablets, headphones and smart home picks." },
    { title: "Redeem for experiences", description: "Tee times, tastings and weekend getaways." },
    { title: "Top up your streak", description: "Complete this week's quiz for a bonus." },
    { title: "Refer a teammate", description: "You both earn 2,500 points when they join." },
].map((copy, index) => ({
    id: `hero-${index + 1}`,
    src: placeholder(`Slide ${index + 1}`, HUES[index]),
    alt: copy.title,
    href: `#hero-${index + 1}`,
    ...copy,
}));

const tileSlides: CarouselImageSlide[] = HUES.map((hue, index) => ({
    id: `tile-${index + 1}`,
    src: placeholder(String(index + 1), hue, 800, 800),
    alt: `Tile ${index + 1}`,
}));

const productSlides: CarouselImageSlide[] = [
    { id: "ipad", src: "/mock-products/ipad-pro-silver.jpg", alt: 'Apple 13" iPad Pro' },
    { id: "grill", src: "/mock-products/traeger-timberline-grill.jpg", alt: "Traeger Timberline XL grill" },
    { id: "cooler", src: "/mock-products/yeti-roadie-cooler.jpg", alt: "YETI Roadie 24 cooler" },
    { id: "golf", src: "/mock-products/taylormade-golf-balls.jpg", alt: "TaylorMade TP5x golf balls" },
    { id: "ipad-2", src: "/mock-products/ipad-pro-silver.jpg", alt: 'Apple 13" iPad Pro, 1TB' },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/SlideCarousel",
    component: SlideCarousel,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onIndexChange: { action: "onIndexChange" },
        onSlideClick: { action: "onSlideClick" },
        align: { control: "inline-radio", options: ["start", "center", "end"] },
        arrows: { control: "inline-radio", options: [false, "overlay", "outside", "below"] },
        indicators: { control: "inline-radio", options: [false, "dots", "lines", "fraction"] },
        indicatorPlacement: { control: "inline-radio", options: ["overlay", "below"] },
        motion: { control: "inline-radio", options: ["auto", "full", "reduced"] },
    },
    args: {
        slides: heroSlides,
        label: "Featured promotions",
    },
} satisfies Meta<typeof SlideCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Every prop in the controls panel. One slide in view with overlay arrows and dots. */
export const Playground: Story = {
    args: {
        slidesPerView: 1,
        loop: true,
        arrows: "overlay",
        indicators: "dots",
    },
};

/**
 * Home page strip: five across on desktop, fewer on smaller screens, scrolling
 * continuously and edge to edge. Hover or focus holds it; the corner button
 * pauses it for good.
 */
export const ContinuousStrip: Story = {
    parameters: { layout: "fullscreen" },
    args: {
        slides: tileSlides,
        label: "Featured categories",
        slidesPerView: { base: 2, md: 3, lg: 5 },
        gap: 12,
        aspectRatio: "1/1",
        autoplay: { mode: "continuous", speed: 40 },
        dragFree: true,
        arrows: false,
        indicators: false,
    },
};

/** One image at a time with arrows over the image and scroll markers on it. */
export const SingleWithControls: Story = {
    args: {
        slidesPerView: 1,
        arrows: "overlay",
        indicators: "dots",
        indicatorPlacement: "overlay",
    },
};

/** Hero banner: loops on a timer, with progress lines that fill while each slide is shown. */
export const AutoplayHero: Story = {
    args: {
        slidesPerView: 1,
        loop: true,
        autoplay: { interval: 5000 },
        arrows: "overlay",
        indicators: "lines",
        indicatorPlacement: "overlay",
        aspectRatio: { base: "4/3", md: "21/9" },
    },
};

/** Three across that page by a full view at a time, with arrows either side. Markers count pages, not slides. */
export const PagedGrid: Story = {
    args: {
        slides: tileSlides,
        slidesPerView: { base: 1, sm: 2, lg: 3 },
        slidesToScroll: "auto",
        aspectRatio: "4/3",
        arrows: "outside",
        indicators: "dots",
    },
};

/** Centred slide with its neighbours peeking in, looping. */
export const CentredPeek: Story = {
    args: {
        slidesPerView: { base: 1.15, md: 1.6 },
        align: "center",
        loop: true,
        gap: { base: 12, md: 24 },
        arrows: "below",
        indicators: "dots",
    },
};

/** Products on a free-scrolling shelf with a counter. Drag, flick or swipe the trackpad. */
export const FreeScrollShelf: Story = {
    args: {
        slides: productSlides,
        slidesPerView: { base: 1.5, md: 3.5 },
        aspectRatio: "1/1",
        dragFree: true,
        arrows: "below",
        indicators: "fraction",
        onSlideClick: undefined,
    },
};

/**
 * Only three slides but five per view. The loop needs more width than the
 * slides provide, so the carousel renders inert copies to fill the ring.
 */
export const ShortLoop: Story = {
    parameters: { layout: "fullscreen" },
    args: {
        slides: tileSlides.slice(0, 3),
        slidesPerView: 5,
        aspectRatio: "1/1",
        gap: 8,
        autoplay: { mode: "continuous", speed: 60 },
        arrows: false,
        indicators: false,
        rounded: false,
    },
};

/** Placeholder slides while the images are fetched. */
export const Loading: Story = {
    args: {
        isLoading: true,
        slidesPerView: { base: 1, md: 3 },
        aspectRatio: "4/3",
    },
};

/** The page owns the index: the buttons above drive the carousel and follow it back. */
export const Controlled: Story = {
    render: (args) => {
        const [index, setIndex] = useState(2);
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {heroSlides.map((slide, slideIndex) => (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => setIndex(slideIndex)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-primary ${slideIndex === index ? "bg-brand-solid text-white" : "text-secondary"}`}
                        >
                            {slideIndex + 1}
                        </button>
                    ))}
                </div>
                <SlideCarousel {...args} index={index} onIndexChange={setIndex} />
            </div>
        );
    },
    args: {
        slidesPerView: 1,
        arrows: "overlay",
        indicators: false,
    },
};

/**
 * Built from the parts instead of the preset: title and controls share a
 * header row, and slides are custom cards. Use this route for layouts the
 * preset's props do not cover.
 */
export const ComposedParts: Story = {
    render: () => (
        <Carousel label="Recently viewed" slidesPerView={{ base: 1.3, sm: 2.3, lg: 4 }} gap={16} slidesToScroll="auto" autoplay={{ interval: 6000 }}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-primary">Recently viewed</h2>
                <div className="flex items-center gap-2">
                    <CarouselPlayToggle />
                    <CarouselPrevious />
                    <CarouselNext />
                </div>
            </div>
            <CarouselContent>
                {productSlides.concat(productSlides.map((slide) => ({ ...slide, id: `${slide.id}-again` }))).map((slide) => (
                    <CarouselSlide key={slide.id}>
                        <a href={`#${slide.id}`} className="flex flex-col gap-3 rounded-xl bg-primary p-3 ring-1 ring-secondary outline-brand focus-visible:outline-2 focus-visible:-outline-offset-2">
                            <img src={slide.src} alt="" draggable={false} className="pointer-events-none aspect-square w-full rounded-lg object-contain" />
                            <span className="line-clamp-2 text-sm text-primary">{slide.alt}</span>
                        </a>
                    </CarouselSlide>
                ))}
            </CarouselContent>
            <CarouselIndicators variant="lines" className="mt-4 justify-center" />
        </Carousel>
    ),
};
