import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PromotionsTable } from "./promotions-table";
import type { Promotion } from "./promotions-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

/** A public dummy PDF, so the flyer action opens something real in Storybook. */
const sampleFlyer = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const promotions: Promotion[] = [
    {
        id: "triple-points-tober",
        name: "Triple Points'tober",
        description: "Sell Contractor Select products this month and earn TRIPLE points",
        pointsMultiplier: 3,
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "active",
        flyerUrl: sampleFlyer,
    },
    {
        id: "fall-comfort-bonus",
        name: "Fall Comfort Bonus",
        description: "Earn double points on every qualifying furnace and heat pump installed before the end of the month",
        pointsMultiplier: 2,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "ending-soon",
        flyerUrl: sampleFlyer,
    },
    {
        id: "ductless-double-down",
        name: "Ductless Double Down",
        description: "Double points on all ductless mini-split systems, including multi-zone configurations",
        pointsMultiplier: 2,
        startDate: "2026-09-15",
        endDate: "2026-11-15",
        status: "active",
    },
    {
        id: "new-year-fast-start",
        name: "New Year Fast Start",
        description: "Kick off the year with 1.5x points on your first ten qualifying submissions",
        pointsMultiplier: 1.5,
        startDate: "2027-01-01",
        endDate: "2027-02-28",
        status: "scheduled",
        flyerUrl: sampleFlyer,
    },
    {
        id: "summer-cooling-kickoff",
        name: "Summer Cooling Kickoff",
        description: "Double points on condensers and air handlers sold ahead of the cooling season",
        pointsMultiplier: 2,
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        status: "ended",
        flyerUrl: sampleFlyer,
    },
];

/** Adds a cancelled promotion so every status badge is visible at once. */
const promotionsWithCancelled: Promotion[] = [
    ...promotions,
    {
        id: "spring-tune-up-sprint",
        name: "Spring Tune-Up Sprint",
        description: "Bonus points on maintenance agreements sold during the spring service push",
        pointsMultiplier: 2,
        startDate: "2026-03-01",
        endDate: "2026-04-30",
        status: "cancelled",
    },
];

/** Enough rows to exercise the pagination footer. */
const manyPromotions: Promotion[] = [
    ...promotionsWithCancelled,
    ...Array.from({ length: 18 }, (_, index) => {
        const month = (index % 12) + 1;
        const paddedMonth = String(month).padStart(2, "0");

        return {
            id: `regional-bonus-${index + 1}`,
            name: `Regional Bonus ${index + 1}`,
            description: "Territory-specific bonus points on qualifying equipment sold through participating distributors",
            pointsMultiplier: index % 3 === 0 ? 2 : 1.5,
            startDate: `2026-${paddedMonth}-01`,
            endDate: `2026-${paddedMonth}-28`,
            status: (["active", "ending-soon", "scheduled", "ended"] as const)[index % 4],
            flyerUrl: index % 2 === 0 ? sampleFlyer : undefined,
        } satisfies Promotion;
    }),
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Tables/Promotions",
    component: PromotionsTable,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onTogglePin: { action: "onTogglePin" },
        onPinnedIdsChange: { action: "onPinnedIdsChange" },
    },
} satisfies Meta<typeof PromotionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Sortable columns, a search and status filter toolbar, and pagination. Pin a row to lift it into its own card. */
export const Default: Story = {
    args: {
        promotions,
        description: "Every promotion you can earn on right now, plus what is coming up.",
    },
};

/** Two promotions start out pinned, so they sort among themselves in a card above the full list. */
export const WithPinnedPromotions: Story = {
    args: {
        promotions,
        description: "Every promotion you can earn on right now, plus what is coming up.",
        defaultPinnedIds: ["triple-points-tober", "fall-comfort-bonus"],
    },
};

/** All five status badges, including a cancelled promotion. */
export const AllStatuses: Story = {
    args: {
        promotions: promotionsWithCancelled,
    },
};

/** Twenty-four rows at five per page, showing the footer controls and the rows-per-page picker. */
export const Paginated: Story = {
    args: {
        promotions: manyPromotions,
        description: "Search, filter by status, or page through the full programme calendar.",
        defaultPageSize: 5,
        rowsPerPageOptions: [5, 10, 25, 50],
    },
};

/** With no promotions to show, the table falls back to the "Promotions coming soon" empty state. */
export const Empty: Story = {
    args: {
        promotions: [],
    },
};

/**
 * Pin state owned by the consumer through `pinnedIds` and `onPinnedIdsChange`, which is how
 * an app would persist a user's pinned promotions.
 */
export const ControlledPinning: Story = {
    args: {
        promotions,
    },
    render: (args) => {
        const [pinnedIds, setPinnedIds] = useState<string[]>(["ductless-double-down"]);

        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm text-tertiary">
                    Pinned ids: <span className="font-medium text-primary">{pinnedIds.length > 0 ? pinnedIds.join(", ") : "none"}</span>
                </p>
                <PromotionsTable {...args} pinnedIds={pinnedIds} onPinnedIdsChange={setPinnedIds} />
            </div>
        );
    },
};
