import type { FC, ReactNode } from "react";
import { Link as AriaLink } from "react-aria-components";
import { LinkExternal01 } from "@untitledui/icons";
import { cx, sortCx } from "@/utils/cx";
import { formatNumber } from "@/utils/format";
import type { AppBrand, AppNavItem } from "./app-shell-types";

const styles = sortCx({
    root: "flex h-full w-64 shrink-0 flex-col border-r border-secondary bg-secondary_subtle",
    brand: "flex h-16 shrink-0 items-center border-b border-secondary px-6",
    points: "border-b border-secondary px-6 py-5",
    nav: "flex-1 overflow-y-auto px-3 py-4",
    item: [
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold outline-brand transition-colors duration-100 focus-visible:outline-2 focus-visible:-outline-offset-2",
        "text-secondary hover:bg-primary_hover hover:text-secondary_hover",
        "aria-[current=page]:bg-brand-solid aria-[current=page]:text-white aria-[current=page]:hover:bg-brand-solid_hover",
    ].join(" "),
    itemIcon: "size-5 shrink-0 text-fg-quaternary group-hover:text-fg-quaternary_hover group-aria-[current=page]:text-white",
    footer: "border-t border-secondary p-4 text-center text-xs text-quaternary",
});

export interface AppSidebarProps {
    brand: AppBrand;
    items: AppNavItem[];
    /** `id` of the item for the current page. */
    activeId?: string;
    /** Points balance under the logo. Omit to hide the block. */
    pointsBalance?: number;
    pointsLabel?: string;
    footer?: ReactNode;
    /** Called after a nav link is followed, e.g. to close the mobile drawer. */
    onNavigate?: () => void;
    className?: string;
}

export const AppSidebar: FC<AppSidebarProps> = ({ brand, items, activeId, pointsBalance, pointsLabel = "Available points", footer, onNavigate, className }) => (
    <aside className={cx(styles.root, className)}>
        <div className={styles.brand}>
            <AriaLink href={brand.href ?? "/"} className="rounded-sm outline-brand focus-visible:outline-2 focus-visible:outline-offset-4">
                <img src={brand.logoSrc} alt={brand.name} className="h-9 w-auto" />
            </AriaLink>
        </div>

        {pointsBalance !== undefined && (
            <div className={styles.points}>
                <p className="text-xs font-semibold tracking-wider text-quaternary uppercase">{pointsLabel}</p>
                <p className="mt-1 text-display-xs font-semibold text-brand-secondary tabular-nums">{formatNumber(pointsBalance)}</p>
            </div>
        )}

        <nav aria-label="Main" className={styles.nav}>
            <ul className="flex flex-col gap-1">
                {items.map(({ id, label, href, icon: Icon, isExternal }) => {
                    const isCurrent = id === activeId;
                    return (
                        <li key={id}>
                            <AriaLink
                                href={href}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noopener noreferrer" : undefined}
                                aria-current={isCurrent ? "page" : undefined}
                                onPress={onNavigate}
                                className={styles.item}
                            >
                                <Icon className={styles.itemIcon} />
                                <span className="flex-1 truncate">{label}</span>
                                {isExternal && (
                                    <>
                                        <LinkExternal01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        <span className="sr-only">(opens in a new tab)</span>
                                    </>
                                )}
                            </AriaLink>
                        </li>
                    );
                })}
            </ul>
        </nav>

        {footer !== null && <div className={styles.footer}>{footer ?? `© ${new Date().getFullYear()} ${brand.name}`}</div>}
    </aside>
);
