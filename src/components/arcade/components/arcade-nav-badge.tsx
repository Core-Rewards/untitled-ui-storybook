import { IconToken } from "./arcade-icons";
import { cx } from "@/utils/cx";

/**
 * Token count shown next to the Arcade nav item. Uses the arcade accent so the
 * item stands out in the otherwise neutral shell, and goes quiet at zero.
 */
export const ArcadeNavBadge = ({ tokens, className }: { tokens: number; className?: string }) => {
    const hasTokens = tokens > 0;
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
                hasTokens ? "bg-arcade-night text-arcade-acid ring-arcade-magenta/60" : "bg-secondary text-quaternary ring-secondary",
                className,
            )}
            aria-label={`${tokens} arcade ${tokens === 1 ? "token" : "tokens"}`}
        >
            <IconToken className={cx("size-3", hasTokens ? "text-arcade-acid" : "text-fg-quaternary")} />
            {tokens}
        </span>
    );
};
