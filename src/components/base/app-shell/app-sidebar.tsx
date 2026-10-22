import { useRef } from "react";
import type { FC, ReactNode } from "react";
import type { PopoverProps } from "react-aria-components";
import { Button as AriaButton, Link as AriaLink, Menu, MenuItem, MenuSection, MenuTrigger, Popover } from "react-aria-components";
import { ChevronSelectorVertical, LogOut01, Share04 } from "@untitledui/icons";
import { cx, sortCx } from "@/utils/cx";
import { formatNumber } from "@/utils/format";
import type { AppAccountMenuItem, AppBrand, AppNavEntry, AppNavItem } from "./app-shell-types";

type Placement = NonNullable<PopoverProps["placement"]>;

/** Matches the AdminUI `SidebarNavigationSimple` width. */
export const SIDEBAR_WIDTH = 280;

const styles = sortCx({
    root: "flex h-full w-full max-w-full flex-col overflow-auto border-secondary bg-secondary_subtle pt-4 md:border-r lg:w-(--width) lg:pt-5",
    item: [
        "group/item relative flex max-h-9 w-full cursor-pointer items-center rounded-md p-2 outline-focus-ring transition duration-100 ease-linear select-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
        "hover:bg-[rgb(231_229_228)] aria-[current=page]:bg-[rgb(231_229_228)]",
    ].join(" "),
    itemIcon:
        "mr-2 size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover group-aria-[current=page]/item:text-fg-quaternary_hover",
    itemLabel:
        "flex-1 truncate text-sm font-semibold text-secondary transition-inherit-all group-hover/item:text-secondary_hover group-aria-[current=page]/item:text-secondary_hover",
    accountCard: "relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset",
    accountTrigger:
        "absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover",
    menu: "w-66 origin-(--trigger-anchor-point) rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden will-change-transform",
    menuEntering:
        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
    menuExiting: "duration-100 ease-in animate-out fade-out",
    menuItem: "group/menu-item cursor-pointer px-1.5 outline-hidden",
    menuItemInner:
        "flex w-full items-center gap-2 rounded-md p-2 text-sm font-semibold text-secondary outline-focus-ring group-hover/menu-item:bg-primary_hover group-hover/menu-item:text-secondary_hover group-focus-visible/menu-item:bg-primary_hover group-focus-visible/menu-item:outline-2 group-focus-visible/menu-item:outline-offset-2",
    menuIcon: "size-5 text-fg-quaternary group-hover/menu-item:text-fg-quaternary_hover",
});

const NavLink: FC<{
    item: AppNavItem;
    isCurrent: boolean;
    onNavigate?: () => void;
}> = ({ item, isCurrent, onNavigate }) => {
    const { label, href, icon: Icon, isExternal } = item;
    return (
        <AriaLink
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-current={isCurrent ? "page" : undefined}
            onPress={onNavigate}
            className={styles.item}
        >
            <Icon aria-hidden="true" className={styles.itemIcon} />
            <span className={styles.itemLabel}>{label}</span>
            {isExternal && (
                <>
                    <Share04 className="size-4 shrink-0 stroke-[2.5px] text-fg-quaternary" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                </>
            )}
        </AriaLink>
    );
};

const AccountMenuRow: FC<{
    label: string;
    icon?: AppAccountMenuItem["icon"];
}> = ({ label, icon: Icon }) => (
    <div className={styles.menuItemInner}>
        {Icon && <Icon className={styles.menuIcon} />}
        {label}
    </div>
);

interface AccountCardProps {
    name: string;
    subtitle?: string;
    menuItems: AppAccountMenuItem[];
    onSignOut?: () => void;
    placement: Placement;
}

/** Account name and points in a bordered card, with a menu for profile links and sign out. */
const AccountCard: FC<AccountCardProps> = ({ name, subtitle, menuItems, onSignOut, placement }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const hasMenu = menuItems.length > 0 || onSignOut;

    return (
        <div ref={cardRef} className={styles.accountCard}>
            <div className="min-w-0 flex-1 pr-8">
                <p className="truncate text-sm font-semibold text-secondary">{name}</p>
                {subtitle && <p className="truncate text-xs text-tertiary tabular-nums">{subtitle}</p>}
            </div>

            {hasMenu && (
                <MenuTrigger>
                    <AriaButton aria-label="Account menu" className={styles.accountTrigger}>
                        <ChevronSelectorVertical className="size-4 shrink-0 stroke-[2.25px]" />
                    </AriaButton>
                    <Popover
                        placement={placement}
                        triggerRef={cardRef}
                        offset={8}
                        className={({ isEntering, isExiting }) => cx(styles.menu, isEntering && styles.menuEntering, isExiting && styles.menuExiting)}
                    >
                        <Menu aria-label="Account" className="outline-hidden">
                            {menuItems.length > 0 && (
                                <MenuSection className="flex flex-col gap-0.5 rounded-xl bg-primary py-1.5 ring-1 ring-secondary">
                                    {menuItems.map(({ id, label, icon, href, onAction }) => (
                                        <MenuItem key={id} id={id} href={href} onAction={onAction} textValue={label} className={styles.menuItem}>
                                            <AccountMenuRow label={label} icon={icon} />
                                        </MenuItem>
                                    ))}
                                </MenuSection>
                            )}
                            {onSignOut && (
                                <MenuSection className="pt-1 pb-1.5">
                                    <MenuItem id="sign-out" onAction={onSignOut} textValue="Sign out" className={styles.menuItem}>
                                        <AccountMenuRow label="Sign out" icon={LogOut01} />
                                    </MenuItem>
                                </MenuSection>
                            )}
                        </Menu>
                    </Popover>
                </MenuTrigger>
            )}
        </div>
    );
};

export interface AppSidebarProps {
    brand: AppBrand;
    /** Main navigation. Use `{ divider: true }` for a rule between groups. */
    items: AppNavEntry[];
    /** Links pinned to the bottom of the sidebar, e.g. Support or Settings. */
    footerItems?: AppNavItem[];
    /** `id` of the item for the current page. */
    activeId?: string;
    /** Name shown in the account card. Omit along with `pointsBalance` to hide the card. */
    accountName?: string;
    /** Points balance under the account name. */
    pointsBalance?: number;
    /** Links in the account card's menu. */
    accountMenuItems?: AppAccountMenuItem[];
    /** Adds a separated `Sign out` row to the account menu. */
    onSignOut?: () => void;
    /** Where the account menu opens. Defaults to the right of the card. */
    accountMenuPlacement?: Placement;
    /** Extra content under the footer links, e.g. a promo card. */
    footer?: ReactNode;
    /** Called after a nav link is followed, e.g. to close the mobile drawer. */
    onNavigate?: () => void;
    className?: string;
}

export const AppSidebar: FC<AppSidebarProps> = ({
    brand,
    items,
    footerItems = [],
    activeId,
    accountName,
    pointsBalance,
    accountMenuItems = [],
    onSignOut,
    accountMenuPlacement = "right bottom",
    footer,
    onNavigate,
    className,
}) => {
    const showAccount = accountName !== undefined || pointsBalance !== undefined;

    return (
        <aside style={{ "--width": `${SIDEBAR_WIDTH}px` } as React.CSSProperties} className={cx(styles.root, className)}>
            <div className="flex flex-col gap-5 px-4 lg:px-5">
                <AriaLink
                    href={brand.href ?? "/"}
                    onPress={onNavigate}
                    className="flex justify-center rounded-sm outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                    <img src={brand.logoSrc} alt={brand.name} className="h-14 w-auto" />
                </AriaLink>

                {showAccount && (
                    <AccountCard
                        name={accountName ?? "My Account"}
                        subtitle={pointsBalance !== undefined ? `${formatNumber(pointsBalance)} points` : undefined}
                        menuItems={accountMenuItems}
                        onSignOut={onSignOut}
                        placement={accountMenuPlacement}
                    />
                )}
            </div>

            <nav aria-label="Main">
                <ul className="flex flex-col px-4 pt-5">
                    {items.map((item, index) =>
                        "divider" in item ? (
                            <li key={`divider-${index}`} className="w-full px-0.5 py-2" aria-hidden="true">
                                <hr className="h-px w-full border-none bg-border-secondary" />
                            </li>
                        ) : (
                            <li key={item.id} className="py-px">
                                <NavLink item={item} isCurrent={item.id === activeId} onNavigate={onNavigate} />
                            </li>
                        ),
                    )}
                </ul>
            </nav>

            <div className="mt-auto flex flex-col gap-3 px-4 py-4 lg:py-5">
                {footerItems.length > 0 && (
                    <ul className="flex flex-col">
                        {footerItems.map((item) => (
                            <li key={item.id} className="py-px">
                                <NavLink item={item} isCurrent={item.id === activeId} onNavigate={onNavigate} />
                            </li>
                        ))}
                    </ul>
                )}
                {footer}
            </div>
        </aside>
    );
};
