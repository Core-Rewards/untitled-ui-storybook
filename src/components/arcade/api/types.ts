/**
 * Rewards Arcade data contract
 * ----------------------------
 * These types describe what the UI needs from the Core Rewards API.
 * Field names are a proposal: the lead developer should map them to the real
 * endpoints in `arcade-api.ts` (one adapter), and the components stay unchanged.
 *
 * Business rules baked into this contract (from product decisions):
 * - Tokens are earned only through program-defined activities. The UI never
 *   offers a way to buy or "earn more" tokens inside the Arcade.
 * - Nearly every play awards a prize. Outcomes are decided by the SERVER,
 *   never the client. The client only animates the result it is given.
 * - Prize types: points, merchandise, or other (e.g. experiences, gift cards).
 * - Tickets are NOT a reward currency.
 */

export type GameId = string;

export type GameKind = "claw-machine" | "plinko" | "scratch-and-win";

export type PrizeType = "points" | "merchandise" | "other";

export interface ArcadeGame {
    id: GameId;
    kind: GameKind;
    /** Display title, e.g. "Claw Machine". Split into two tones by `titleAccent`. */
    title: string;
    /** Part of the title rendered in the accent color, e.g. "Machine". */
    titleAccent?: string;
    /** One-line description used for accessibility and tooltips. */
    description: string;
    /**
     * Short paragraph (2 or 3 sentences) for the info panel on the game screen.
     * Falls back to `description`.
     */
    about?: string;
    /** Tokens spent per play. */
    tokenCost: number;
    /** Whether the program has this game turned on and in budget. */
    isAvailable: boolean;
    /** Reason shown when `isAvailable` is false, e.g. "Back Monday". */
    unavailableReason?: string;
    /** Highlights the card (center position, "Featured" tag). One per lobby. */
    isFeatured?: boolean;
    /** Prize types this game can award, for the "Win" hint on the card. */
    prizeTypes: PrizeType[];
    /** Top prize label, e.g. "Up to 2,500 pts". */
    topPrizeLabel?: string;
    /** Optional art override (URL from the CMS). Falls back to the bundled art for `kind`. */
    imageUrl?: string;
    /** Plinko only: board shape and what each bin pays. */
    board?: PlinkoBoardConfig;
}

/**
 * Plinko board. There are `rows + 1` bins, symmetric around the center.
 * `tiers` lists the bin positions from the outer pair (index 0) to the single
 * center bin (last index). Each entry says which prize tier lives there, so the
 * layout is independent of the prize table: the server picks the prize (and so
 * the tier) and the client animates the ball into a bin holding that tier.
 */
export interface PlinkoBoardConfig {
    /** Peg rows. The prototype and design use 8 (9 bins). */
    rows: number;
    /** One entry per bin position, outer pair first, center bin last. Length must be `rows / 2 + 1`. */
    tiers: PlinkoTier[];
}

export interface PlinkoTier {
    /** Prize tier shown in this position (matches `Prize.tier`; 0 = rarest). */
    tier: number;
    /** Big label in the bin, e.g. "1K" or "GEAR". */
    label: string;
    /** Small label above it, e.g. "PTS" or "PRIZE". */
    caption: string;
    /** Neon accent for the bin. */
    color: "acid" | "magenta" | "cyan" | "pink" | "violet";
}

export interface ArcadeStatus {
    /** Participant's spendable arcade tokens. */
    tokenBalance: number;
    /** Program-level on/off switch. When false the Arcade nav item is hidden or disabled. */
    isEnabled: boolean;
    /** Program name for copy, e.g. "Advisor Advantage". */
    programName?: string;
    /** Display name for greeting copy. */
    participantFirstName?: string;
}

export interface PlayRequest {
    gameId: GameId;
    /** Client-generated idempotency key so a double-tap never spends two tokens. */
    idempotencyKey: string;
}

export interface Prize {
    /** Prize-table id, e.g. "p500" or "tumbler". */
    id?: string;
    type: PrizeType;
    /** Human label, e.g. "250 Points" or "Neon Water Bottle". */
    label: string;
    /** Numeric value for points prizes. */
    points?: number;
    imageUrl?: string;
    /**
     * Payout tier (0 = rarest). Games use it to pick where to land:
     * Plinko maps it to a bin, Claw to a capsule color, Scratch to a symbol.
     */
    tier?: number;
    /** Short line shown under the prize, e.g. "Ships to the address on your profile". */
    fulfillmentNote?: string;
}

export interface PlayResult {
    playId: string;
    gameId: GameId;
    prize: Prize;
    /** Balance after this play, so the UI never has to recompute it. */
    tokenBalance: number;
    /**
     * Game-specific animation seed, e.g. which Plinko bin the ball lands in
     * or which scratch tiles reveal. The server picks the prize first, then
     * returns a seed the animation can play out to reach that prize.
     */
    presentation?: {
        /** Plinko: exact bin index to land in. If omitted the client picks a bin of `prize.tier`. */
        plinkoBin?: number;
        [key: string]: unknown;
    };
}

export type ArcadeErrorCode = "INSUFFICIENT_TOKENS" | "GAME_UNAVAILABLE" | "ARCADE_DISABLED" | "NETWORK" | "UNKNOWN";

export class ArcadeError extends Error {
    code: ArcadeErrorCode;

    constructor(code: ArcadeErrorCode, message?: string) {
        super(message ?? code);
        this.code = code;
        this.name = "ArcadeError";
    }
}
