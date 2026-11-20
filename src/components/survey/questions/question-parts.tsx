import type { ReactNode } from "react";
import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/*
 * Small pieces shared by the question components: answer rows, scale buttons
 * and the inline message. Keyboard helpers live in question-keys.ts.
 *
 * Layout responds to the width of the survey, not the window, via container queries
 * (`@container/survey` is set by the question wrapper). That way the same components
 * render correctly in a phone frame inside the desktop builder canvas.
 */

// ─── Answer row ──────────────────────────────────────────────────────────────

interface ChoiceRowProps {
    label: ReactNode;
    /** Letter key shown at the start, e.g. "A". */
    shortcut?: string;
    isSelected: boolean;
    onPress: () => void;
    isDisabled?: boolean;
    children?: ReactNode;
}

/**
 * One answer option as a full-width row: letter key, label and a check when selected.
 * Selection shows as a filled key, a heavier border and a check, never colour alone.
 */
export const ChoiceRow = ({ label, shortcut, isSelected, onPress, isDisabled, children }: ChoiceRowProps) => (
    <div
        className={cx(
            "rounded-xl bg-primary ring-1 ring-primary transition duration-100 ease-linear ring-inset",
            isSelected && "bg-brand-primary ring-2 ring-brand-solid",
            isDisabled && "opacity-50",
        )}
    >
        <button
            type="button"
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={onPress}
            className={cx(
                "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left outline-hidden",
                "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                !isSelected && "hover:bg-primary_hover",
                isDisabled && "cursor-not-allowed",
            )}
        >
            {shortcut && (
                <span
                    aria-hidden="true"
                    className={cx(
                        "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-inset",
                        isSelected ? "bg-brand-solid text-white ring-transparent" : "bg-primary text-tertiary ring-primary",
                    )}
                >
                    {shortcut}
                </span>
            )}
            <span className="min-w-0 flex-1 text-md font-medium text-primary">{label}</span>
            <Check aria-hidden="true" className={cx("size-5 shrink-0 text-fg-brand-primary", !isSelected && "invisible")} />
        </button>
        {children}
    </div>
);

// ─── Scale button ────────────────────────────────────────────────────────────

interface ScaleButtonProps {
    label: ReactNode;
    /** Spoken name, e.g. "7, Extremely likely". */
    ariaLabel?: string;
    isSelected: boolean;
    onPress: () => void;
    className?: string;
}

/** A square-ish number button for NPS and opinion scales. */
export const ScaleButton = ({ label, ariaLabel, isSelected, onPress, className }: ScaleButtonProps) => (
    <button
        type="button"
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        onClick={onPress}
        className={cx(
            "relative flex h-12 min-w-11 flex-1 cursor-pointer items-center justify-center rounded-xl text-lg font-semibold outline-hidden ring-inset transition duration-100 ease-linear @xl/survey:h-14",
            "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
            isSelected ? "bg-brand-solid text-white ring-2 ring-brand-solid" : "bg-primary text-primary ring-1 ring-primary hover:bg-primary_hover",
            className,
        )}
    >
        {label}
        {isSelected && (
            <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary ring-1 ring-brand">
                <Check className="size-3 text-fg-brand-primary" />
            </span>
        )}
    </button>
);

/** End labels under a scale: "0 · Not at all likely" … "10 · Extremely likely". */
export const ScaleLabels = ({ start, end }: { start?: string; end?: string }) =>
    start || end ? (
        <div className="flex justify-between gap-4 text-sm text-tertiary">
            <span>{start}</span>
            <span className="text-right">{end}</span>
        </div>
    ) : null;

// ─── Inline message ──────────────────────────────────────────────────────────

/** Gentle inline message under the answers. Announced politely, never an alert dialog. */
export const QuestionMessage = ({ id, children }: { id: string; children?: ReactNode }) => (
    <p id={id} role="status" aria-live="polite" className={cx("min-h-5 text-sm font-medium text-error-primary", !children && "sr-only")}>
        {children}
    </p>
);

/** Keyboard hint for wide layouts, e.g. "press Enter ↵". Hidden on narrow screens and touch. */
export const KeyHint = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={cx("hidden text-sm text-tertiary pointer-fine:@xl/survey:inline", className)}>{children}</span>
);
