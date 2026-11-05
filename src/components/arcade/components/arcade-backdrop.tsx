import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { layers } from "../assets";

export interface ArcadeBackdropProps {
    /** `enter` uses every layer at full strength; `lobby` is calmer so cards stay readable. */
    variant?: "enter" | "lobby";
    /** Force reduced motion (Storybook / QA). OS-level reduced motion is always honored. */
    reducedMotion?: boolean;
    className?: string;
    children?: ReactNode;
}

/**
 * Layered neon background shared by every Arcade screen:
 * gradient > grid > grunge > shards > floor > vignette, then content.
 * Also the `arcade-root` scope for tokens and reduced-motion rules.
 */
export const ArcadeBackdrop = ({ variant = "enter", reducedMotion, className, children }: ArcadeBackdropProps) => (
    <div
        data-reduced-motion={reducedMotion ? "true" : undefined}
        className={cx(
            "arcade-root dark-mode relative isolate flex min-h-[calc(100dvh-var(--app-header-height,0px))] flex-1 flex-col overflow-hidden bg-arcade-void text-arcade-ice",
            className,
        )}
    >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,var(--color-arcade-violet)_0%,var(--color-arcade-night)_55%,var(--color-arcade-void)_100%)]" />
            <div className="absolute inset-0 arcade-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] opacity-60" />
            <img
                src={layers.grunge}
                alt=""
                className={cx("absolute inset-0 size-full object-cover mix-blend-screen", variant === "enter" ? "opacity-70" : "opacity-35")}
            />
            <img
                src={layers.shards}
                alt=""
                className={cx(
                    "absolute inset-0 size-full animate-arcade-drift object-cover mix-blend-screen",
                    variant === "enter" ? "opacity-95" : "opacity-30",
                )}
            />
            <img
                src={layers.floor}
                alt=""
                className={cx("absolute inset-x-0 bottom-0 w-full object-cover object-bottom", variant === "enter" ? "opacity-100" : "opacity-50")}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(4_1_20/0.75)_100%)]" />
        </div>
        {children}
    </div>
);
