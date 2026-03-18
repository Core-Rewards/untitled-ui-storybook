import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShoppingBag01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CartDrawer } from "./cart-drawer";
import type { CartItemType } from "./cart-item";

// ─── Sample Data ─────────────────────────────────────────────────────────────

const sampleItems: CartItemType[] = [
    {
        id: "1",
        name: "Apple 13-inch MacBook Air - 512GB",
        color: "",
        size: "",
        quantity: 1,
        price: "131,000 points",
        imageSrc: "https://www.resourceurl.com/evault/037BE74E-0A81-456A-A31F-E9B514E9B286/7B95D226-E05D-440F-8281-ABED8A7AA86B/7B95D226-E05D-440F-8281-ABED8A7AA86B-hi.jpg",
        imageAlt: "Apple 13-inch MacBook Air - 512GB",
    },
    {
        id: "2",
        name: "Carhartt Men's Crowley Softshell Jacket",
        color: "Charcoal",
        size: "Large",
        quantity: 2,
        price: "12,300 points",
        imageSrc: "http://www.resourceurl.com/evault/A300B468-3A8B-4F8A-920B-36E9D2F00E0D/C17E5E63-B3FA-4A76-9EAA-58801D9AE579/ProductOptions/E1049E05-5620-4BD7-BD21-0AF501201746/E1049E05-5620-4BD7-BD21-0AF501201746-hi.jpg",
        imageAlt: "Carhartt Men's Crowley Softshell Jacket",
    },
    {
        id: "3",
        name: "TaylorMade Qi4D Driver",
        color: "Right Hand",
        size: "10.5 degree - Regular flex",
        quantity: 1,
        price: "55,100 points",
        imageSrc: "http://www.resourceurl.com/evault/214667F7-85B9-41DB-B560-206F5D90B849/9593D6E9-9921-4220-9AFD-4BBA91701E6F/ProductOptions/8ABB6CF8-1ED6-49FA-952E-875712916ADA/8ABB6CF8-1ED6-49FA-952E-875712916ADA-hi.jpg",
        imageAlt: "TaylorMade Qi4D Driver",
    },
];

// ─── Story Wrapper ────────────────────────────────────────────────────────────

/** Wraps CartDrawer with a trigger button so open/close state can be demoed. */
const DrawerDemo = (args: React.ComponentProps<typeof CartDrawer>) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex h-screen items-start justify-end bg-gray-50 p-6">
            <Button
                color="secondary"
                size="md"
                iconLeading={ShoppingBag01}
                onClick={() => setIsOpen(true)}
            >
                View Cart {args.items.length > 0 && `(${args.items.length})`}
            </Button>

            <CartDrawer
                {...args}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/ShoppingCart/CartDrawer",
    component: CartDrawer,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    argTypes: {
        onRemoveItem: { action: "onRemoveItem" },
        onQuantityChange: { action: "onQuantityChange" },
        onCheckout: { action: "onCheckout" },
    },
} satisfies Meta<typeof CartDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Default cart with items — click "View Cart" to open the drawer. */
export const Default: Story = {
    render: (args) => <DrawerDemo {...args} />,
    args: {
        items: sampleItems,
        subtotal: "198,400 points",
        continueShoppingHref: "#",
    },
};

/** Single item in the cart. */
export const SingleItem: Story = {
    render: (args) => <DrawerDemo {...args} />,
    args: {
        items: [sampleItems[0]],
        subtotal: "131,000 points",
        continueShoppingHref: "#",
    },
};

/** Empty cart — Checkout button is disabled and empty state is displayed. */
export const Empty: Story = {
    render: (args) => <DrawerDemo {...args} />,
    args: {
        items: [],
        subtotal: "0 points",
        continueShoppingHref: "#",
    },
};
