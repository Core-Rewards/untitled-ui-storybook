import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShoppingCart } from "./shopping-cart";
import { CartItem } from "./cart-item";
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

// ─── ShoppingCart Meta ────────────────────────────────────────────────────────

const meta = {
    title: "Base/ShoppingCart",
    component: ShoppingCart,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onRemoveItem: { action: "onRemoveItem" },
        onQuantityChange: { action: "onQuantityChange" },
        onCheckout: { action: "onCheckout" },
    },
} satisfies Meta<typeof ShoppingCart>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
    args: {
        items: sampleItems,
        subtotal: "198,400 points",
        continueShoppingHref: "#",
    },
};

export const Empty: Story = {
    args: {
        items: [],
        subtotal: "0 points",
        continueShoppingHref: "#",
    },
};

export const SingleItem: Story = {
    args: {
        items: [sampleItems[0]],
        subtotal: "131,000 points",
        continueShoppingHref: "#",
    },
};

// ─── CartItem Meta ────────────────────────────────────────────────────────────

const cartItemMeta = {
    title: "Base/ShoppingCart/CartItem",
    component: CartItem,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onRemove: { action: "onRemove" },
        onQuantityChange: { action: "onQuantityChange" },
    },
    decorators: [
        (Story: React.FC) => (
            <ul className="max-w-lg divide-y divide-gray-200 border-y border-gray-200">
                <Story />
            </ul>
        ),
    ],
} satisfies Meta<typeof CartItem>;

export const CartItemDefault: StoryObj<typeof cartItemMeta> = {
    render: (args) => <CartItem {...args} />,
    args: {
        item: sampleItems[0],
    },
};

export const CartItemWithVariants: StoryObj<typeof cartItemMeta> = {
    render: (args) => <CartItem {...args} />,
    args: {
        item: sampleItems[1],
    },
};
