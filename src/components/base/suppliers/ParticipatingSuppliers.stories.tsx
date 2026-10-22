import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "@/components/base/app-shell/app-shell";
import { sampleAccountMenuItems, sampleBrand, sampleHeaderActions, sampleNavItems } from "@/components/base/app-shell/app-shell-sample-data";
import { ParticipatingSuppliers } from "./participating-suppliers";
import { sampleSuppliers } from "./supplier-sample-data";
import { DEFAULT_SUPPLIER_FILTERS } from "./supplier-utils";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Suppliers/ParticipatingSuppliers",
    component: ParticipatingSuppliers,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The Participating Suppliers page body. One card per supplier (208 from 234 division listings), A–Z headings with a jump bar, and a toolbar that stays pinned while the grid scrolls. Search ignores case, accents and punctuation, and also matches division names.",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: { onFiltersChange: { action: "onFiltersChange" } },
    args: {
        suppliers: sampleSuppliers,
    },
} satisfies Meta<typeof ParticipatingSuppliers>;

export default meta;
type Story = StoryObj<typeof meta>;

const Shell = ({ children }: { children: ReactNode }) => (
    <AppShell
        sidebar={{ brand: sampleBrand, items: sampleNavItems, activeId: "suppliers", pointsBalance: 34449844 }}
        header={{ actions: sampleHeaderActions, accountMenuItems: sampleAccountMenuItems }}
    >
        {children}
    </AppShell>
);

// ─── Stories ──────────────────────────────────────────────────────────────────

/** The full page inside the app shell. Narrow the viewport to see the sidebar move into a drawer. */
export const FullPage: Story = {
    render: (args) => (
        <Shell>
            <ParticipatingSuppliers {...args} />
        </Shell>
    ),
};

/** One flat A–Z grid without letter headings. */
export const Ungrouped: Story = {
    args: { groupByLetter: false },
    render: FullPage.render,
};

/** Opened on HVAC promotions, as a deep link from a promotion email might. */
export const StartFiltered: Story = {
    args: { defaultFilters: { ...DEFAULT_SUPPLIER_FILTERS, division: "HVAC", promotionsOnly: true } },
    render: FullPage.render,
};

export const Loading: Story = {
    args: { isLoading: true },
    render: FullPage.render,
};

/** A search with no results offers a way back. */
export const NoResults: Story = {
    args: { defaultFilters: { ...DEFAULT_SUPPLIER_FILTERS, query: "acme widgets" } },
    render: FullPage.render,
};

/** The page body alone, without the shell. */
export const WithoutShell: Story = {
    args: { stickyToolbar: false },
    render: (args) => (
        <div className="p-4 md:p-8">
            <ParticipatingSuppliers {...args} />
        </div>
    ),
};
