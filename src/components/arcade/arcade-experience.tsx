import { useCallback, useState } from "react";
import { useApplyPlayResult, useArcadeApi, useArcadeGames, useArcadeStatus, useAwardPoints } from "./api/arcade-session";
import type { GameId } from "./api/types";
import { ArcadeBackdrop } from "./components/arcade-backdrop";
import { ArcadeButton } from "./components/arcade-button";
import { ArcadeHeader } from "./components/arcade-header";
import { PlinkoScreen } from "./games/plinko/plinko-screen";
import { ArcadeEnterScreen } from "./screens/arcade-enter-screen";
import { ArcadeLobbyScreen } from "./screens/arcade-lobby-screen";

/** Where the participant is inside the Arcade. In the app this maps 1:1 to `ARCADE_ROUTES`. */
export type ArcadeView =
    | { screen: "enter" }
    | { screen: "lobby" }
    | { screen: "game"; gameId: GameId }
    | { screen: "achievements" }
    | { screen: "jackpot" };

export interface ArcadeExperienceProps {
    /** Screen to start on. Defaults to the Enter screen. */
    initialView?: ArcadeView;
    /** Called on every screen change, e.g. to sync a router or analytics. */
    onViewChange?: (view: ArcadeView) => void;
}

const newIdempotencyKey = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `play-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * The whole Arcade (Enter, Choose Your Game, Plinko) wired to the Arcade API,
 * with navigation held in state so it runs anywhere, including Storybook.
 *
 * In the platform, mount the same screens on routes instead (see `ARCADE_ROUTES`):
 * each branch below is what that route renders. Must sit inside `ArcadeApiProvider`.
 */
export const ArcadeExperience = ({ initialView = { screen: "enter" }, onViewChange }: ArcadeExperienceProps) => {
    const [view, setView] = useState<ArcadeView>(initialView);
    const go = useCallback(
        (next: ArcadeView) => {
            setView(next);
            onViewChange?.(next);
        },
        [onViewChange],
    );

    const api = useArcadeApi();
    const status = useArcadeStatus();
    const games = useArcadeGames();
    const applyPlayResult = useApplyPlayResult();
    const awardPoints = useAwardPoints();
    const tokens = status.data?.tokenBalance;
    const toLobby = () => go({ screen: "lobby" });
    const onNavigate = (section: "achievements" | "jackpot") => go({ screen: section });

    const gameId = view.screen === "game" ? view.gameId : undefined;
    const play = useCallback(async () => {
        const result = await api.play({ gameId: gameId!, idempotencyKey: newIdempotencyKey() });
        applyPlayResult(result);
        return result;
    }, [api, gameId, applyPlayResult]);

    switch (view.screen) {
        case "enter":
            return <ArcadeEnterScreen tokenBalance={tokens} isLoading={status.isLoading} onEnter={toLobby} onNavigate={onNavigate} />;

        case "lobby":
            return (
                <ArcadeLobbyScreen
                    games={games.data}
                    tokenBalance={tokens}
                    isLoading={status.isLoading || games.isLoading}
                    error={(status.error ?? games.error)?.message}
                    onRetry={() => {
                        status.reload();
                        games.reload();
                    }}
                    onBack={() => go({ screen: "enter" })}
                    onPlay={(game) => go({ screen: "game", gameId: game.id })}
                    onNavigate={onNavigate}
                />
            );

        case "game": {
            const game = games.data?.find((g) => g.id === view.gameId);
            if (game?.kind === "plinko") {
                return (
                    <PlinkoScreen
                        game={game}
                        tokenBalance={tokens ?? 0}
                        onPlay={play}
                        onPointsWon={awardPoints}
                        onBack={toLobby}
                        onNavigate={onNavigate}
                    />
                );
            }
            return <ComingNext eyebrow={games.isLoading ? "Loading game…" : "Game screen coming next"} title={game?.title ?? "Game"} tokens={tokens} onBack={toLobby} onNavigate={onNavigate} />;
        }

        case "achievements":
            return <ComingNext eyebrow="Coming next" title="Achievements" current="achievements" tokens={tokens} onBack={toLobby} onNavigate={onNavigate} />;

        case "jackpot":
            return <ComingNext eyebrow="Coming next" title="Jackpot" current="jackpot" tokens={tokens} onBack={toLobby} onNavigate={onNavigate} />;
    }
};

/** Stand-in for sections designed in the prototype but not built yet. */
const ComingNext = ({
    eyebrow,
    title,
    current,
    tokens,
    onBack,
    onNavigate,
}: {
    eyebrow: string;
    title: string;
    current?: "achievements" | "jackpot";
    tokens?: number;
    onBack: () => void;
    onNavigate: (section: "achievements" | "jackpot") => void;
}) => (
    <ArcadeBackdrop variant="lobby">
        <ArcadeHeader back={{ label: "All games", onPress: onBack }} tokenBalance={tokens} current={current} onNavigate={onNavigate} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
            <p className="font-arcade-mono text-xs tracking-[0.3em] text-arcade-cyan uppercase">{eyebrow}</p>
            <p className="font-arcade-display text-6xl font-black text-white uppercase italic arcade-text-offset">{title}</p>
            <ArcadeButton size="md" color="ghost" onPress={onBack}>
                All games
            </ArcadeButton>
        </div>
    </ArcadeBackdrop>
);
