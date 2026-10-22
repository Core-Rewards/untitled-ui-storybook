import type { FC, ReactNode } from "react";
import { Button as AriaButton, Link as AriaLink, Menu, MenuItem, MenuTrigger, Popover, Tooltip, TooltipTrigger } from "react-aria-components";
import { ChevronDown, Menu01 } from "@untitledui/icons";
import { cx, sortCx } from "@/utils/cx";
import type { AppAccountMenuItem, AppHeaderAction } from "./app-shell-types";

const styles = sortCx({
    root: "z-20 flex h-16 shrink-0 items-center gap-3 border-b border-secondary bg-primary px-4 md:px-8",
    iconButton:
        "relative flex size-10 cursor-pointer items-center justify-center rounded-full text-fg-quaternary outline-brand transition-colors hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2",
    count: "absolute top-0.5 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-solid px-1 text-[10px] leading-none font-bold text-white tabular-nums ring-2 ring-bg-primary",
    dot: "absolute top-2 right-2.5 size-2 rounded-full bg-error-solid ring-2 ring-bg-primary",
    tooltip: "rounded-md bg-primary-solid px-2 py-1 text-xs font-medium text-white shadow-md entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out",
    account:
        "flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-secondary outline-brand transition-colors hover:bg-primary_hover hover:text-secondary_hover focus-visible:outline-2",
    menu: "w-56 origin-top-right rounded-lg bg-primary py-1.5 shadow-lg ring-1 ring-secondary outline-none ring-inset entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95",
    menuItem: "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-medium text-secondary outline-none focus:bg-primary_hover",
});

const Badge: FC<{ badge: AppHeaderAction["badge"] }> = ({ badge }) => {
    if (typeof badge === "number" && badge > 0) return <span className={styles.count}>{badge > 99 ? "99+" : badge}</span>;
    if (badge === true) return <span className={styles.dot} />;
    return null;
};

/** Spoken label, so `Cart` with 2 items reads as `Cart, 2 items`. */
const actionLabel = ({ label, badge }: AppHeaderAction) =>
    typeof badge === "number" && badge > 0 ? `${label}, ${badge} ${badge === 1 ? "item" : "items"}` : badge === true ? `${label}, new` : label;

export interface AppHeaderProps {
    actions?: AppHeaderAction[];
    /** Account trigger text. */
    accountLabel?: string;
    accountMenuItems?: AppAccountMenuItem[];
    /** Shows the menu button (below `lg`) that opens the sidebar drawer. */
    onMenuPress?: () => void;
    /** Left-aligned content, e.g. a page title or global search. */
    children?: ReactNode;
    className?: string;
}

export const AppHeader: FC<AppHeaderProps> = ({ actions = [], accountLabel = "My Account", accountMenuItems = [], onMenuPress, children, className }) => (
    <header className={cx(styles.root, className)}>
        {onMenuPress && (
            <AriaButton onPress={onMenuPress} aria-label="Open navigation" className={cx(styles.iconButton, "-ml-2 rounded-lg lg:hidden")}>
                <Menu01 className="size-6" />
            </AriaButton>
        )}

        <div className="flex min-w-0 flex-1 items-center">{children}</div>

        <div className="flex items-center gap-1 md:gap-2">
            {actions.map((action) => {
                const Icon = action.icon;
                const content = (
                    <>
                        <Icon className="size-6" />
                        <Badge badge={action.badge} />
                    </>
                );
                return (
                    <TooltipTrigger key={action.id} delay={400}>
                        {action.href ? (
                            <AriaLink href={action.href} aria-label={actionLabel(action)} className={styles.iconButton}>
                                {content}
                            </AriaLink>
                        ) : (
                            <AriaButton onPress={action.onPress} aria-label={actionLabel(action)} className={styles.iconButton}>
                                {content}
                            </AriaButton>
                        )}
                        <Tooltip offset={6} className={styles.tooltip}>
                            {action.label}
                        </Tooltip>
                    </TooltipTrigger>
                );
            })}

            {accountMenuItems.length > 0 && (
                <>
                    <div className="mx-2 hidden h-6 w-px bg-border-secondary sm:block" aria-hidden="true" />
                    <MenuTrigger>
                        <AriaButton className={styles.account}>
                            <span className="hidden sm:inline">{accountLabel}</span>
                            <span className="sr-only sm:hidden">{accountLabel}</span>
                            <ChevronDown className="size-4 text-fg-quaternary" aria-hidden="true" />
                        </AriaButton>
                        <Popover placement="bottom end" offset={6} className={styles.menu}>
                            <Menu aria-label={accountLabel} className="outline-none">
                                {accountMenuItems.map(({ id, label, icon: Icon, href, onAction }) => (
                                    <MenuItem key={id} id={id} href={href} onAction={onAction} className={styles.menuItem}>
                                        {Icon && <Icon className="size-4 text-fg-quaternary" />}
                                        {label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Popover>
                    </MenuTrigger>
                </>
            )}
        </div>
    </header>
);
