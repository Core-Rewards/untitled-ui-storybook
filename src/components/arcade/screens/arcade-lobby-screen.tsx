import { RefreshCw01 } from "@untitledui/icons";
import type { ArcadeGame } from "../api/types";
import { ArcadeBackdrop } from "../components/arcade-backdrop";
import { ArcadeButton } from "../components/arcade-button";
import { ArcadeHeader, type ArcadeHeaderProps } from "../components/arcade-header";
import { GameCard } from "../components/game-card";

export interface ArcadeLobbyScreenProps {
    /** Handle the header's Achievements / Jackpot buttons (otherwise they link to `ARCADE_ROUTES`). */
    onNavigate?: ArcadeHeaderProps["onNavigate"];
    games?: ArcadeGame[];
    tokenBalance?: number;
    isLoading?: boolean;
    /** Error message; shows a retry state instead of cards. */
    error?: string;
    /** Game id with a play request in flight. */
    playingGameId?: string;
    onPlay?: (game: ArcadeGame) => void;
    onBack?: () => void;
    onRetry?: () => void;
    reducedMotion?: boolean;
}

/** Featured game goes in the middle on desktop, first on mobile. */
const orderForDisplay = (games: ArcadeGame[]) => {
    const featured = games.find((g) => g.isFeatured);
    if (!featured || games.length < 3) return { desktop: games, mobile: games };
    const rest = games.filter((g) => g !== featured);
    const mid = Math.floor(rest.length / 2);
    return {
        desktop: [...rest.slice(0, mid), featured, ...rest.slice(mid)],
        mobile: [featured, ...rest],
    };
};

/**
 * "Choose your game" lobby. Pure presentation: pass data and callbacks in.
 * `ArcadeLobbyPage` wires it to the API.
 */
export const ArcadeLobbyScreen = ({
    games = [],
    tokenBalance = 0,
    isLoading,
    error,
    playingGameId,
    onPlay,
    onBack,
    onRetry,
    reducedMotion,
    onNavigate,
}: ArcadeLobbyScreenProps) => {
    const { desktop, mobile } = orderForDisplay(games);
    const count = games.length;

    return (
        <ArcadeBackdrop variant="lobby" reducedMotion={reducedMotion}>
            <ArcadeHeader back={onBack ? { label: "Back", onPress: onBack } : undefined} tokenBalance={tokenBalance} isLoading={isLoading} onNavigate={onNavigate} />

            {/* Title */}
            <div className="relative z-10 px-4 pt-6 text-center md:pt-8">
                <h1 className="animate-arcade-fade-up font-arcade-display text-5xl leading-[0.85] font-black tracking-tight text-white uppercase italic arcade-text-offset sm:text-7xl lg:text-[7rem]">
                    Choose <span className="text-arcade-acid">your</span> game
                </h1>
                {tokenBalance === 0 && !isLoading && !error && (
                    <p className="mt-4 font-arcade-mono text-xs tracking-[0.2em] text-arcade-muted uppercase">
                        You're out of tokens. New tokens arrive with program activity.
                    </p>
                )}
            </div>

            {/* Cards */}
            <section aria-label="Games" className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-10 md:px-8 md:pt-12">
                {error ? (
                    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
                        <p className="font-arcade-display text-3xl font-black text-white uppercase italic">Game over… for now</p>
                        <p className="text-sm text-arcade-muted">{error}</p>
                        {onRetry && (
                            <ArcadeButton size="md" color="ghost" showArrow={false} onPress={onRetry}>
                                <RefreshCw01 aria-hidden="true" className="size-5" /> Try again
                            </ArcadeButton>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop/tablet: featured in the middle */}
                        <ul className="hidden items-center gap-6 md:grid md:grid-cols-3 lg:gap-10">
                            {!isLoading &&
                                desktop.map((game, i) => (
                                    <li key={game.id} className="animate-arcade-fade-up" style={{ animationDelay: `${150 + i * 120}ms` }}>
                                        <GameCard game={game} tokenBalance={tokenBalance} isPlaying={playingGameId === game.id} onPlay={onPlay} />
                                    </li>
                                ))}
                        </ul>

                        {/* Mobile: featured first, single column */}
                        <ul className="mx-auto grid max-w-sm gap-8 md:hidden">
                            {!isLoading &&
                                mobile.map((game, i) => (
                                    <li key={game.id} className="animate-arcade-fade-up" style={{ animationDelay: `${150 + i * 120}ms` }}>
                                        <GameCard
                                            game={game}
                                            tokenBalance={tokenBalance}
                                            isPlaying={playingGameId === game.id}
                                            onPlay={onPlay}
                                            isFeatured={false}
                                        />
                                    </li>
                                ))}
                        </ul>
                    </>
                )}
            </section>

            {/* Footer */}
            {!error && count > 0 && (
                <footer
                    aria-hidden="true"
                    className="relative z-10 flex items-center justify-center gap-4 pb-6 font-arcade-mono text-[11px] tracking-[0.3em] text-arcade-ice/70 uppercase"
                >
                    <span className="h-px w-16 bg-arcade-ice/30 md:w-40" />
                    Select your experience <span className="text-arcade-magenta">//</span> {String(count).padStart(2, "0")} games
                    <span className="h-px w-16 bg-arcade-ice/30 md:w-40" />
                </footer>
            )}
        </ArcadeBackdrop>
    );
};
