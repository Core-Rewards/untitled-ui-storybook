/** Arcade URLs. Adjust the base path if the platform mounts the Arcade elsewhere. */
export const ARCADE_ROUTES = {
    enter: "/arcade",
    lobby: "/arcade/games",
    play: (gameId: string) => `/arcade/games/${encodeURIComponent(gameId)}`,
    achievements: "/arcade/achievements",
    jackpot: "/arcade/jackpot",
};
