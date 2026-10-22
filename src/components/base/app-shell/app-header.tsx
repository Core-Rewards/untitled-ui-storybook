import type { FC, ReactNode } from "react";
import { Button as AriaButton, Link as AriaLink, Tooltip, TooltipTrigger } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";
import type { AppHeaderAction } from "./app-shell-types";

const styles = sortCx({
    root: "flex h-14 shrink-0 items-center gap-1 border-b border-secondary bg-primary px-4",
    // Same look as the AdminUI tertiary `ButtonUtility`.
    iconButton:
        "group relative inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
    count: "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-[10px] leading-none font-bold text-white tabular-nums ring-2 ring-bg-primary",
    dot: "absolute top-1 right-1 size-2 rounded-full bg-error-solid ring-2 ring-bg-primary",
    tooltip: [
        "z-50 max-w-xs origin-(--trigger-anchor-point) rounded-lg bg-primary-solid px-3 py-2 text-xs font-semibold text-white shadow-lg will-change-transform",
        "entering:animate-in entering:fade-in entering:zoom-in-95 entering:ease-out exiting:animate-out exiting:fade-out exiting:zoom-out-95 exiting:ease-in",
    ].join(" "),
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
    /** Icon buttons on the right, e.g. cart and notifications. */
    actions?: AppHeaderAction[];
    /** Left-aligned content, e.g. a page title or global search. */
    children?: ReactNode;
    className?: string;
}

/** Slim utility bar above the page content, matching the AdminUI portal header. */
export const AppHeader: FC<AppHeaderProps> = ({ actions = [], children, className }) => (
    <header className={cx(styles.root, className)}>
        <div className="flex min-w-0 flex-1 items-center">{children}</div>

        {actions.map((action) => {
            const Icon = action.icon;
            const content = (
                <>
                    <Icon className="pointer-events-none size-5 shrink-0" />
                    <Badge badge={action.badge} />
                </>
            );
            return (
                <TooltipTrigger key={action.id} delay={300} closeDelay={0}>
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
    </header>
);
