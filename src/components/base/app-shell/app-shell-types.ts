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
    /** Alt text for the logo, e.g. `AD Rewards`. */
    name: string;
    href?: string;
}
