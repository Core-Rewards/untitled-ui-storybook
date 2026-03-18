import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CartItemType } from "@/components/base/shopping-cart/cart-item";
import type { CheckoutAddress } from "./checkout-types";
import { OrderConfirmation } from "./order-confirmation";

// ─── Sample Data ──────────────────────────────────────────────────────────────

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

const sampleAddress: CheckoutAddress = {
    id: "addr-1",
    name: "Jane Smith",
    street: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip: "62701",
    country: "United States",
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Checkout/OrderConfirmation",
    component: OrderConfirmation,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onContinueShopping: { action: "onContinueShopping" },
    },
} satisfies Meta<typeof OrderConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Full order confirmation with multiple items and a customer email address. */
export const Default: Story = {
    args: {
        orderNumber: "ORD-829341",
        dateOrdered: "March 16, 2026",
        shippingAddress: sampleAddress,
        items: sampleItems,
        totalPoints: "198,400 points",
        customerEmail: "jane.smith@example.com",
        continueShoppingHref: "#",
    },
};

/** Single-item order — "Item ordered" label (singular). */
export const SingleItem: Story = {
    args: {
        orderNumber: "ORD-004521",
        dateOrdered: "March 16, 2026",
        shippingAddress: sampleAddress,
        items: [sampleItems[0]],
        totalPoints: "131,000 points",
        customerEmail: "jane.smith@example.com",
        continueShoppingHref: "#",
    },
};

/** No customer email provided — falls back to the generic confirmation message. */
export const NoEmail: Story = {
    args: {
        orderNumber: "ORD-117802",
        dateOrdered: "March 16, 2026",
        shippingAddress: sampleAddress,
        items: sampleItems,
        totalPoints: "198,400 points",
        continueShoppingHref: "#",
    },
};
