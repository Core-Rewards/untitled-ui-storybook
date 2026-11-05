import type { ArcadeGame, ArcadeStatus, PlayRequest, PlayResult } from "./types";

/**
 * The single seam between the Arcade UI and the Core Rewards backend.
 *
 * Components only ever talk to this interface (through `useArcadeApi()`).
 * - In Storybook and local dev it is backed by `createMockArcadeApi()`.
 * - In the platform, implement it with real fetch calls (see `createHttpArcadeApi`
 *   below for a starting point) and pass it to `<ArcadeApiProvider api={...}>`.
 */
export interface ArcadeApi {
    getStatus(): Promise<ArcadeStatus>;
    getGames(): Promise<ArcadeGame[]>;
    play(request: PlayRequest): Promise<PlayResult>;
}

/**
 * Suggested REST shape. Endpoint paths are placeholders for the lead developer
 * to replace with the real Core Rewards routes and auth handling.
 */
export const createHttpArcadeApi = (options: { baseUrl: string; getAuthHeader?: () => string | Promise<string> }): ArcadeApi => {
    const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
        const auth = options.getAuthHeader ? await options.getAuthHeader() : undefined;
        const response = await fetch(`${options.baseUrl}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(auth ? { Authorization: auth } : {}),
                ...init?.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`Arcade API ${path} failed with ${response.status}`);
        }
        return (await response.json()) as T;
    };

    return {
        getStatus: () => request<ArcadeStatus>("/arcade/status"),
        getGames: () => request<ArcadeGame[]>("/arcade/games"),
        play: ({ gameId, idempotencyKey }) =>
            request<PlayResult>(`/arcade/games/${encodeURIComponent(gameId)}/plays`, {
                method: "POST",
                headers: { "Idempotency-Key": idempotencyKey },
            }),
    };
};
