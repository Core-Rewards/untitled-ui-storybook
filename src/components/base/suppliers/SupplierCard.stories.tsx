import type { Meta, StoryObj } from "@storybook/react-vite";
import { SupplierCard, SupplierCardSkeleton } from "./supplier-card";
import { sampleSuppliers, supplierById } from "./supplier-sample-data";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Suppliers/SupplierCard",
    component: SupplierCard,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "One participating supplier. Division chips say where it participates, the promotion badge links to a live offer, and the footer shows either a qualifying product list or that every product earns. When a link exists in more than one division, the control opens a menu to pick one.",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="max-w-xs">
                <Story />
            </div>
        ),
    ],
    argTypes: {
        headingLevel: { control: "inline-radio", options: [2, 3, 4] },
        highlight: { control: "text" },
    },
    args: {
        supplier: supplierById("atkore"),
    },
} satisfies Meta<typeof SupplierCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Promotion and a qualifying product list, both in one division. */
export const Playground: Story = {};

/** No promotion, and every product earns points. */
export const AllProductsEarn: Story = {
    args: { supplier: supplierById("acuity-brands") },
};

/** In four divisions with a promotion in one. */
export const MultipleDivisions: Story = {
    args: { supplier: supplierById("milwaukee-tool") },
};

/** Promotion in IESD, qualifying products in ISD. Filtering to one division narrows the card to that listing. */
export const FilteredToDivision: Story = {
    args: {
        supplier: supplierById("klein-tools"),
        listings: supplierById("klein-tools").listings.filter((listing) => listing.division === "ISD"),
    },
};

/** Promotions in two divisions: the badge opens a menu to pick one. */
export const PromotionsInTwoDivisions: Story = {
    args: {
        supplier: {
            ...supplierById("diversitech"),
            listings: [
                { division: "HVAC", promotionHref: "#" },
                { division: "PLB", promotionHref: "#", qualifyingProductsHref: "#" },
            ],
        },
    },
};

/** No logo file, so the initials stand in. */
export const LogoFallback: Story = {
    args: { supplier: supplierById("ouellet") },
};

/** Only the networks the supplier has are shown; no website hides the button. */
export const FewLinks: Story = {
    args: {
        supplier: { ...supplierById("panduit"), socials: { linkedin: "#", youtube: "#" }, websiteHref: undefined },
    },
};

/** Search text is highlighted in the name. */
export const Highlighted: Story = {
    args: { supplier: supplierById("stanley-black-decker-dewalt"), highlight: "black deca" },
};

/** Long names clamp to two lines. */
export const LongName: Story = {
    args: { supplier: supplierById("hubbell-wiring-device-kellems") },
};

export const Skeleton: Story = {
    render: () => <SupplierCardSkeleton />,
};

/** Cards stretch to the tallest in a row, so footers line up. */
export const Grid: Story = {
    decorators: [
        (Story) => (
            <div className="max-w-6xl">
                <Story />
            </div>
        ),
    ],
    render: () => (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sampleSuppliers.slice(0, 8).map((supplier) => (
                <li key={supplier.id}>
                    <SupplierCard supplier={supplier} />
                </li>
            ))}
        </ul>
    ),
};
