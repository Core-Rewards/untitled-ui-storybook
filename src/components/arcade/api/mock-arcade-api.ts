import type { ArcadeApi } from "./arcade-api";
import { createPrizeEngine } from "./mock-prize-engine";
import type { ArcadeGame, ArcadeStatus, PlayResult, PlinkoBoardConfig } from "./types";
import { ArcadeError } from "./types";

/** Plinko bins mirror the shared prize table (see mock-prize-engine.ts). */
export const mockPlinkoBoard: PlinkoBoardConfig = {
    rows: 8,
    // Outer bins to center: lowest prize on the edges, the top prize alone in the middle.
    tiers: [
        { tier: 4, caption: "PTS", label: "100", color: "violet" },
        { tier: 3, caption: "PTS", label: "250", color: "pink" },
        { tier: 2, caption: "PTS", label: "500", color: "cyan" },
        { tier: 1, caption: "PTS", label: "1K", color: "magenta" },
        { tier: 0, caption: "PRIZE", label: "GEAR", color: "acid" },
    ],
};

export const mockGames: ArcadeGame[] = [
    {
        id: "claw-01",
        kind: "claw-machine",
        title: "Claw Machine",
        titleAccent: "Machine",
        description: "Line up the claw and grab a prize from the cabinet.",
        about: "Steer the claw over the prize you want and drop it. Every grab wins something, from bonus points to Core Rewards gear.",
        tokenCost: 1,
        isAvailable: true,
        prizeTypes: ["merchandise", "points"],
        topPrizeLabel: "Merch drops",
    },
    {
        id: "plinko-01",
        kind: "plinko",
        title: "Plinko",
        description: "Drop the ball and watch it bounce into a prize bin.",
        about: "Drop a ball from the top and watch it bounce through the pegs. Every bin holds a prize, and the closer to the center it lands, the bigger the win.",
        tokenCost: 1,
        isAvailable: true,
        isFeatured: true,
        prizeTypes: ["points", "merchandise"],
        topPrizeLabel: "Up to 1,000 pts + gear",
        board: mockPlinkoBoard,
    },
    {
        id: "scratch-01",
        kind: "scratch-and-win",
        title: "Scratch & Win",
        titleAccent: "Win",
        description: "Scratch three tiles to reveal your prize.",
        about: "Scratch off all three tiles to reveal your prize. Every card is a winner, and points land in your balance right away.",
        tokenCost: 1,
        isAvailable: true,
        prizeTypes: ["points", "other"],
        topPrizeLabel: "Instant wins",
    },
];

export const mockStatus: ArcadeStatus = {
    tokenBalance: 25,
    isEnabled: true,
    programName: "Core Rewards",
    participantFirstName: "Jordan",
};

export type MockScenario =
    | "default"
    | "low-tokens"
    | "no-tokens"
    | "game-unavailable"
    | "arcade-disabled"
    | "loading"
    | "error"
    /** Every play wins merchandise while stock lasts (to demo the prize modal). */
    | "merch-win";

export interface MockArcadeOptions {
    scenario?: MockScenario;
    /** Simulated network latency in ms for reads. */
    latency?: number;
    /** Simulated latency for a play (kept short so the ball drops right away). */
    playLatency?: number;
    status?: Partial<ArcadeStatus>;
    games?: ArcadeGame[];
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * In-memory Arcade API for Storybook, local dev and demos.
 * Scenarios cover the states the UI must handle before the real API exists.
 */
export const createMockArcadeApi = ({ scenario = "default", latency = 350, playLatency = 120, status, games }: MockArcadeOptions = {}): ArcadeApi => {
    let state: ArcadeStatus = {
        ...mockStatus,
        ...(scenario === "no-tokens" ? { tokenBalance: 0 } : {}),
        ...(scenario === "low-tokens" ? { tokenBalance: 3 } : {}),
        ...(scenario === "arcade-disabled" ? { isEnabled: false } : {}),
        ...status,
    };

    let catalog = games ?? mockGames;
    if (scenario === "game-unavailable") {
        catalog = catalog.map((game) => (game.kind === "claw-machine" ? { ...game, isAvailable: false, unavailableReason: "Restocking. Back Monday" } : game));
    }

    const engine = createPrizeEngine();

    const gate = async (ms = latency) => {
        if (scenario === "loading") {
            await new Promise(() => {
                /* never resolves: keeps the UI in its loading state */
            });
        }
        await wait(ms);
        if (scenario === "error") throw new ArcadeError("NETWORK", "We couldn't reach the Arcade. Try again in a moment.");
    };

    return {
        async getStatus() {
            await gate();
            return { ...state };
        },
        async getGames() {
            await gate();
            return catalog;
        },
        async play({ gameId }) {
            await gate(playLatency);
            const game = catalog.find((g) => g.id === gameId);
            if (!state.isEnabled) throw new ArcadeError("ARCADE_DISABLED");
            if (!game || !game.isAvailable) throw new ArcadeError("GAME_UNAVAILABLE");
            if (state.tokenBalance < game.tokenCost) throw new ArcadeError("INSUFFICIENT_TOKENS");

            state = { ...state, tokenBalance: state.tokenBalance - game.tokenCost };
            const prize = engine.draw(scenario === "merch-win" ? "merchandise" : undefined);
            const result: PlayResult = {
                playId: `play_${Date.now()}`,
                gameId,
                prize,
                tokenBalance: state.tokenBalance,
            };
            return result;
        },
    };
};
