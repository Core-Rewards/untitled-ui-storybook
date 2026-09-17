import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SalesSubmissionsTable } from "./sales-submissions-table";
import type { SalesSubmission } from "./sales-submissions-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const submissions: SalesSubmission[] = [
    {
        id: "q-104582",
        quoteNumber: "Q-104582",
        quoteCreatedDate: "2026-09-02",
        quoteAmount: 48250,
        abbOrderNumber: "ABB-7741203",
        abbOrderDate: "2026-09-09",
        abbOrderAmount: 46900,
        eligibleOrderAmount: 41300,
        pointValue: 41300,
        status: "approved",
    },
    {
        id: "q-104610",
        quoteNumber: "Q-104610",
        quoteCreatedDate: "2026-09-08",
        quoteAmount: 12480.5,
        abbOrderNumber: "ABB-7742887",
        abbOrderDate: "2026-09-12",
        abbOrderAmount: 12480.5,
        eligibleOrderAmount: 12480.5,
        pointValue: 12481,
        status: "approved",
    },
    {
        id: "q-104633",
        quoteNumber: "Q-104633",
        quoteCreatedDate: "2026-09-11",
        quoteAmount: 7915,
        abbOrderNumber: "ABB-7743540",
        abbOrderDate: "2026-09-14",
        abbOrderAmount: 7915,
        eligibleOrderAmount: 6200,
        pointValue: 6200,
        status: "pending",
    },
    {
        id: "q-104701",
        quoteNumber: "Q-104701",
        quoteCreatedDate: "2026-09-14",
        quoteAmount: 132600,
        status: "pending",
    },
    {
        id: "q-104712",
        quoteNumber: "Q-104712",
        quoteCreatedDate: "2026-09-15",
        quoteAmount: 3410.75,
        status: "pending",
    },
    {
        id: "q-104488",
        quoteNumber: "Q-104488",
        quoteCreatedDate: "2026-08-21",
        quoteAmount: 21900,
        abbOrderNumber: "ABB-7738115",
        abbOrderDate: "2026-08-28",
        abbOrderAmount: 19750,
        eligibleOrderAmount: 0,
        pointValue: 0,
        status: "rejected",
    },
    {
        id: "q-104455",
        quoteNumber: "Q-104455",
        quoteCreatedDate: "2026-08-14",
        quoteAmount: 64300,
        abbOrderNumber: "ABB-7736902",
        abbOrderDate: "2026-08-19",
        abbOrderAmount: 64300,
        eligibleOrderAmount: 58100,
        pointValue: 58100,
        status: "approved",
    },
    {
        id: "q-104402",
        quoteNumber: "Q-104402",
        quoteCreatedDate: "2026-08-03",
        quoteAmount: 9260,
        abbOrderNumber: "ABB-7735244",
        abbOrderDate: "2026-08-07",
        abbOrderAmount: 9260,
        eligibleOrderAmount: 9260,
        pointValue: 9260,
        status: "approved",
    },
];

/** Enough rows to exercise pagination and cross-page selection. */
const manySubmissions: SalesSubmission[] = [
    ...submissions,
    ...Array.from({ length: 22 }, (_, index) => {
        const day = String((index % 27) + 1).padStart(2, "0");
        const month = String((index % 6) + 1).padStart(2, "0");
        const quoteAmount = 5000 + index * 1830.25;
        const isOrdered = index % 4 !== 0;
        const eligibleOrderAmount = Math.round(quoteAmount * 0.88);

        return {
            id: `q-1042${String(index).padStart(2, "0")}`,
            quoteNumber: `Q-1042${String(index).padStart(2, "0")}`,
            quoteCreatedDate: `2026-${month}-${day}`,
            quoteAmount,
            abbOrderNumber: isOrdered ? `ABB-77${30000 + index * 137}` : undefined,
            abbOrderDate: isOrdered ? `2026-${month}-${day}` : undefined,
            abbOrderAmount: isOrdered ? quoteAmount : undefined,
            eligibleOrderAmount: isOrdered ? eligibleOrderAmount : undefined,
            pointValue: isOrdered ? eligibleOrderAmount : undefined,
            status: (["approved", "pending", "rejected"] as const)[index % 3],
        } satisfies SalesSubmission;
    }),
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Tables/Sales Submissions",
    component: SalesSubmissionsTable,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onSelectionChange: { action: "onSelectionChange" },
    },
} satisfies Meta<typeof SalesSubmissionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Sortable columns, search across quote and order numbers, a status filter, and checkbox selection. */
export const Default: Story = {
    args: {
        submissions,
        description: "Quotes you have submitted and the points they earned.",
    },
};

/** Two rows start out selected, so the selected-count bar is visible. */
export const WithSelectedRows: Story = {
    args: {
        submissions,
        defaultSelectedIds: ["q-104582", "q-104610"],
    },
};

/** A bulk action rendered in the selected-count bar, next to Clear selection. */
export const WithBulkAction: Story = {
    args: {
        submissions,
        defaultSelectedIds: ["q-104582"],
        selectionActions: (
            <Button color="secondary" size="sm" iconLeading={Download01}>
                Export
            </Button>
        ),
    },
};

/** Thirty rows at five per page. Selections are kept as you move between pages. */
export const Paginated: Story = {
    args: {
        submissions: manySubmissions,
        description: "Page through every submission in the current programme year.",
        defaultPageSize: 5,
        rowsPerPageOptions: [5, 10, 25, 50],
    },
};

/** With nothing submitted yet, the table falls back to its empty state. */
export const Empty: Story = {
    args: {
        submissions: [],
    },
};

/** Selection owned by the consumer through `selectedIds` and `onSelectionChange`. */
export const ControlledSelection: Story = {
    args: {
        submissions,
    },
    render: (args) => {
        const [selectedIds, setSelectedIds] = useState<string[]>([]);

        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm text-tertiary">
                    Selected quotes: <span className="font-medium text-primary">{selectedIds.length > 0 ? selectedIds.join(", ") : "none"}</span>
                </p>
                <SalesSubmissionsTable {...args} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
            </div>
        );
    },
};
