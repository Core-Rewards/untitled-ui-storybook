import type { FC } from "react";
import { AlertCircle, Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export type ProgressStepStatus = "complete" | "current" | "upcoming" | "error";

export interface ProgressStep {
    id: string;
    label: string;
    status: ProgressStepStatus;
}

export interface ProgressStepsProps {
    steps: ProgressStep[];
    /** Makes steps clickable. Omit for a read-only indicator. */
    onSelect?: (id: string) => void;
    /** Accessible name, e.g. "Survey setup". */
    "aria-label": string;
    className?: string;
}

/**
 * A horizontal step indicator: numbered circles that turn into checks when a step
 * is complete, with the current step highlighted. Status shows as an icon and
 * weight, never colour alone. For multi-step setups like the survey builder,
 * promotions and campaigns.
 */
export const ProgressSteps: FC<ProgressStepsProps> = ({ steps, onSelect, "aria-label": ariaLabel, className }) => (
    <nav aria-label={ariaLabel} className={cx("overflow-x-auto", className)}>
        <ol className="flex items-center gap-2 sm:gap-6">
            {steps.map((step, i) => {
                const marker = (
                    <span
                        aria-hidden="true"
                        className={cx(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            step.status === "complete" && "bg-success-solid text-white",
                            step.status === "current" && "bg-brand-solid text-white",
                            step.status === "upcoming" && "bg-primary text-tertiary ring-1 ring-primary ring-inset",
                            step.status === "error" && "bg-error-solid text-white",
                        )}
                    >
                        {step.status === "complete" ? (
                            <Check className="size-3.5 stroke-3" />
                        ) : step.status === "error" ? (
                            <AlertCircle className="size-3.5" />
                        ) : (
                            i + 1
                        )}
                    </span>
                );
                const label = (
                    <span
                        className={cx(
                            "text-sm whitespace-nowrap",
                            step.status === "current" ? "font-semibold text-brand-secondary" : "font-medium text-secondary",
                        )}
                    >
                        {step.label}
                        {step.status === "complete" && <span className="sr-only"> (complete)</span>}
                        {step.status === "error" && <span className="sr-only"> (needs attention)</span>}
                    </span>
                );
                const content = (
                    <>
                        {marker}
                        {label}
                    </>
                );
                return (
                    <li key={step.id} aria-current={step.status === "current" ? "step" : undefined} className="flex items-center gap-2 sm:gap-6">
                        {onSelect ? (
                            <button
                                type="button"
                                onClick={() => onSelect(step.id)}
                                className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                {content}
                            </button>
                        ) : (
                            <span className="flex items-center gap-2 py-1">{content}</span>
                        )}
                    </li>
                );
            })}
        </ol>
    </nav>
);
