import type { ReactNode } from "react";
import { ArrowRight } from "@untitledui/icons";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";
import { Button as AriaButton } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

/*
 * Clip-path cuts off box-shadows and rings, so the frame is two clipped layers:
 * `frame` (the border color) and `fill` inset by 2px. The glow is a
 * drop-shadow filter on the root, which follows the clipped shape.
 */
const arcadeButtonStyles = sortCx({
    common: {
        root: "group relative inline-flex cursor-pointer items-center justify-center gap-3 font-arcade-display font-extrabold tracking-wide uppercase italic transition duration-150 ease-out outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arcade-cyan disabled:cursor-not-allowed disabled:opacity-50 pressed:scale-[0.98]",
        frame: "absolute inset-0 transition duration-150 arcade-clip",
        fill: "absolute inset-[2px] transition duration-150 arcade-clip",
        label: "relative z-10 flex items-center gap-3",
        brackets: "pointer-events-none absolute -inset-3 z-0",
    },
    sizes: {
        md: { root: "h-12 px-7 text-xl" },
        lg: { root: "h-16 px-10 text-2xl" },
        xl: { root: "h-20 px-12 text-3xl md:h-22 md:px-16 md:text-4xl" },
    },
    colors: {
        magenta: {
            root: "text-white drop-shadow-[0_0_14px_rgb(240_0_236/0.65)]",
            frame: "bg-gradient-to-r from-arcade-magenta via-arcade-pink to-arcade-magenta",
            fill: "bg-arcade-ink group-hover:bg-[#2a0640] group-pressed:bg-[#3a0858]",
            accent: "text-arcade-acid",
        },
        acid: {
            root: "text-arcade-ink drop-shadow-[0_0_12px_rgb(238_255_0/0.45)]",
            frame: "bg-arcade-acid",
            fill: "bg-arcade-acid group-hover:brightness-110",
            accent: "text-arcade-ink",
        },
        cyan: {
            root: "text-arcade-ink drop-shadow-[0_0_12px_rgb(0_231_242/0.5)]",
            frame: "bg-arcade-cyan",
            fill: "bg-arcade-cyan group-hover:brightness-110",
            accent: "text-arcade-ink",
        },
        ghost: {
            root: "text-arcade-ice",
            frame: "bg-white/35",
            fill: "bg-arcade-ink group-hover:bg-[#1c1038]",
            accent: "text-arcade-cyan",
        },
    },
});

export interface ArcadeButtonProps extends Omit<AriaButtonProps, "children" | "className"> {
    size?: keyof typeof arcadeButtonStyles.sizes;
    color?: keyof typeof arcadeButtonStyles.colors;
    /** Pulsing glow to draw the eye (magenta only). Turns off for reduced motion. */
    isPulsing?: boolean;
    /** Show the corner brackets from the Enter screen comp. */
    showBrackets?: boolean;
    /** Trailing arrow; pass `false` to hide. */
    showArrow?: boolean;
    /** Hover animation. `swipe`: an electric band sweeps left to right and the frame flickers. */
    hoverEffect?: "none" | "swipe";
    /** Small line under the label, e.g. "Uses 1 token". */
    caption?: ReactNode;
    className?: string;
    children: ReactNode;
}

const Brackets = () => (
    <span className={arcadeButtonStyles.common.brackets} aria-hidden="true">
        <svg className="size-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            <g fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="text-arcade-cyan">
                <path d="M0 8 V0 H6" vectorEffect="non-scaling-stroke" />
                <path d="M94 0 H100 V8" vectorEffect="non-scaling-stroke" />
                <path d="M0 32 V40 H6" vectorEffect="non-scaling-stroke" />
                <path d="M94 40 H100 V32" vectorEffect="non-scaling-stroke" />
            </g>
        </svg>
    </span>
);

/** Electric band that crosses the button on hover. Lives inside the clipped fill so it never spills past the frame. */
const SwipeEffect = () => (
    <span aria-hidden="true" className="pointer-events-none absolute inset-[2px] overflow-hidden arcade-clip group-disabled:hidden">
        {/* Wide glow */}
        <span className="absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(90deg,transparent_0%,rgb(0_231_242/0.25)_30%,rgb(0_231_242/0.7)_48%,rgb(255_255_255/0.95)_50%,rgb(0_231_242/0.7)_52%,rgb(0_231_242/0.25)_70%,transparent_100%)] opacity-0 mix-blend-screen group-hover:motion-safe:animate-arcade-swipe" />
        {/* Thin trailing bolt */}
        <span className="absolute inset-y-0 left-0 w-[7%] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.9),transparent)] opacity-0 mix-blend-screen group-hover:motion-safe:animate-arcade-swipe-bolt" />
    </span>
);

/**
 * Neon call-to-action for Arcade screens. Built on React Aria `Button`, so it
 * gets keyboard, focus and press handling like every Untitled UI button.
 */
export const ArcadeButton = ({
    size = "lg",
    color = "magenta",
    isPulsing = false,
    showBrackets = false,
    showArrow = true,
    caption,
    hoverEffect = "none",
    className,
    children,
    ...props
}: ArcadeButtonProps) => {
    const colorStyles = arcadeButtonStyles.colors[color];
    return (
        <AriaButton {...props} className={cx(
                arcadeButtonStyles.common.root,
                arcadeButtonStyles.sizes[size].root,
                colorStyles.root,
                hoverEffect === "swipe" && "enabled:hover:drop-shadow-[0_0_14px_rgb(0_231_242/0.55)]",
                className,
            )}>
            {showBrackets && <Brackets />}
            <span
                className={cx(
                    arcadeButtonStyles.common.frame,
                    colorStyles.frame,
                    hoverEffect === "swipe" && "group-hover:group-enabled:bg-arcade-cyan/80 group-hover:group-enabled:motion-safe:animate-arcade-zap",
                )}
            />
            <span className={cx(arcadeButtonStyles.common.fill, colorStyles.fill)} />
            {hoverEffect === "swipe" && <SwipeEffect />}
            {isPulsing && <span aria-hidden="true" className="absolute inset-0 animate-arcade-glow bg-arcade-magenta/25 arcade-clip" />}
            <span className={arcadeButtonStyles.common.label}>
                {caption ? (
                    <span className="flex flex-col items-center leading-none">
                        <span>{children}</span>
                        <span className="mt-1.5 font-arcade-mono text-[11px] font-bold tracking-[0.18em] not-italic opacity-80">{caption}</span>
                    </span>
                ) : (
                    children
                )}
                {showArrow && (
                    <ArrowRight
                        aria-hidden="true"
                        className={cx("size-[1em] stroke-[3px] transition duration-150 group-hover:translate-x-1", colorStyles.accent)}
                    />
                )}
            </span>
        </AriaButton>
    );
};
