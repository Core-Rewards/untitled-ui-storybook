import type { PromotionCardData } from "./promotion-card-types";

/** Fixed "today" for the stories, so countdowns read the same on every run. */
export const STORY_TODAY = new Date(2026, 9, 14);

/** A public dummy PDF, so the flyer action opens something real in Storybook. */
const sampleFlyer = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

/** Generated campaign art, so the stories work offline. Swap for real imagery in product code. */
function artwork(label: string, hue: number): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="hsl(${hue} 70% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 32%)"/>
        </linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <circle cx="660" cy="80" r="180" fill="white" fill-opacity="0.08"/>
        <circle cx="120" cy="420" r="140" fill="white" fill-opacity="0.06"/>
        <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, system-ui, sans-serif"
            font-size="64" font-weight="700" fill="white" fill-opacity="0.92">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A made-up wordmark standing in for a manufacturer logo. */
function wordmark(name: string, hue: number): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96">
        <rect x="0" y="18" width="60" height="60" rx="14" fill="hsl(${hue} 70% 45%)"/>
        <path d="M18 48 l12 12 l20 -24" stroke="white" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="76" y="62" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="700" fill="hsl(${hue} 40% 22%)">${name}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const samplePromotions: PromotionCardData[] = [
    {
        id: "triple-points-tober",
        name: "Triple Points'tober",
        description: "Sell Contractor Select products this month and earn triple points on every qualifying unit.",
        offer: { kind: "multiplier", multiplier: 3 },
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        media: { type: "image", src: artwork("Triple Points'tober", 24), alt: "" },
        href: "#triple-points-tober",
        flyerUrl: sampleFlyer,
        earnPotential: "Up to 18,000 pts per unit",
        eligibleProducts: ["Furnaces", "Heat pumps", "Air handlers", "Thermostats", "Coils"],
        enrollment: { enrolled: true },
        pointsEarned: 7200,
        progress: { current: 4, target: 10, unit: "units toward the 10-unit bonus" },
    },
    {
        id: "ductless-double-down",
        name: "Ductless Double Down",
        description: "Double points on all ductless mini-split systems, including multi-zone configurations.",
        offer: { kind: "multiplier", multiplier: 2 },
        startDate: "2026-09-15",
        endDate: "2026-10-18",
        media: { type: "logo", src: wordmark("Northwind", 205), alt: "Northwind Comfort" },
        href: "#ductless-double-down",
        recommended: { reason: "Based on your mini-split sales" },
        flyerUrl: sampleFlyer,
        eligibleProducts: ["Mini-splits", "Multi-zone"],
    },
    {
        id: "fast-start-bonus",
        name: "Fast Start Bonus",
        description: "Register your first five installs of the quarter and get a flat bonus on top of your usual points.",
        offer: { kind: "bonus", points: 5000 },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        href: "#fast-start-bonus",
        isNew: true,
        earnPotential: "5,000 pts once you hit 5 installs",
        enrollment: { enrolled: false },
    },
    {
        id: "adrx-fall",
        name: "ADRX Fall Accelerator",
        description: "Accelerated dealer rewards on qualifying commercial rooftop units sold through participating distributors.",
        offer: { kind: "custom", label: "ADRX" },
        startDate: "2026-10-20",
        endDate: "2026-11-30",
        media: { type: "image", src: artwork("ADRX", 262), alt: "" },
        href: "#adrx-fall",
        ctaLabel: "See qualifying units",
        eligibleProducts: ["Rooftop units", "Commercial"],
    },
    {
        id: "holiday-5x",
        name: "Holiday 5x Weekend",
        description: "Five times the points on every water heater sold over Black Friday weekend.",
        offer: { kind: "multiplier", multiplier: 5 },
        startDate: "2026-11-27",
        endDate: "2026-11-30",
        href: "#holiday-5x",
        isNew: true,
        recommended: { reason: "You sold 14 water heaters last quarter" },
        flyerUrl: sampleFlyer,
        earnPotential: "Up to 25,000 pts per unit",
        eligibleProducts: ["Water heaters"],
    },
    {
        id: "summer-cooling-kickoff",
        name: "Summer Cooling Kickoff",
        description: "Double points on condensers and air handlers sold ahead of the cooling season.",
        offer: { kind: "multiplier", multiplier: 2 },
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        media: { type: "image", src: artwork("Summer Kickoff", 190), alt: "" },
        href: "#summer-cooling-kickoff",
        pointsEarned: 12400,
    },
];

export const promotionById = (id: string) => {
    const promotion = samplePromotions.find((item) => item.id === id);
    if (!promotion) throw new Error(`No sample promotion "${id}"`);
    return promotion;
};
