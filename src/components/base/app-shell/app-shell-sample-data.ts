import { Bell01, BookOpen01, CurrencyDollarCircle, Grid01, HelpCircle, LogOut01, Receipt, Settings01, ShoppingBag01, ShoppingCart01, Stars02, Tag01, User01, Users01 } from "@untitledui/icons";
import type { AppAccountMenuItem, AppBrand, AppHeaderAction, AppNavItem } from "./app-shell-types";

export const sampleBrand: AppBrand = { logoSrc: "/brand/ad_rewards_logo.png", name: "AD Rewards", href: "#" };

export const sampleNavItems: AppNavItem[] = [
    { id: "dashboard", label: "Dashboard", href: "#", icon: Grid01 },
    { id: "shop", label: "Shop Rewards", href: "#", icon: ShoppingBag01 },
    { id: "earn", label: "How to Earn", href: "#", icon: CurrencyDollarCircle },
    { id: "suppliers", label: "Participating Suppliers", href: "#", icon: Users01 },
    { id: "promotions", label: "Promotions", href: "#", icon: Tag01 },
    { id: "education", label: "AD Education Center", href: "#", icon: BookOpen01, isExternal: true },
    { id: "help", label: "Help", href: "#", icon: HelpCircle },
];

export const sampleHeaderActions: AppHeaderAction[] = [
    { id: "notifications", label: "Notifications", icon: Bell01, badge: true },
    { id: "cart", label: "Cart", icon: ShoppingCart01, badge: 2 },
    { id: "spin", label: "Spin to win", icon: Stars02 },
];

export const sampleAccountMenuItems: AppAccountMenuItem[] = [
    { id: "profile", label: "Profile", icon: User01, href: "#" },
    { id: "orders", label: "Order history", icon: Receipt, href: "#" },
    { id: "settings", label: "Settings", icon: Settings01, href: "#" },
    { id: "sign-out", label: "Sign out", icon: LogOut01 },
];
