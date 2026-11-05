import { cx } from "@/utils/cx";

/**
 * Decorative stacked micro-type from the comps ("GAMES / PEOPLE / CULTURE").
 * Purely visual, hidden from assistive tech.
 */
export const HudLabel = ({ lines, align = "left", className }: { lines: string[]; align?: "left" | "right"; className?: string }) => (
    <div
        aria-hidden="true"
        className={cx(
            "font-arcade-mono text-[10px] leading-[1.7] tracking-[0.28em] text-arcade-ice/70 uppercase",
            align === "right" && "text-right",
            className,
        )}
    >
        {lines.map((line) => (
            <div key={line}>{line}</div>
        ))}
        <div className={cx("mt-1 h-0.5 w-8 bg-arcade-magenta", align === "right" && "ml-auto")} />
    </div>
);
