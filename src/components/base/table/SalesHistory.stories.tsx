import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BarChart10 } from "@untitledui/icons";
import { AppShell } from "@/components/base/app-shell/app-shell";
import { sampleAccountMenuItems, sampleAccountName, sampleBrand, sampleHeaderActions, sampleNavItems } from "@/components/base/app-shell/app-shell-sample-data";
import { SalesHistoryTable } from "./sales-history-table";
import type { SalesHistoryTableProps } from "./sales-history-table";
import type { SalesRecord } from "./sales-history-types";
import { toMonthKey } from "./sales-history-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

/** Stories are pinned to October 2026, so January through September are the expected uploads. */
const CURRENT_MONTH = "2026-10";

/** Busier spring and early autumn, quieter in winter. */
const SEASONALITY = [0.72, 0.78, 0.94, 1.05, 1.12, 1.08, 0.96, 1.02, 1.14, 1.1, 0.92, 0.8];

const SUPPLIERS = [
    { name: "Northwind Electrical", base: 38000 },
    { name: "Summit Lighting", base: 24500 },
    { name: "Apex Controls", base: 17200 },
    { name: "Harbor Wire & Cable", base: 9800 },
];

/** Year-on-year growth, so the comparison columns have something to say. */
const GROWTH: Record<number, number> = { 2024: 0.86, 2025: 0.94, 2026: 1 };

/** Months that were never uploaded, to show the "Not uploaded" state. */
const MISSING_MONTHS = new Set(["2026-08", "2025-03"]);

/** A small, repeatable wobble so months do not look machine-made. */
const wobble = (seed: number) => {
    const noise = Math.sin(seed * 12.9898) * 43758.5453;
    return 0.88 + (noise - Math.floor(noise)) * 0.24;
};

const buildRecords = (bySupplier: boolean): SalesRecord[] =>
    [2024, 2025, 2026].flatMap((year) =>
        SEASONALITY.flatMap((season, index) => {
            const month = toMonthKey(year, index + 1);
            if (month >= CURRENT_MONTH || MISSING_MONTHS.has(month)) return [];

            // Uploads land a few days into the following month.
            const uploadedDate = `${toMonthKey(index === 11 ? year + 1 : year, index === 11 ? 1 : index + 2)}-0${(index % 6) + 2}`;
            const suppliers = bySupplier ? SUPPLIERS : [{ name: undefined, base: sum(SUPPLIERS.map((supplier) => supplier.base)) }];

            return suppliers.map((supplier, supplierIndex) => ({
                id: `${month}-${supplierIndex}`,
                month,
                supplier: supplier.name,
                amount: Math.round(supplier.base * season * GROWTH[year] * wobble(year * 100 + index * 7 + supplierIndex) * 100) / 100,
                uploadedDate,
            }));
        }),
    );

function sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
}

const supplierRecords = buildRecords(true);
const totalRecords = buildRecords(false);

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Tables/Sales History",
    component: SalesHistoryTable,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    args: {
        currentMonth: CURRENT_MONTH,
    },
    argTypes: {
        onYearChange: { action: "onYearChange" },
        defaultView: { control: "inline-radio", options: ["month", "supplier"] },
    },
} satisfies Meta<typeof SalesHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * A program that reports sales as one monthly total. Pick a year to see each month's sales,
 * its share of the year, the change from the month before and from the same month last year.
 */
export const Default: Story = {
    args: {
        records: totalRecords,
        description: "Your uploaded sales, month by month.",
    },
};

/**
 * A program that reports sales by supplier. The monthly view gains a supplier filter, and
 * the By supplier view totals the year for each supplier with its share and year-on-year change.
 */
export const BySupplier: Story = {
    args: {
        records: supplierRecords,
        description: "Your uploaded sales, month by month or by supplier.",
    },
};

/** Opens on the supplier breakdown. */
export const SupplierView: Story = {
    args: {
        records: supplierRecords,
        defaultView: "supplier",
    },
};

/** Suppliers down the side and months across the top, each cell shaded by its amount. */
export const GridView: Story = {
    args: {
        records: supplierRecords,
        defaultView: "grid",
    },
};

/** A monthly column chart above the table, with last year's totals marked on each month. */
export const WithChart: Story = {
    args: {
        records: totalRecords,
        showChart: true,
    },
};

/** The chart stacks each month by supplier, and follows the supplier filter in the monthly view. */
export const WithChartBySupplier: Story = {
    args: {
        records: supplierRecords,
        showChart: true,
    },
};

/** A full past year with every month uploaded. */
export const CompleteYear: Story = {
    args: {
        records: supplierRecords,
        defaultYear: 2024,
    },
};

/** Before the first upload, the table falls back to its empty state. */
export const Empty: Story = {
    args: {
        records: [],
    },
};

// ─── In the app shell ─────────────────────────────────────────────────────────

const navItems = [
    ...sampleNavItems.slice(0, 3),
    { id: "sales", label: "Sales History", href: "#", icon: BarChart10 },
    ...sampleNavItems.slice(3),
];

const SalesHistoryPage = (args: SalesHistoryTableProps) => (
    <AppShell
        sidebar={{
            brand: sampleBrand,
            items: navItems,
            activeId: "sales",
            accountName: sampleAccountName,
            pointsBalance: 34449844,
            accountMenuItems: sampleAccountMenuItems,
            onSignOut: fn(),
        }}
        header={{ actions: sampleHeaderActions }}
    >
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-display-xs font-semibold text-primary">Sales History</h1>
                <p className="text-md text-tertiary">See how your sales are tracking. New months appear here once your upload is processed.</p>
            </div>
            <SalesHistoryTable {...args} />
        </div>
    </AppShell>
);

/** The page as a participant sees it, for a program that uploads one total a month. */
export const InAppShell: Story = {
    parameters: { layout: "fullscreen" },
    args: {
        records: totalRecords,
        showChart: true,
        title: "Your sales",
    },
    render: (args) => <SalesHistoryPage {...args} />,
};

/** The page for a program that reports sales by supplier. */
export const InAppShellBySupplier: Story = {
    parameters: { layout: "fullscreen" },
    args: {
        records: supplierRecords,
        showChart: true,
        title: "Your sales",
    },
    render: (args) => <SalesHistoryPage {...args} />,
};
