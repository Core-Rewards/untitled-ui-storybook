import { IconToken } from "@/components/arcade/components/arcade-icons";
import { cx } from "@/utils/cx";

export interface TokenBalanceProps {
    tokens?: number;
    isLoading?: boolean;
    size?: "sm" | "md";
    className?: string;
}

/** HUD-style token counter for Arcade screens. */
export const TokenBalance = ({ tokens, isLoading, size = "md", className }: TokenBalanceProps) => {
    const empty = !isLoading && (tokens ?? 0) === 0;
    return (
        <div
            role="status"
            aria-live="polite"
            className={cx(
                "inline-flex items-center gap-2.5 bg-arcade-night font-arcade-mono uppercase arcade-frame-sm",
                empty && "[--frame-edge:var(--color-arcade-tab-edge)]",
                size === "md" ? "px-4 py-2.5 text-xs" : "px-3 py-2 text-[11px]",
                className,
            )}
        >
            <IconToken className={cx(size === "md" ? "size-4" : "size-3.5", empty ? "text-arcade-muted" : "text-arcade-acid")} />
            <span className="tracking-[0.18em] text-arcade-muted">Tokens</span>
            {isLoading ? (
                <span className="h-4 w-6 animate-pulse rounded-sm bg-white/15" aria-label="Loading tokens" />
            ) : (
                <span className={cx("font-bold tabular-nums", size === "md" ? "text-base" : "text-sm", empty ? "text-arcade-muted" : "text-arcade-ice")}>
                    {String(tokens ?? 0).padStart(2, "0")}
                </span>
            )}
        </div>
    );
};
