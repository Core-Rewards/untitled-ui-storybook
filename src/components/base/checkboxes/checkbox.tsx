import type { FC, ReactNode } from "react";
import type { CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { Checkbox as AriaCheckbox } from "react-aria-components";
import { Check, Minus } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface CheckboxProps extends Omit<AriaCheckboxProps, "children" | "className"> {
    /** Label shown next to the control. Omit for a standalone checkbox. */
    children?: ReactNode;
    className?: string;
}

export const Checkbox: FC<CheckboxProps> = ({ children, className, ...props }) => (
    <AriaCheckbox
        {...props}
        className={cx(
            "group flex cursor-pointer items-center gap-2 text-sm font-medium text-secondary select-none",
            "disabled:cursor-not-allowed disabled:text-fg-disabled",
            className,
        )}
    >
        {({ isSelected, isIndeterminate }) => (
            <>
                <span
                    className={cx(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm ring-1 ring-inset transition duration-100 ease-linear",
                        "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-brand",
                        isSelected || isIndeterminate ? "bg-brand-solid ring-transparent" : "bg-primary ring-primary group-hover:bg-primary_hover",
                        "group-disabled:bg-disabled_subtle group-disabled:ring-disabled",
                    )}
                >
                    {isIndeterminate ? (
                        <Minus className="size-3 text-fg-white" strokeWidth={3} />
                    ) : (
                        isSelected && <Check className="size-3 text-fg-white" strokeWidth={3} />
                    )}
                </span>
                {children}
            </>
        )}
    </AriaCheckbox>
);
