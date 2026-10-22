import type { FC } from "react";

type Icon = FC<{ className?: string }>;

export interface AppNavItem {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    /** Opens in a new tab and shows an external-link mark. */
    isExternal?: boolean;
}

/** A rule between groups of nav items. */
export interface AppNavDivider {
    divider: true;
}

export type AppNavEntry = AppNavItem | AppNavDivider;

export interface AppHeaderAction {
    id: string;
    /** Accessible name, also shown as the tooltip. */
    label: string;
    icon: Icon;
    /** A number shows a count bubble; `true` shows a dot. */
    badge?: number | boolean;
    href?: string;
    onPress?: () => void;
}

export interface AppAccountMenuItem {
    id: string;
    label: string;
    icon?: Icon;
    href?: string;
    onAction?: () => void;
}

export interface AppBrand {
    logoSrc: string;
    /** Smaller logo for the mobile top bar. Defaults to `logoSrc`. */
    mobileLogoSrc?: string;
    /** Alt text for the logo, e.g. `AD Rewards`. */
    name: string;
    href?: string;
}
