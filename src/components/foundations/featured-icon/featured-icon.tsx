import type { FC, ReactNode, Ref } from "react";
import { isValidElement } from "react";
import { cx, sortCx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

/*
 * Ported from Untitled UI React (components/foundations/featured-icon).
 * Adapted to this project's token names (`utility-gray`, `utility-error`, `utility-success`,
 * `utility-warning`, `shadow-xs-skeumorphic`) and extended with the `blue`, `indigo`, `purple`
 * and `orange` colors so it covers the same palette as `Badge`. The `modern-neue` theme is
 * omitted because it depends on tokens (`ring-secondary_alt`) this theme does not define.
 */

export type FeaturedIconColor = "brand" | "gray" | "success" | "warning" | "error" | "blue" | "indigo" | "purple" | "orange";

const iconsSizes = {
    sm: "*:data-icon:size-4 *:data-icon:stroke-[2.25px]",
    md: "*:data-icon:size-5",
    lg: "*:data-icon:size-6",
    xl: "*:data-icon:size-7",
};

const styles = sortCx({
    light: {
        base: "rounded-full",
        sizes: {
            sm: "size-8",
            md: "size-10",
            lg: "size-12",
            xl: "size-14",
        },
        colors: {
            brand: "bg-brand-secondary text-featured-icon-light-fg-brand",
            gray: "bg-tertiary text-featured-icon-light-fg-gray",
            error: "bg-error-secondary text-featured-icon-light-fg-error",
            warning: "bg-warning-secondary text-featured-icon-light-fg-warning",
            success: "bg-success-secondary text-featured-icon-light-fg-success",
            blue: "bg-utility-blue-100 text-utility-blue-600",
            indigo: "bg-utility-indigo-100 text-utility-indigo-600",
            purple: "bg-utility-purple-100 text-utility-purple-600",
            orange: "bg-utility-orange-100 text-utility-orange-600",
        },
    },

    gradient: {
        base: "rounded-full text-fg-white before:absolute before:inset-0 before:size-full before:rounded-full before:border before:mask-b-from-0% after:absolute after:block after:rounded-full",
        sizes: {
            sm: "size-8 after:size-6 *:data-icon:size-4",
            md: "size-10 after:size-7 *:data-icon:size-4",
            lg: "size-12 after:size-8 *:data-icon:size-5",
            xl: "size-14 after:size-10 *:data-icon:size-5",
        },
        colors: {
            brand: "before:border-utility-brand-200 before:bg-utility-brand-50 after:bg-brand-solid",
            gray: "before:border-utility-gray-200 before:bg-utility-gray-50 after:bg-secondary-solid",
            error: "before:border-utility-error-200 before:bg-utility-error-50 after:bg-error-solid",
            warning: "before:border-utility-warning-200 before:bg-utility-warning-50 after:bg-warning-solid",
            success: "before:border-utility-success-200 before:bg-utility-success-50 after:bg-success-solid",
            blue: "before:border-utility-blue-200 before:bg-utility-blue-50 after:bg-utility-blue-600",
            indigo: "before:border-utility-indigo-200 before:bg-utility-indigo-50 after:bg-utility-indigo-600",
            purple: "before:border-utility-purple-200 before:bg-utility-purple-50 after:bg-utility-purple-600",
            orange: "before:border-utility-orange-200 before:bg-utility-orange-50 after:bg-utility-orange-600",
        },
    },

    dark: {
        base: "text-fg-white shadow-xs-skeumorphic before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
        sizes: {
            sm: "size-8 rounded-md before:rounded-[5px]",
            md: "size-10 rounded-lg before:rounded-[7px]",
            lg: "size-12 rounded-[10px] before:rounded-[9px]",
            xl: "size-14 rounded-xl before:rounded-[11px]",
        },
        colors: {
            brand: "bg-brand-solid before:border-utility-brand-200/12",
            gray: "bg-secondary-solid before:border-utility-gray-200/12",
            error: "bg-error-solid before:border-utility-error-200/12",
            warning: "bg-warning-solid before:border-utility-warning-200/12",
            success: "bg-success-solid before:border-utility-success-200/12",
            blue: "bg-utility-blue-600 before:border-utility-blue-200/12",
            indigo: "bg-utility-indigo-600 before:border-utility-indigo-200/12",
            purple: "bg-utility-purple-600 before:border-utility-purple-200/12",
            orange: "bg-utility-orange-600 before:border-utility-orange-200/12",
        },
    },

    modern: {
        base: "bg-primary shadow-xs-skeumorphic ring-1 ring-primary ring-inset",
        sizes: {
            sm: "size-8 rounded-md",
            md: "size-10 rounded-lg",
            lg: "size-12 rounded-[10px]",
            xl: "size-14 rounded-xl",
        },
        colors: {
            brand: "text-fg-brand-primary",
            gray: "text-fg-secondary",
            error: "text-fg-error-primary",
            warning: "text-fg-warning-primary",
            success: "text-fg-success-primary",
            blue: "text-utility-blue-600",
            indigo: "text-utility-indigo-600",
            purple: "text-utility-purple-600",
            orange: "text-utility-orange-600",
        },
    },

    outline: {
        base: "before:absolute before:rounded-full before:border-2 after:absolute after:rounded-full after:border-2",
        sizes: {
            sm: "size-4 before:size-6 after:size-8.5",
            md: "size-5 before:size-7 after:size-9.5",
            lg: "size-6 before:size-8 after:size-10.5",
            xl: "size-7 before:size-9 after:size-11.5",
        },
        colors: {
            brand: "text-fg-brand-primary before:border-fg-brand-primary/30 after:border-fg-brand-primary/10",
            gray: "text-fg-tertiary before:border-fg-tertiary/30 after:border-fg-tertiary/10",
            error: "text-fg-error-primary before:border-fg-error-primary/30 after:border-fg-error-primary/10",
            warning: "text-fg-warning-primary before:border-fg-warning-primary/30 after:border-fg-warning-primary/10",
            success: "text-fg-success-primary before:border-fg-success-primary/30 after:border-fg-success-primary/10",
            blue: "text-utility-blue-600 before:border-utility-blue-600/30 after:border-utility-blue-600/10",
            indigo: "text-utility-indigo-600 before:border-utility-indigo-600/30 after:border-utility-indigo-600/10",
            purple: "text-utility-purple-600 before:border-utility-purple-600/30 after:border-utility-purple-600/10",
            orange: "text-utility-orange-600 before:border-utility-orange-600/30 after:border-utility-orange-600/10",
        },
    },
});

interface FeaturedIconProps {
    ref?: Ref<HTMLDivElement>;
    children?: ReactNode;
    className?: string;
    icon?: FC<{ className?: string }> | ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    color: FeaturedIconColor;
    theme?: "light" | "gradient" | "dark" | "outline" | "modern";
}

export const FeaturedIcon = (props: FeaturedIconProps) => {
    const { size = "sm", theme: variant = "light", color = "brand", icon: Icon, ...otherProps } = props;

    return (
        <div
            {...otherProps}
            data-featured-icon
            className={cx(
                "relative flex shrink-0 items-center justify-center",

                iconsSizes[size],
                styles[variant].base,
                styles[variant].sizes[size],
                styles[variant].colors[color],

                props.className,
            )}
        >
            {isReactComponent(Icon) && <Icon data-icon className="z-1" />}
            {isValidElement(Icon) && <div className="z-1">{Icon}</div>}

            {props.children}
        </div>
    );
};
