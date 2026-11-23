import { useEffect } from "react";
import type { FC } from "react";
import { CheckCircle, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface ToastProps {
    /** Changing the id restarts the timer, e.g. for a second "Question added". */
    id: string | number;
    message: string;
    /** One action, e.g. Undo. */
    action?: { label: string; onPress: () => void };
    onDismiss: () => void;
    /** Milliseconds before it hides itself. Defaults to 6000. */
    duration?: number;
    className?: string;
}

/**
 * A short confirmation pinned to the bottom of the screen, with one optional action
 * like Undo. Announced politely to screen readers; it never takes focus.
 */
export const Toast: FC<ToastProps> = ({ id, message, action, onDismiss, duration = 6000, className }) => {
    useEffect(() => {
        const t = setTimeout(onDismiss, duration);
        return () => clearTimeout(t);
    }, [id, duration, onDismiss]);

    return (
        <div
            role="status"
            aria-live="polite"
            className={cx(
                "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-primary-solid py-2.5 pr-2 pl-4 text-sm text-white shadow-lg",
                "animate-in duration-200 fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
                className,
            )}
        >
            <CheckCircle className="size-5 shrink-0 text-fg-success-secondary" aria-hidden="true" />
            <span className="font-medium">{message}</span>
            {action && (
                <button
                    type="button"
                    onClick={() => {
                        action.onPress();
                        onDismiss();
                    }}
                    className="cursor-pointer rounded-md px-2 py-1 font-semibold text-white underline underline-offset-2 outline-focus-ring hover:bg-white/10 focus-visible:outline-2"
                >
                    {action.label}
                </button>
            )}
            <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismiss}
                className="flex size-8 cursor-pointer items-center justify-center rounded-md text-white/70 outline-focus-ring hover:bg-white/10 hover:text-white focus-visible:outline-2"
            >
                <XClose className="size-4" />
            </button>
        </div>
    );
};
