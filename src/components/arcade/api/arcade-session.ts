/** Shared Arcade session: context, data hook and the hooks screens use. `ArcadeApiProvider` fills it. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ArcadeApi } from "./arcade-api";
import { createMockArcadeApi } from "./mock-arcade-api";
import type { ArcadeGame, ArcadeStatus, PlayResult } from "./types";

export type AsyncState<T> = { data?: T; error?: Error; isLoading: boolean };
export type AsyncResult<T> = AsyncState<T> & { reload: () => void };

/**
 * Minimal data hook so this package has no data-fetching dependency.
 * If the platform already uses TanStack Query / SWR, swap the hooks below
 * for query hooks with the same return shape.
 */
export const useAsync = <T>(load: () => Promise<T>, deps: unknown[], enabled = true): AsyncResult<T> & { set: (fn: (d?: T) => T | undefined) => void } => {
    const [state, setState] = useState<AsyncState<T>>({ isLoading: enabled });
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setState((s) => ({ ...s, isLoading: true, error: undefined }));
        load().then(
            (data) => !cancelled && setState({ data, isLoading: false }),
            (error: Error) => !cancelled && setState({ error, isLoading: false }),
        );
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, nonce, enabled]);

    const reload = useCallback(() => setNonce((n) => n + 1), []);
    const set = useCallback((fn: (d?: T) => T | undefined) => setState((s) => ({ ...s, data: fn(s.data) })), []);
    return { ...state, reload, set };
};

export interface ArcadeSession {
    api: ArcadeApi;
    status: AsyncResult<ArcadeStatus>;
    games: AsyncResult<ArcadeGame[]>;
    /** Apply a play result everywhere (nav badge, HUDs) without refetching. */
    applyPlayResult: (result: PlayResult) => void;
    /** Points won this session, and the latest award (drives the "+N" counter in the shell). */
    points: PointsWonState;
    /** Call once a play (or a batch of plays) has finished animating, with the points total. */
    awardPoints: (amount: number) => void;
}

export interface PointsWonState {
    /** Running total won since the provider mounted. */
    sessionTotal: number;
    /** Latest award. `id` increases with every award so the shell can replay its animation. */
    lastAward: { id: number; amount: number } | null;
}

export const ArcadeSessionContext = createContext<ArcadeSession | null>(null);

/** Falls back to the mock API so components render in isolation. */
export const useArcadeApi = (): ArcadeApi => {
    const session = useContext(ArcadeSessionContext);
    return useMemo(() => session?.api ?? createMockArcadeApi(), [session?.api]);
};

/** Participant status (token balance etc.). Shared across the app when inside `ArcadeApiProvider`. */
export const useArcadeStatus = (): AsyncResult<ArcadeStatus> => {
    const session = useContext(ArcadeSessionContext);
    const api = useArcadeApi();
    const local = useAsync<ArcadeStatus>(() => api.getStatus(), [api], !session);
    return session ? session.status : local;
};

/** Call after every play so the shared token balance updates. */
export const useApplyPlayResult = () => {
    const session = useContext(ArcadeSessionContext);
    return session?.applyPlayResult ?? (() => {});
};

/** Game catalog. Shared (and prefetched) when inside `ArcadeApiProvider`. */
export const useArcadeGames = (): AsyncResult<ArcadeGame[]> => {
    const session = useContext(ArcadeSessionContext);
    const api = useArcadeApi();
    const local = useAsync<ArcadeGame[]>(() => api.getGames(), [api], !session);
    return session ? session.games : local;
};

/** Points won in the Arcade this session plus the latest award (for the shell's "+N" counter). */
export const useArcadePoints = (): PointsWonState => {
    const session = useContext(ArcadeSessionContext);
    return session?.points ?? { sessionTotal: 0, lastAward: null };
};

/** Report points once a play or batch of plays has finished animating. */
export const useAwardPoints = () => {
    const session = useContext(ArcadeSessionContext);
    return session?.awardPoints ?? (() => {});
};
