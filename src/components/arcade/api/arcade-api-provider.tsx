import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArcadeApi } from "./arcade-api";
import { type ArcadeSession, ArcadeSessionContext, type PointsWonState, useAsync } from "./arcade-session";
import type { ArcadeGame, ArcadeStatus, PlayResult } from "./types";

/**
 * Provides the Arcade API plus one shared copy of the participant's status,
 * so the nav badge, the lobby and every game show the same token balance.
 */
export const ArcadeApiProvider = ({
    api,
    onPointsAwarded,
    children,
}: {
    api: ArcadeApi;
    /**
     * Fires when points finish animating in a game (single play or a whole batch).
     * The platform should refresh the participant's points balance here.
     */
    onPointsAwarded?: (amount: number) => void;
    children: ReactNode;
}) => {
    const status = useAsync<ArcadeStatus>(() => api.getStatus(), [api]);
    // Fetched up front (while the Enter screen plays) so the lobby cards are ready on arrival.
    const games = useAsync<ArcadeGame[]>(() => api.getGames(), [api]);
    const { set } = status;
    const applyPlayResult = useCallback((result: PlayResult) => set((d) => (d ? { ...d, tokenBalance: result.tokenBalance } : d)), [set]);
    const [points, setPoints] = useState<PointsWonState>({ sessionTotal: 0, lastAward: null });
    const awardRef = useRef(onPointsAwarded);
    useEffect(() => {
        awardRef.current = onPointsAwarded;
    }, [onPointsAwarded]);
    const awardPoints = useCallback((amount: number) => {
        if (amount <= 0) return;
        setPoints((p) => ({ sessionTotal: p.sessionTotal + amount, lastAward: { id: (p.lastAward?.id ?? 0) + 1, amount } }));
        awardRef.current?.(amount);
    }, []);
    const value = useMemo<ArcadeSession>(
        () => ({
            api,
            status: { data: status.data, error: status.error, isLoading: status.isLoading, reload: status.reload },
            games: { data: games.data, error: games.error, isLoading: games.isLoading, reload: games.reload },
            applyPlayResult,
            points,
            awardPoints,
        }),
        [points, awardPoints, api, status.data, status.error, status.isLoading, status.reload, games.data, games.error, games.isLoading, games.reload, applyPlayResult],
    );
    return <ArcadeSessionContext.Provider value={value}>{children}</ArcadeSessionContext.Provider>;
};

