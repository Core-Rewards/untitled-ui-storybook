import { useCallback, useEffect, useRef, useState } from "react";
import { IconCrown } from "@/components/arcade/components/arcade-icons";
import type { ArcadeGame, PlayResult, Prize } from "../../api/types";
import { ArcadeError } from "../../api/types";
import { ArcadeBackdrop } from "../../components/arcade-backdrop";
import { ArcadeButton } from "../../components/arcade-button";
import { ArcadeHeader, type ArcadeHeaderProps } from "../../components/arcade-header";
import { GameStage } from "../../components/game-stage";
import { PrizeModal } from "../../components/prize-modal";
import { SoundToggle } from "../../components/sound-toggle";
import { sfx } from "../../sound/arcade-sound";
import { PlinkoBoard, type PlinkoBoardHandle } from "./plinko-board";
import { binForTier } from "./plinko-engine";

export interface PlinkoScreenProps {
    /** Handle the header's Achievements / Jackpot buttons (otherwise they link to `ARCADE_ROUTES`). */
    onNavigate?: ArcadeHeaderProps["onNavigate"];
    game: ArcadeGame;
    tokenBalance: number;
    /**
     * Spend one token. Resolve with the server's result; the board then animates
     * to it. Reject with an `ArcadeError` to show a message.
     */
    onPlay: () => Promise<PlayResult>;
    onBack?: () => void;
    /**
     * Fires once every ball in flight has landed, with the total points won by those
     * balls (one drop, Drop 5, or overlapping drops all count as one batch).
     * The shell uses it for the "+N" counter next to the points balance.
     */
    onPointsWon?: (total: number) => void;
    /** Show the "Drop 5" button. */
    allowMultiDrop?: boolean;
    reducedMotion?: boolean;
}

const tokenLabel = (n: number) => `Uses ${n} ${n === 1 ? "token" : "tokens"}`;
const errorCopy: Record<string, string> = {
    INSUFFICIENT_TOKENS: "You're out of tokens. New tokens arrive with program activity.",
    GAME_UNAVAILABLE: "Plinko is taking a break right now. Try another game.",
    ARCADE_DISABLED: "The Arcade is closed right now.",
    NETWORK: "We couldn't reach the Arcade. Your token wasn't spent. Try again.",
};

/** Board height that fits the viewport under the header and controls. */
const useBoardHeight = () => {
    const calc = () => (typeof window === "undefined" ? 560 : Math.max(340, Math.min(640, window.innerHeight - 390)));
    const [h, setH] = useState(calc);
    useEffect(() => {
        const on = () => setH(calc());
        window.addEventListener("resize", on);
        return () => window.removeEventListener("resize", on);
    }, []);
    return h;
};

/**
 * Plinko. Reskinned from the Rewards Arcade prototype (same prize logic) to the
 * neon arcade design. Every ball costs one token and every bin is a prize.
 */
export const PlinkoScreen = ({ game, tokenBalance, onPlay, onBack, onPointsWon, allowMultiDrop = true, reducedMotion, onNavigate }: PlinkoScreenProps) => {
    const board = game.board;
    const boardRef = useRef<PlinkoBoardHandle>(null);
    const results = useRef(new Map<string, PlayResult>());
    const [pending, setPending] = useState(0); // requests waiting on the server
    const [inFlight, setInFlight] = useState(0); // balls on the board
    const [modalQueue, setModalQueue] = useState<Prize[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const boardHeight = useBoardHeight();

    // Batch tracking: plays requested but not yet landed (or failed), and points they won.
    const outstanding = useRef(0);
    const batchPoints = useRef(0);
    const onPointsWonRef = useRef(onPointsWon);
    onPointsWonRef.current = onPointsWon;
    const settleOne = useCallback((points: number) => {
        outstanding.current = Math.max(0, outstanding.current - 1);
        batchPoints.current += points;
        if (outstanding.current === 0) {
            const total = batchPoints.current;
            batchPoints.current = 0;
            if (total > 0) onPointsWonRef.current?.(total);
        }
    }, []);

    const available = tokenBalance - pending;
    const canDrop = available >= game.tokenCost && !!board;

    const dropOne = useCallback(async () => {
        if (!board) return;
        setPending((p) => p + 1);
        try {
            const result = await onPlay();
            setError(null);
            // No tier from the server: use the most common prize (highest tier number).
            const tier = result.prize.tier ?? Math.max(...board.tiers.map((t) => t.tier));
            const bin = result.presentation?.plinkoBin ?? binForTier(board, tier);
            results.current.set(result.playId, result);
            setInFlight((n) => n + 1);
            boardRef.current?.drop(result.playId, bin);
        } catch (e) {
            const code = e instanceof ArcadeError ? e.code : "NETWORK";
            setError(errorCopy[code] ?? errorCopy.NETWORK);
            settleOne(0);
        } finally {
            setPending((p) => p - 1);
        }
    }, [board, onPlay, settleOne]);

    const handleDrop = (count: number) => {
        sfx.unlock();
        const n = Math.min(count, Math.floor(available / game.tokenCost));
        outstanding.current += n;
        for (let i = 0; i < n; i++) window.setTimeout(() => void dropOne(), i * 260);
    };

    const handleLand = useCallback((id: string) => {
        const result = results.current.get(id);
        results.current.delete(id);
        setInFlight((n) => Math.max(0, n - 1));
        if (!result) return;
        const { prize } = result;
        const isPoints = prize.type === "points";
        settleOne(isPoints ? (prize.points ?? 0) : 0);
        setAnnouncement(`You won ${prize.label}.`);
        sfx.land(!isPoints);
        if (!isPoints) setModalQueue((q) => [...q, prize]);
    }, [settleOne]);

    const tiersCenterOut = board ? [...board.tiers].reverse() : [];

    const howToPlay = (
        <div className="flex flex-col gap-3">
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-arcade-muted">
                <li>Each ball costs {game.tokenCost} token.</li>
                <li>Press Drop ball and watch it bounce down the pegs.</li>
                <li>Every bin is a prize. Points go straight to your balance; gear ships to you.</li>
            </ol>
            {board && (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-arcade-mono text-xs uppercase">
                    {tiersCenterOut.map((t, i) => (
                        <li key={t.tier} className="flex justify-between">
                            <span className="text-arcade-muted">
                                {i === 0 ? "Center" : i === tiersCenterOut.length - 1 ? "Edges" : `Ring ${i}`}
                            </span>
                            <span className="text-arcade-ice">
                                {t.label} {t.caption === "PTS" ? "pts" : ""}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <ArcadeBackdrop variant="lobby" reducedMotion={reducedMotion}>
            <ArcadeHeader
                back={onBack ? { label: "All games", onPress: onBack } : undefined}
                tokenBalance={tokenBalance}
                actions={<SoundToggle />}
                howToPlay={howToPlay}
                onNavigate={onNavigate}
            />

            <GameStage
                title={game.title}
                tagline={
                    <p className="flex items-center gap-2 font-arcade-display text-4xl font-black text-arcade-magenta uppercase italic drop-shadow-[0_0_12px_rgb(240_0_236/0.6)]">
                        Let it drop <IconCrown className="size-6 -translate-y-3 rotate-12 text-arcade-acid" />
                    </p>
                }
                hud={["Gravity", "plays different", "here"]}
                about={game.about ?? game.description}
                facts={[
                    { label: "Cost", value: `${game.tokenCost} token per ball` },
                    ...(game.topPrizeLabel ? [{ label: "Top prize", value: game.topPrizeLabel }] : []),
                ]}
                status={error ?? (tokenBalance <= 0 && inFlight === 0 ? errorCopy.INSUFFICIENT_TOKENS : "Every bin is a prize")}
                statusIsError={!!error}
                actions={
                    <>
                        <ArcadeButton
                            size="xl"
                            color="acid"
                            showArrow={false}
                            className="min-w-52 flex-[3] basis-0 px-6 whitespace-nowrap md:px-8"
                            isDisabled={!canDrop}
                            onPress={() => handleDrop(1)}
                            caption={tokenLabel(game.tokenCost)}
                        >
                            {pending > 0 && inFlight === 0 ? "Dropping…" : "Drop ball"}
                        </ArcadeButton>
                        {allowMultiDrop && (
                            <ArcadeButton
                                size="xl"
                                color="ghost"
                                showArrow={false}
                                className="min-w-40 flex-[2] basis-0 px-6 whitespace-nowrap md:px-8"
                                isDisabled={available < game.tokenCost * 5}
                                onPress={() => handleDrop(5)}
                                hoverEffect="swipe"
                                caption={tokenLabel(game.tokenCost * 5)}
                            >
                                Drop 5
                            </ArcadeButton>
                        )}
                    </>
                }
            >
                {board ? (
                    <PlinkoBoard ref={boardRef} board={board} maxHeight={boardHeight} reducedMotion={reducedMotion} onLand={handleLand} className="pb-3" />
                ) : (
                    <p className="py-20 text-arcade-muted">This game has no board configured.</p>
                )}
            </GameStage>

            <span className="sr-only" aria-live="polite">
                {announcement}
            </span>
            <PrizeModal prize={modalQueue[0] ?? null} onClose={() => setModalQueue((q) => q.slice(1))} />
        </ArcadeBackdrop>
    );
};
