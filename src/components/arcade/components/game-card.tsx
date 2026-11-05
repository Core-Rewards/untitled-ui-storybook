import { IconToken } from "@/components/arcade/components/arcade-icons";
import { cx, sortCx } from "@/utils/cx";
import type { ArcadeGame, GameKind } from "../api/types";
import { gameArt } from "../assets";
import { ArcadeButton, type ArcadeButtonProps } from "./arcade-button";

/** Per-game accent. Add a row here when a new game kind ships. */
const kindTheme: Record<GameKind, { accent: "cyan" | "acid" | "magenta"; button: ArcadeButtonProps["color"] }> = {
    "claw-machine": { accent: "cyan", button: "cyan" },
    plinko: { accent: "acid", button: "acid" },
    "scratch-and-win": { accent: "magenta", button: "magenta" },
};

const styles = sortCx({
    accentText: {
        cyan: "text-arcade-cyan",
        acid: "text-arcade-acid",
        magenta: "text-arcade-magenta",
    },
    /* Design kit offset-block frame: edge in the game's accent, color blocks behind it. */
    frame: {
        cyan: "[--frame-br:var(--color-arcade-magenta)] [--frame-edge:var(--color-arcade-cyan)] [--frame-tl:var(--color-arcade-purple)]",
        acid: "[--frame-br:var(--color-arcade-magenta)] [--frame-edge:var(--color-arcade-acid)] [--frame-tl:var(--color-arcade-cyan)]",
        magenta: "[--frame-br:var(--color-arcade-cyan)] [--frame-edge:var(--color-arcade-magenta)] [--frame-tl:var(--color-arcade-purple)]",
    },
});

export interface GameCardProps {
    game: ArcadeGame;
    /** Participant's current balance. Used to disable Play when they can't afford it. */
    tokenBalance: number;
    /** Overrides `game.isFeatured` for layout (e.g. on mobile the featured card is not enlarged). */
    isFeatured?: boolean;
    /** Show while a play request for this game is in flight. */
    isPlaying?: boolean;
    onPlay?: (game: ArcadeGame) => void;
    className?: string;
}

const splitTitle = (title: string, accent?: string) => {
    if (!accent || !title.endsWith(accent)) return { lead: title, accent: "" };
    return { lead: title.slice(0, title.length - accent.length).trimEnd(), accent };
};

/**
 * Lobby card for one game. Text, frame and button are live UI layered over
 * clean game art, so titles are translatable and states are data-driven.
 */
export const GameCard = ({ game, tokenBalance, isFeatured = game.isFeatured, isPlaying, onPlay, className }: GameCardProps) => {
    const theme = kindTheme[game.kind];
    const { lead, accent } = splitTitle(game.title, game.titleAccent);
    const canAfford = tokenBalance >= game.tokenCost;
    const isPlayable = game.isAvailable && canAfford;
    const titleId = `game-${game.id}-title`;

    const status = !game.isAvailable ? (game.unavailableReason ?? "Unavailable") : !canAfford ? "Out of tokens" : undefined;

    return (
        <article
            aria-labelledby={titleId}
            className={cx(
                "group/card relative flex flex-col transition duration-300 ease-out",
                isFeatured && "md:z-10 md:scale-[1.06]",
                !game.isAvailable && "saturate-50",
                className,
            )}
        >
            {isFeatured && (
                <span className="absolute -top-3 left-4 z-20 -rotate-6 bg-arcade-acid px-3 py-1 font-arcade-display text-lg leading-none font-black tracking-wide text-arcade-ink uppercase italic shadow-arcade-acid">
                    Featured
                </span>
            )}

            <div
                className={cx(
                    "relative flex flex-1 flex-col overflow-hidden bg-arcade-ink arcade-frame transition duration-300",
                    styles.frame[theme.accent],
                    isPlayable && "group-hover/card:-translate-y-1",
                )}
            >
                {/* Art */}
                <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                        src={game.imageUrl ?? gameArt[game.kind]}
                        alt=""
                        loading="lazy"
                        className={cx("size-full object-cover transition duration-500 ease-out", isPlayable && "group-hover/card:scale-105")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-arcade-ink/90 via-transparent via-35% to-arcade-ink" />

                    {/* Title */}
                    <h3
                        id={titleId}
                        className="absolute inset-x-0 top-0 px-5 pt-6 font-arcade-display text-4xl leading-[0.9] font-black tracking-tight text-white uppercase italic arcade-text-offset md:text-[2.6rem]"
                    >
                        {lead} {accent && <span className={styles.accentText[theme.accent]}>{accent}</span>}
                    </h3>

                    {/* Meta */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pb-4 font-arcade-mono text-[11px] tracking-[0.18em] uppercase">
                        {game.topPrizeLabel && <span className="text-arcade-ice/90">{game.topPrizeLabel}</span>}
                        <span className="ml-auto inline-flex items-center gap-1.5 text-arcade-ice/90">
                            <IconToken className={cx("size-3.5", styles.accentText[theme.accent])} />
                            {game.tokenCost} / play
                        </span>
                    </div>

                    {status && (
                        <div className="absolute inset-0 flex items-center justify-center bg-arcade-void/55 backdrop-blur-[2px]">
                            <span className="bg-arcade-night px-4 py-2 font-arcade-mono text-xs tracking-[0.2em] text-arcade-ice uppercase arcade-frame-sm [--frame-edge:var(--color-arcade-tab-edge)]">
                                {status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="p-4 pt-3">
                    <ArcadeButton
                        size="md"
                        color={theme.button}
                        className="w-full"
                        isDisabled={!isPlayable || isPlaying}
                        onPress={() => onPlay?.(game)}
                        aria-label={`Play ${game.title}, ${game.tokenCost} ${game.tokenCost === 1 ? "token" : "tokens"}`}
                    >
                        {isPlaying ? "Loading…" : "Play now"}
                    </ArcadeButton>
                </div>
            </div>
        </article>
    );
};
