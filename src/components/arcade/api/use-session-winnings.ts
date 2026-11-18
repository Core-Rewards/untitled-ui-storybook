import { useCallback, useEffect, useState } from "react";
import type { GameId, Prize } from "./types";

/** What a participant has won in one game during this Arcade visit. */
export interface SessionWinningsTotals {
    /** Points won, summed from points prizes. */
    points: number;
    /** Plays that have finished (the ball landed, the card was scratched). */
    plays: number;
    /** Non-points prizes won (merchandise, experiences), which have no point value. */
    prizes: number;
}

const EMPTY: SessionWinningsTotals = { points: 0, plays: 0, prizes: 0 };
const storageKey = (gameId: GameId) => `arcade:session-winnings:${gameId}`;

const read = (gameId: GameId): SessionWinningsTotals => {
    try {
        const raw = window.sessionStorage.getItem(storageKey(gameId));
        if (!raw) return EMPTY;
        const saved = JSON.parse(raw) as Partial<SessionWinningsTotals>;
        return { points: Number(saved.points) || 0, plays: Number(saved.plays) || 0, prizes: Number(saved.prizes) || 0 };
    } catch {
        // Storage can be blocked (private windows) or hold junk. Start from zero.
        return EMPTY;
    }
};

/**
 * Running total of what one game has paid out this session. It is built only
 * from play results the server already returned, so it needs no extra endpoint.
 *
 * With `persist` (the default) the total is kept in `sessionStorage`: it
 * survives a refresh and a trip back to the lobby, and clears when the tab closes.
 */
export const useSessionWinnings = (gameId: GameId, { persist = true }: { persist?: boolean } = {}) => {
    const [totals, setTotals] = useState<SessionWinningsTotals>(() => (persist ? read(gameId) : EMPTY));

    useEffect(() => {
        if (!persist) return;
        try {
            window.sessionStorage.setItem(storageKey(gameId), JSON.stringify(totals));
        } catch {
            // Not being able to save only means the total resets on refresh.
        }
    }, [gameId, persist, totals]);

    /** Call once a play has finished animating, with the prize it won. */
    const record = useCallback((prize: Prize) => {
        const isPoints = prize.type === "points";
        setTotals((t) => ({
            points: t.points + (isPoints ? (prize.points ?? 0) : 0),
            plays: t.plays + 1,
            prizes: t.prizes + (isPoints ? 0 : 1),
        }));
    }, []);

    return { totals, record };
};
