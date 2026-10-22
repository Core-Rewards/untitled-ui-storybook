import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SupplierFilters } from "./supplier-filters";
import { sampleSuppliers } from "./supplier-sample-data";
import type { SupplierFilterState } from "./supplier-types";
import { DEFAULT_SUPPLIER_FILTERS, countSupplierFilters } from "./supplier-utils";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Suppliers/SupplierFilters",
    component: SupplierFilters,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "Division pills, promotion and qualifying-product toggles, and search. Each option shows how many suppliers it would leave, worked out with the other filters applied; a toggle that would leave none is disabled.",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: { onChange: { action: "onChange" } },
    args: {
        value: DEFAULT_SUPPLIER_FILTERS,
        onChange: () => {},
    },
} satisfies Meta<typeof SupplierFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = ({ initial, showCounts = true }: { initial: SupplierFilterState; showCounts?: boolean }) => {
    const [value, setValue] = useState(initial);
    return <SupplierFilters value={value} onChange={setValue} counts={showCounts ? countSupplierFilters(sampleSuppliers, value) : undefined} />;
};

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Wired to the sample suppliers, so the counts update as you go. */
export const Playground: Story = {
    render: () => <Interactive initial={DEFAULT_SUPPLIER_FILTERS} />,
};

/** HVAC suppliers running a promotion. */
export const Filtered: Story = {
    render: () => <Interactive initial={{ ...DEFAULT_SUPPLIER_FILTERS, division: "HVAC", promotionsOnly: true }} />,
};

/** Without counts, e.g. while results load. */
export const WithoutCounts: Story = {
    render: () => <Interactive initial={DEFAULT_SUPPLIER_FILTERS} showCounts={false} />,
};
