import {
    Bell01,
    BookOpen01,
    CurrencyDollarCircle,
    File06,
    Grid01,
    HelpCircle,
    Receipt,
    Settings01,
    ShieldTick,
    ShoppingBag01,
    ShoppingCart01,
    Tag01,
    User01,
    Users01,
} from "@untitledui/icons";
import type { AppAccountMenuItem, AppBrand, AppHeaderAction, AppNavEntry } from "./app-shell-types";

export const sampleBrand: AppBrand = {
    logoSrc: "/brand/ad_rewards_logo.png",
    name: "AD Rewards",
    href: "#",
};

export const sampleAccountName = "Jordan Ellis";

export const sampleNavItems: AppNavEntry[] = [
    { id: "dashboard", label: "Dashboard", href: "#", icon: Grid01 },
    { id: "shop", label: "Shop Rewards", href: "#", icon: ShoppingBag01 },
    { id: "earn", label: "How to Earn", href: "#", icon: CurrencyDollarCircle },
    {
        id: "suppliers",
        label: "Participating Suppliers",
        href: "#",
        icon: Users01,
    },
    { id: "promotions", label: "Promotions", href: "#", icon: Tag01 },
    {
        id: "education",
        label: "AD Education Center",
        href: "https://example.com",
        icon: BookOpen01,
        isExternal: true,
    },
    { id: "help", label: "Help", href: "#", icon: HelpCircle },
    { divider: true },
    { id: "terms", label: "Terms of Use", href: "#", icon: File06 },
    { id: "privacy", label: "Privacy Statement", href: "#", icon: ShieldTick },
];

export const sampleHeaderActions: AppHeaderAction[] = [
    { id: "cart", label: "Cart", icon: ShoppingCart01, badge: 2 },
    { id: "notifications", label: "Notifications", icon: Bell01, badge: true },
];

export const sampleAccountMenuItems: AppAccountMenuItem[] = [
    { id: "profile", label: "View profile", icon: User01, href: "#" },
    { id: "orders", label: "Order history", icon: Receipt, href: "#" },
    { id: "settings", label: "Account settings", icon: Settings01, href: "#" },
];
