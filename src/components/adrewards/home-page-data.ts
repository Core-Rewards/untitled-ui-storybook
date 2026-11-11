import {
    Bell01,
    BookOpen01,
    CurrencyDollarCircle,
    File06,
    Gift01,
    HelpCircle,
    Home02,
    Receipt,
    Settings01,
    ShieldTick,
    ShoppingBag01,
    Tag01,
    Truck01,
    User01,
    Users01,
} from "@untitledui/icons";
import type { AppAccountMenuItem, AppBrand, AppNavEntry } from "@/components/base/app-shell/app-shell-types";
import type { ContentCategory } from "@/components/base/content-card/content-card-types";
import type { AppNotification } from "@/components/base/notifications/notifications-drawer";
import type { PromotionCardData } from "@/components/base/promotion-card/promotion-card-types";
import type { QuizQuestion } from "@/components/base/quiz/quiz-types";

/** Only the home page is built, so every other link stays put. */
export const STATIC_HREF = "#";

export const brand: AppBrand = { logoSrc: "/brand/ad_rewards_logo.png", name: "AD Rewards", href: STATIC_HREF };

export const accountName = "Rewards Admin";
export const pointsBalance = 34437659;

export const navItems: AppNavEntry[] = [
    { id: "home", label: "Home", href: STATIC_HREF, icon: Home02 },
    { id: "shop", label: "Shop Rewards", href: STATIC_HREF, icon: ShoppingBag01 },
    { id: "earn", label: "How to Earn", href: STATIC_HREF, icon: CurrencyDollarCircle },
    { id: "suppliers", label: "Participating Suppliers", href: STATIC_HREF, icon: Users01 },
    { id: "promotions", label: "Promotions", href: STATIC_HREF, icon: Tag01 },
    { id: "sales-history", label: "Sales History", href: STATIC_HREF, icon: Receipt },
    { id: "education", label: "Education Center", href: STATIC_HREF, icon: BookOpen01 },
    { id: "help", label: "Help", href: STATIC_HREF, icon: HelpCircle },
    { divider: true },
    { id: "rules", label: "Program Rules", href: STATIC_HREF, icon: File06 },
    { id: "terms", label: "Terms of Use", href: STATIC_HREF, icon: File06 },
    { id: "privacy", label: "Privacy Statement", href: STATIC_HREF, icon: ShieldTick },
];

export const accountMenuItems: AppAccountMenuItem[] = [
    { id: "profile", label: "View profile", icon: User01, href: STATIC_HREF },
    { id: "orders", label: "Order history", icon: Receipt, href: STATIC_HREF },
    { id: "settings", label: "Account settings", icon: Settings01, href: STATIC_HREF },
];

export const initialNotifications: AppNotification[] = [
    {
        id: "question",
        title: "A new Question of the Week is ready",
        body: "Answer correctly to earn a spin for up to 10,000 points.",
        time: "2 hours ago",
        icon: HelpCircle,
        isUnread: true,
    },
    {
        id: "ergodyne",
        title: "Ergodyne triple points extended",
        body: "Type 2 MIPS hard hats now earn 3x points through December 31.",
        time: "Yesterday",
        icon: Tag01,
        isUnread: true,
    },
    {
        id: "points",
        title: "12,480 points were added to your balance",
        body: "October sales from participating suppliers have posted.",
        time: "Nov 5",
        icon: Gift01,
        isUnread: true,
    },
    {
        id: "order",
        title: "Your order has shipped",
        body: "Order #AD-48213 is on its way and should arrive by Friday.",
        time: "Nov 2",
        icon: Truck01,
    },
    {
        id: "rules",
        title: "Program rules were updated",
        body: "See what changed for the 2027 program year.",
        time: "Oct 28",
        icon: Bell01,
    },
];

export const question: QuizQuestion = {
    id: "2026-w46",
    period: "Spin to Win with ABB (T&B)",
    prompt: "What applications are the Superstrut® & Kindorf® U-Shaped Strut Washer ideal for use in?",
    options: [
        { id: "data-centers", label: "Data Centers" },
        { id: "industrial", label: "Industrial Manufacturing" },
        { id: "food-beverage", label: "Food & Beverage" },
        { id: "water", label: "Water & Wastewater" },
        { id: "all", label: "All of the above" },
    ],
    correctOptionId: "all",
    explanation: "The U-Shaped Strut Washer is built for all of these environments.",
    resource: { href: STATIC_HREF, label: "Need help? View the question resource" },
};

export const promotions: PromotionCardData[] = [
    {
        id: "florida-pneumatic-3x",
        name: "Earn 3X AD Rewards Points!",
        description: "Earn triple AD Rewards points on select UT8080 series 1HP die grinders!",
        offer: { kind: "multiplier", multiplier: 3 },
        startDate: "2025-04-01",
        endDate: "2026-12-31",
        media: { type: "logo", src: "/supplier-logos/isd/floridapneumatic.jpg", alt: "Florida Pneumatic" },
        href: STATIC_HREF,
    },
    {
        id: "brasscraft-2x",
        name: "Earn 2X AD Rewards Points with BrassCraft!",
        description: "Earn double AD Rewards points on qualifying water heater connectors from BrassCraft!",
        offer: { kind: "multiplier", multiplier: 2 },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        media: { type: "logo", src: "/supplier-logos/plb/brasscraft.jpg", alt: "BrassCraft" },
        href: STATIC_HREF,
    },
    {
        id: "ergodyne-3x",
        name: "Ergodyne Type 2 MIPS Hard Hats Triple Point Promotion!",
        description:
            "Extended through 12/31/2026. Earn triple AD Rewards points on the brand new Type 2 MIPS hard hats from Ergodyne, featuring the exclusive MIPS Evolve Pro.",
        offer: { kind: "multiplier", multiplier: 3 },
        startDate: "2026-06-01",
        endDate: "2026-12-31",
        media: { type: "logo", src: "/supplier-logos/isd/ergodyne.jpg", alt: "Ergodyne" },
        href: STATIC_HREF,
    },
    {
        id: "crc-2x",
        name: "Double Points on CRC Brakleen",
        description: "Earn double AD Rewards points on every qualifying case of CRC Brakleen brake parts cleaner.",
        offer: { kind: "multiplier", multiplier: 2 },
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        media: { type: "logo", src: "/supplier-logos/isd/crc.jpg", alt: "CRC" },
        href: STATIC_HREF,
    },
    {
        id: "coxreels-bonus",
        name: "Coxreels Bonus Points",
        description: "Sell any Coxreels spring driven hose reel and earn bonus AD Rewards points on each one.",
        offer: { kind: "bonus", points: 500 },
        startDate: "2026-10-15",
        endDate: "2027-01-31",
        media: { type: "logo", src: "/supplier-logos/isd/coxreels.jpg", alt: "Coxreels" },
        href: STATIC_HREF,
    },
];

export const earnCategory: ContentCategory = { label: "How to Earn", color: "brand", icon: CurrencyDollarCircle, ctaLabel: "See how to earn" };
export const educationCategory: ContentCategory = { label: "Education Center", color: "indigo", icon: BookOpen01, ctaLabel: "Start learning now" };
