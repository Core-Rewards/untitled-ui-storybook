import type { FC, ReactNode } from "react";
import { cx, sortCx } from "@/utils/cx";

export type BadgeColor = "gray" | "brand" | "error" | "warning" | "success" | "blue" | "indigo" | "purple" | "orange";

export type BadgeSize = "sm" | "md" | "lg";

/** `pill-color` is fully rounded, `badge-color` is a rounded rectangle, `badge-modern` is a neutral outline. */
export type BadgeType = "pill-color" | "badge-color" | "badge-modern";

const colors = sortCx({
    gray: "bg-utility-gray-50 text-utility-gray-700 ring-utility-gray-200",
    brand: "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200",
    error: "bg-utility-error-50 text-utility-error-700 ring-utility-error-200",
    warning: "bg-utility-warning-50 text-utility-warning-700 ring-utility-warning-200",
    success: "bg-utility-success-50 text-utility-success-700 ring-utility-success-200",
    blue: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
    indigo: "bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200",
    purple: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
    orange: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
});

const dotColors = sortCx({
    gray: "bg-utility-gray-500",
    brand: "bg-utility-brand-500",
    error: "bg-utility-error-500",
    warning: "bg-utility-warning-500",
    success: "bg-utility-success-500",
    blue: "bg-utility-blue-500",
    indigo: "bg-utility-indigo-500",
    purple: "bg-utility-purple-500",
    orange: "bg-utility-orange-500",
});

const sizes = sortCx({
    sm: "gap-1 px-1.5 py-0.5 text-xs",
    md: "gap-1.5 px-2 py-0.5 text-sm",
    lg: "gap-1.5 px-2.5 py-1 text-sm",
});

interface BadgeProps {
    /** Badge label. */
    children: ReactNode;
    /** Semantic color. Defaults to `gray`. */
    color?: BadgeColor;
    /** Defaults to `md`. */
    size?: BadgeSize;
    /** Shape and fill treatment. Defaults to `pill-color`. */
    type?: BadgeType;
    /** Show a leading status dot tinted to match `color`. */
    dot?: boolean;
    className?: string;
}

export const Badge: FC<BadgeProps> = ({ children, color = "gray", size = "md", type = "pill-color", dot = false, className }) => {
    const isModern = type === "badge-modern";

    return (
        <span
            className={cx(
                "inline-flex shrink-0 items-center whitespace-nowrap font-medium ring-1 ring-inset",
                type === "pill-color" ? "rounded-full" : "rounded-md",
                sizes[size],
                isModern ? "bg-primary text-secondary ring-primary" : colors[color],
                className,
            )}
        >
            {dot && <span className={cx("size-1.5 shrink-0 rounded-full", dotColors[color])} aria-hidden="true" />}
            {children}
        </span>
    );
};
