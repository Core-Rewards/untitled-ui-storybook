import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAdRewardsTheme } from "@/components/adrewards/with-ad-rewards-theme";
import { SupplierShowcase } from "./supplier-showcase";
import { SupplierSphere } from "./supplier-sphere";
import { sampleSuppliers } from "./supplier-sample-data";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Suppliers/SupplierShowcase",
    component: SupplierShowcase,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Home page card for participating suppliers. A random set of logos rides a slowly turning sphere; hovering a logo stops the spin and enlarges it. The sphere pauses itself off screen, has a pause button, and holds still for viewers who prefer reduced motion.",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [withAdRewardsTheme],
    argTypes: {
        maxLogos: { control: { type: "range", min: 12, max: 60, step: 2 } },
        speed: { control: { type: "range", min: 2, max: 30, step: 1 } },
    },
    args: {
        headline: "Earn with the brands you already sell",
        description: "Hundreds of manufacturers across our Electrical, Industrial, HVAC and Plumbing divisions reward you for every qualifying sale.",
        suppliers: sampleSuppliers,
        viewAllHref: "#participating-suppliers",
        maxLogos: 40,
        speed: 9,
    },
} satisfies Meta<typeof SupplierShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Hover a logo to stop the spin. */
export const Default: Story = {};

/** Without the supplier and division counts. */
export const WithoutStats: Story = {
    args: { showStats: false },
};

/** Only the first set of logos, no cycling through the full list. */
export const FixedSet: Story = {
    args: { cycle: false },
};

/** A smaller, airier sphere. */
export const FewerLogos: Story = {
    args: { maxLogos: 20 },
};

/** The sphere on its own, for placing elsewhere. */
export const SphereOnly: Story = {
    render: (args) => (
        <div className="mx-auto max-w-120 p-8">
            <SupplierSphere suppliers={args.suppliers} maxLogos={args.maxLogos} speed={args.speed} />
        </div>
    ),
};
