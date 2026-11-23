import type { FC, ReactNode } from "react";
import { CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { ActionCardAction, ActionCardMeta, ActionCardStatus } from "./action-card";

export interface ActionRowProps {
    /** Small type icon on the left, e.g. a clipboard for surveys. */
    icon?: FC<{ className?: string }>;
    /** Short label above the title, e.g. "Quiz". */
    eyebrow?: string;
    title: string;
    /** Short facts, e.g. time, question count and dates. */
    meta?: ActionCardMeta[];
    /** e.g. the reward pill. */
    badge?: ReactNode;
    status?: ActionCardStatus;
    action?: ActionCardAction;
    /** Shown instead of a button, e.g. "Scored 5 of 6 · Passed". */
    statusLine?: ReactNode;
    statusIcon?: FC<{ className?: string }>;
    className?: string;
}

/**
 * The compact, list version of ActionCard: one row with an icon, title and facts,
 * the reward, and a button or status line. For lists like the Surveys & quizzes
 * page and the dashboard's "More to do". Stacks when narrow (container query).
 */
export const ActionRow = ({ icon: Icon, eyebrow, title, meta, badge, status = "new", action, statusLine, statusIcon, className }: ActionRowProps) => {
    const facts = (meta ?? []).map((m) => (typeof m === "string" ? { label: m } : m));
    const StatusIcon = statusIcon ?? (status === "completed" ? CheckCircle : undefined);

    return (
        <article className={cx("@container/action-row w-full rounded-xl border border-secondary bg-primary shadow-xs", className)}>
            <div className="flex flex-col gap-3 p-4 @2xl/action-row:flex-row @2xl/action-row:items-center @2xl/action-row:gap-5">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    {Icon && (
                        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary">
                            <Icon className="size-5" />
                        </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                        {eyebrow && <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">{eyebrow}</p>}
                        <h3 className="text-md font-semibold text-primary">{title}</h3>
                        {facts.length > 0 && (
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tertiary">
                                {facts.map(({ label, icon: FactIcon }) => (
                                    <li key={label} className="flex items-center gap-1.5">
                                        {FactIcon && <FactIcon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />}
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 @2xl/action-row:shrink-0 @2xl/action-row:justify-end">
                    {badge}
                    {action ? (
                        <Button
                            size="md"
                            color={status === "in_progress" ? "primary" : "secondary"}
                            href={action.href}
                            onClick={action.onPress}
                            className="w-full @md/action-row:w-auto"
                        >
                            {action.label}
                        </Button>
                    ) : statusLine ? (
                        <p className={cx("flex items-center gap-2 text-sm font-semibold", status === "completed" ? "text-success-primary" : "text-tertiary")}>
                            {StatusIcon && <StatusIcon className="size-5 shrink-0" aria-hidden="true" />}
                            {statusLine}
                        </p>
                    ) : null}
                </div>
            </div>
        </article>
    );
};
