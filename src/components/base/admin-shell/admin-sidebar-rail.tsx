import type { FC } from "react";
import { Button as AriaButton, Link as AriaLink, Tooltip, TooltipTrigger } from "react-aria-components";
import { Menu02 } from "@untitledui/icons";
import type { AppNavEntry, AppNavItem } from "@/components/base/app-shell/app-shell-types";
import { cx } from "@/utils/cx";

const tooltip = [
    "z-50 max-w-xs origin-(--trigger-anchor-point) rounded-lg bg-primary-solid px-3 py-2 text-xs font-semibold text-white shadow-lg will-change-transform",
    "entering:animate-in entering:fade-in entering:zoom-in-95 entering:ease-out exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:ease-in",
].join(" ");

const iconLink = [
    "flex size-10 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear",
    "hover:bg-[rgb(231_229_228)] hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
    "aria-[current=page]:bg-[rgb(231_229_228)] aria-[current=page]:text-fg-quaternary_hover",
].join(" ");

const RailLink: FC<{ item: AppNavItem; isCurrent: boolean }> = ({ item, isCurrent }) => (
    <TooltipTrigger delay={300} closeDelay={0}>
        <AriaLink href={item.href} aria-label={item.label} aria-current={isCurrent ? "page" : undefined} className={iconLink}>
            <item.icon aria-hidden="true" className="size-5" />
        </AriaLink>
        <Tooltip placement="right" offset={8} className={tooltip}>
            {item.label}
        </Tooltip>
    </TooltipTrigger>
);

export interface AdminSidebarRailProps {
    items: AppNavEntry[];
    footerItems?: AppNavItem[];
    activeId?: string;
    /** Opens the full sidebar as a drawer. */
    onExpand: () => void;
    className?: string;
}

/**
 * The admin sidebar collapsed to a 64px icon rail, for pages that need the width
 * (the survey builder's three panes). The menu button opens the full sidebar,
 * including the program switcher, as a drawer.
 */
export const AdminSidebarRail: FC<AdminSidebarRailProps> = ({ items, footerItems = [], activeId, onExpand, className }) => (
    <aside className={cx("flex h-dvh w-16 shrink-0 flex-col items-center gap-4 border-r border-secondary bg-[oklch(98.5%_0.001_106.423)] py-4", className)}>
        <TooltipTrigger delay={300} closeDelay={0}>
            <AriaButton aria-label="Open navigation" onPress={onExpand} className={iconLink}>
                <Menu02 aria-hidden="true" className="size-5" />
            </AriaButton>
            <Tooltip placement="right" offset={8} className={tooltip}>
                Open navigation
            </Tooltip>
        </TooltipTrigger>

        <nav aria-label="Main" className="flex flex-col items-center gap-1">
            {items.map((item, i) =>
                "divider" in item ? (
                    <hr key={`divider-${i}`} className="my-1 w-6 border-secondary" aria-hidden="true" />
                ) : (
                    <RailLink key={item.id} item={item} isCurrent={item.id === activeId} />
                ),
            )}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1">
            {footerItems.map((item) => (
                <RailLink key={item.id} item={item} isCurrent={item.id === activeId} />
            ))}
        </div>
    </aside>
);
