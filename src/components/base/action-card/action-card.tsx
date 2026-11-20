import type { FC, ReactNode } from "react";
import { CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export type ActionCardStatus = "new" | "in_progress" | "completed" | "upcoming" | "closed";

export interface ActionCardAction {
    label: string;
    onPress?: () => void;
    href?: string;
}

/** One fact in the footer, e.g. "About 2 min", optionally with an icon. */
export type ActionCardMeta = string | { label: string; icon?: FC<{ className?: string }> };

export interface ActionCardProps {
    /** Small uppercase label in the header, e.g. "New survey". */
    eyebrow?: string;
    title: string;
    description?: string;
    /** Short facts shown in the footer, e.g. time, question count and dates. */
    meta?: ActionCardMeta[];
    /** Right side of the header, e.g. a reward pill. */
    badge?: ReactNode;
    /**
     * Drives emphasis. New and in-progress cards are outlined in the brand colour;
     * completed cards show a success line; upcoming and closed cards are quiet.
     */
    status?: ActionCardStatus;
    /** Shows a thin progress bar, e.g. 2 of 5 answered. */
    progress?: { current: number; total: number; label?: string };
    /** Primary button. Omit for upcoming, closed or completed cards. */
    action?: ActionCardAction;
    /** Line shown in place of the button, e.g. "Completed · +500 points" or "Opens Dec 1". */
    statusLine?: string;
    statusIcon?: FC<{ className?: string }>;
    className?: string;
}

/** Horizontal padding shared by the header, body and footer so their edges line up. */
const gutter = "px-5 @sm/action-card:px-6 @3xl/action-card:px-8";

/**
 * A full-width dashboard card that asks the participant to do one thing (take a
 * survey, finish a training module, join a promotion) and shows where they are
 * with it: new, in progress, completed, not open yet or closed.
 *
 * Three bands on a light grey panel, full width like Quiz and ConciergeCta:
 * - **Header:** eyebrow label on the left, badge (e.g. the reward) on the right.
 * - **Body:** title, description and progress, with the button on the right when
 *   there's room, or stacked full width underneath when narrow.
 * - **Footer:** short facts such as time, question count and dates.
 *
 * Layout follows the card's own width (container query), not the window.
 */
export const ActionCard = ({
    eyebrow,
    title,
    description,
    meta,
    badge,
    status = "new",
    progress,
    action,
    statusLine,
    statusIcon,
    className,
}: ActionCardProps) => {
    const emphasised = status === "new" || status === "in_progress";
    const StatusIcon = statusIcon ?? (status === "completed" ? CheckCircle : undefined);
    const facts = (meta ?? []).map((m) => (typeof m === "string" ? { label: m } : m));

    return (
        <article
            className={cx(
                "@container/action-card w-full overflow-hidden rounded-2xl border border-secondary bg-tertiary shadow-xs",
                emphasised && "border-brand ring-1 ring-brand ring-inset",
                className,
            )}
        >
            {(eyebrow || badge) && (
                <header className={cx("flex min-h-13 flex-wrap items-center justify-between gap-3 border-b border-secondary py-3", gutter)}>
                    {eyebrow && <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">{eyebrow}</p>}
                    {badge && <div className="ml-auto shrink-0">{badge}</div>}
                </header>
            )}

            <div
                className={cx(
                    "flex flex-col gap-4 py-5 @sm/action-card:py-6 @3xl/action-card:flex-row @3xl/action-card:items-center @3xl/action-card:gap-10",
                    gutter,
                )}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h3 className="text-lg font-semibold text-primary @3xl/action-card:text-xl">{title}</h3>
                    {description && <p className="text-md text-tertiary">{description}</p>}
                    {progress && (
                        <div
                            role="progressbar"
                            aria-label={progress.label ?? title}
                            aria-valuemin={0}
                            aria-valuemax={progress.total}
                            aria-valuenow={progress.current}
                            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-quaternary @3xl/action-card:max-w-md"
                        >
                            <div
                                className="h-full rounded-full bg-brand-solid"
                                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                {action ? (
                    <Button size="xl" href={action.href} onClick={action.onPress} className="w-full shrink-0 @3xl/action-card:w-auto">
                        {action.label}
                    </Button>
                ) : statusLine ? (
                    <p
                        className={cx(
                            "flex shrink-0 items-center gap-2 text-sm font-semibold @3xl/action-card:max-w-xs",
                            status === "completed" ? "text-success-primary" : "text-tertiary",
                        )}
                    >
                        {StatusIcon && <StatusIcon className="size-5 shrink-0" aria-hidden="true" />}
                        {statusLine}
                    </p>
                ) : null}
            </div>

            {facts.length > 0 && (
                <footer className={cx("border-t border-secondary py-3", gutter)}>
                    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tertiary">
                        {facts.map(({ label, icon: Icon }) => (
                            <li key={label} className="flex items-center gap-1.5">
                                {Icon && <Icon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />}
                                {label}
                            </li>
                        ))}
                    </ul>
                </footer>
            )}
        </article>
    );
};
