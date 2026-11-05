/**
 * MOCK prize engine, ported from the Rewards Arcade prototype.
 * ----------------------------------------------------------------
 * In production this logic runs on the SERVER when a token is spent. It lives
 * here only so the front end can be demoed end to end. It documents the rules the
 * backend should implement:
 *
 * - One shared prize table for every game.
 * - Each prize has a weight (relative odds), and merch has stock and a cost.
 * - A prize pauses on its own when stock runs out or the remaining budget can't
 *   cover it; the remaining odds rebalance automatically.
 * - If nothing is eligible, the smallest points prize is the floor, so every
 *   play still wins something.
 */
import type { Prize, PrizeType } from "./types";

export interface PrizeTableRow {
    id: string;
    name: string;
    type: PrizeType;
    /** 0 = rarest / outer Plinko bins. */
    tier: number;
    /** Points prizes: points awarded. */
    value?: number;
    /** Merch / other: cost to the program in dollars. */
    cost?: number;
    /** Merch: units left. */
    inventory?: number;
    /** Relative odds. 0 turns the prize off. */
    weight: number;
}

export interface PrizeEngineConfig {
    /** Prize budget in dollars. */
    budget: number;
    /** Dollar value of one point. */
    pointValue: number;
    prizes: PrizeTableRow[];
}

/** Same table as the prototype's DEFAULT_CONFIG. */
export const defaultPrizeConfig = (): PrizeEngineConfig => ({
    budget: 5000,
    pointValue: 0.01,
    prizes: [
        { id: "tumbler", name: "Insulated Tumbler", type: "merchandise", tier: 0, cost: 28, inventory: 6, weight: 2.5 },
        { id: "cap", name: "Branded Cap", type: "merchandise", tier: 0, cost: 22, inventory: 8, weight: 2.5 },
        { id: "p1000", name: "1,000 Points", type: "points", tier: 1, value: 1000, weight: 8 },
        { id: "p500", name: "500 Points", type: "points", tier: 2, value: 500, weight: 20 },
        { id: "p250", name: "250 Points", type: "points", tier: 3, value: 250, weight: 32 },
        { id: "p100", name: "100 Points", type: "points", tier: 4, value: 100, weight: 35 },
    ],
});

export type PrizeStatus = "Live" | "Off" | "Out of stock" | "Over budget";

export const createPrizeEngine = (config: PrizeEngineConfig = defaultPrizeConfig()) => {
    let spent = 0;

    const costOf = (p: PrizeTableRow) => (p.type === "points" ? (p.value ?? 0) * config.pointValue : (p.cost ?? 0));
    const remaining = () => config.budget - spent;

    const statusOf = (p: PrizeTableRow): PrizeStatus => {
        if (!(p.weight > 0)) return "Off";
        if (p.type === "merchandise" && (p.inventory ?? 0) <= 0) return "Out of stock";
        if (costOf(p) > remaining()) return "Over budget";
        return "Live";
    };

    const floorPrize = () => config.prizes.filter((p) => p.type === "points").sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];

    const weighted = (list: PrizeTableRow[]) => {
        const total = list.reduce((s, x) => s + x.weight, 0);
        let r = Math.random() * total;
        for (const x of list) {
            r -= x.weight;
            if (r <= 0) return x;
        }
        return list[list.length - 1];
    };

    const toPrize = (p: PrizeTableRow): Prize => ({
        id: p.id,
        type: p.type,
        label: p.name,
        points: p.type === "points" ? p.value : undefined,
        tier: p.tier,
        fulfillmentNote: p.type === "points" ? "Added to your points balance" : "Ships to the address on your profile",
    });

    return {
        config,
        statusOf,
        remaining,
        /** Pick a prize for one play and book its cost. `forceId` is a demo hook. */
        draw(forceId?: string): Prize {
            let prize: PrizeTableRow | undefined;
            if (forceId) {
                const forced = config.prizes.find((p) => p.id === forceId || p.type === forceId);
                if (forced && statusOf(forced) === "Live") prize = forced;
            }
            if (!prize) {
                const eligible = config.prizes.filter((p) => statusOf(p) === "Live");
                prize = eligible.length ? weighted(eligible) : floorPrize();
            }
            if (prize.type === "merchandise" && prize.inventory !== undefined) prize.inventory--;
            spent += costOf(prize);
            return toPrize(prize);
        },
    };
};
