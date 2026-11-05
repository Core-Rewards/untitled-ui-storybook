import { useState } from "react";
import { cx } from "@/utils/cx";
import { ArcadeBackdrop } from "../components/arcade-backdrop";
import { ArcadeButton } from "../components/arcade-button";
import { ArcadeHeader, type ArcadeHeaderProps } from "../components/arcade-header";
import { ArcadeWordmark } from "../components/arcade-wordmark";
import { HudLabel } from "../components/hud-label";

export interface ArcadeEnterScreenProps {
    /** Handle the header's Achievements / Jackpot buttons (otherwise they link to `ARCADE_ROUTES`). */
    onNavigate?: ArcadeHeaderProps["onNavigate"];
    /** Participant's arcade token balance. */
    tokenBalance?: number;
    /** Line above the ARCADE letters. Override per program if needed. */
    eyebrow?: string;
    isLoading?: boolean;
    /** Called after the exit animation finishes. Navigate to the lobby here. */
    onEnter?: () => void;
    /** Force reduced motion (Storybook / QA). OS setting is always honored. */
    reducedMotion?: boolean;
    /** Exit animation length in ms. */
    exitDurationMs?: number;
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Animated entry screen shown when a participant opens the Arcade.
 * Letters slam in, background layers drift, and the CTA pulses.
 * Pressing Enter plays a short zoom-out before calling `onEnter`.
 */
export const ArcadeEnterScreen = ({
    tokenBalance,
    eyebrow = "Welcome to your rewards",
    isLoading,
    onEnter,
    reducedMotion,
    exitDurationMs = 450,
    onNavigate,
}: ArcadeEnterScreenProps) => {
    const [isLeaving, setIsLeaving] = useState(false);
    const hasTokens = (tokenBalance ?? 0) > 0;

    const handleEnter = () => {
        if (isLeaving) return;
        if (reducedMotion || prefersReducedMotion()) {
            onEnter?.();
            return;
        }
        setIsLeaving(true);
        window.setTimeout(() => onEnter?.(), exitDurationMs);
    };

    return (
        <ArcadeBackdrop variant="enter" reducedMotion={reducedMotion}>
            {/* Top bar: no back button on the Enter screen */}
            <ArcadeHeader tokenBalance={tokenBalance} isLoading={isLoading} onNavigate={onNavigate} />

            {/* Center stage */}
            <div
                className={cx(
                    "relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 pb-16 transition duration-[450ms] ease-in md:px-10",
                    isLeaving && "scale-110 opacity-0 blur-sm",
                )}
            >
                <div className="flex animate-arcade-fade-up items-center gap-4 text-center font-arcade-mono text-xs tracking-[0.3em] text-arcade-ice uppercase sm:text-sm sm:tracking-[0.5em] md:text-lg">
                    <span aria-hidden="true" className="h-px w-10 bg-arcade-ice/60 max-sm:hidden md:w-28" />
                    <span>{eyebrow}</span>
                    <span aria-hidden="true" className="h-px w-10 bg-arcade-ice/60 max-sm:hidden md:w-28" />
                </div>

                <h1 className="mt-4 w-full max-w-4xl md:mt-6">
                    <ArcadeWordmark motion={reducedMotion ? "static" : "enter"} startDelayMs={150} />
                </h1>

                <p
                    className="mt-6 animate-arcade-fade-up font-arcade-mono text-sm tracking-[0.35em] text-arcade-ice uppercase sm:text-base sm:tracking-[0.45em] md:mt-8 md:text-xl"
                    style={{ animationDelay: "900ms" }}
                >
                    Play <span className="text-arcade-magenta">//</span> Win <span className="text-arcade-acid">//</span> Repeat
                </p>

                <div className="mt-8 animate-arcade-fade-up md:mt-10" style={{ animationDelay: "1100ms" }}>
                    <ArcadeButton size="xl" color="magenta" isPulsing showBrackets onPress={handleEnter} isDisabled={isLoading}>
                        Enter the Arcade
                    </ArcadeButton>
                </div>

                {!isLoading && (
                    <p
                        className="mt-6 animate-arcade-fade-up text-center font-arcade-mono text-xs tracking-[0.2em] text-arcade-muted uppercase"
                        style={{ animationDelay: "1300ms" }}
                    >
                        {hasTokens
                            ? `${tokenBalance} ${tokenBalance === 1 ? "token" : "tokens"} ready to play`
                            : "No tokens right now. New tokens arrive with program activity."}
                    </p>
                )}
            </div>

            {/* Bottom HUD */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4 max-md:hidden md:p-8">
                <HudLabel lines={["More", "than", "a game"]} />
                <HudLabel lines={["Sound", "High", "scores", "community"]} align="right" />
            </div>
        </ArcadeBackdrop>
    );
};
