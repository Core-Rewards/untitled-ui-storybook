import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "react-aria-components";
import type { CartItemType } from "@/components/base/shopping-cart/cart-item";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";
import { AddressPickerModal } from "./address-picker-modal";
import { CheckoutPage } from "./checkout-page";
import type { CheckoutAddress } from "./checkout-types";
import { OrderSummary } from "./order-summary";

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

const sampleAddresses: CheckoutAddress[] = [
    {
        id: "addr-1",
        name: "Jane Smith",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        country: "United States",
    },
    {
        id: "addr-2",
        name: "Jane Smith",
        street: "456 Oak Ave, Apt 2B",
        city: "Chicago",
        state: "IL",
        zip: "60601",
        country: "United States",
    },
    {
        id: "addr-3",
        name: "Jane Smith",
        street: "789 Elm Dr",
        city: "Naperville",
        state: "IL",
        zip: "60540",
        country: "United States",
    },
    {
        id: "addr-4",
        name: "Jane Smith",
        street: "321 Willow Ln",
        city: "Evanston",
        state: "IL",
        zip: "60201",
        country: "United States",
    },
    {
        id: "addr-5",
        name: "Jane Smith",
        street: "88 Lakeshore Blvd",
        city: "Waukegan",
        state: "IL",
        zip: "60085",
        country: "United States",
    },
    {
        id: "addr-6",
        name: "Jane Smith",
        street: "500 Maple Ave, Suite 300",
        city: "Downers Grove",
        state: "IL",
        zip: "60515",
        country: "United States",
    },
    {
        id: "addr-7",
        name: "Jane Smith",
        street: "1200 Harlem Ave",
        city: "Berwyn",
        state: "IL",
        zip: "60402",
        country: "United States",
    },
    {
        id: "addr-8",
        name: "Jane Smith",
        street: "77 Riverside Dr",
        city: "Elgin",
        state: "IL",
        zip: "60120",
        country: "United States",
    },
];

// ─── CheckoutPage Meta ────────────────────────────────────────────────────────

const meta = {
    title: "Base/Checkout",
    component: CheckoutPage,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onAddAddress: { action: "onAddAddress" },
        onConfirmOrder: { action: "onConfirmOrder" },
    },
} satisfies Meta<typeof CheckoutPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── CheckoutPage Stories ─────────────────────────────────────────────────────

/** Full checkout with multiple saved addresses. Click "Change" to open the address picker modal. */
export const Default: Story = {
    args: {
        items: sampleItems,
        totalPoints: "198,400 points",
        savedAddresses: sampleAddresses,
    },
};

/** Only one address on file — "Change" link is still shown but the modal will have a single option. */
export const SingleSavedAddress: Story = {
    args: {
        items: sampleItems,
        totalPoints: "198,400 points",
        savedAddresses: [sampleAddresses[0]],
    },
};

/** No addresses on file — shows empty state and disables Confirm Order. */
export const NoSavedAddresses: Story = {
    args: {
        items: sampleItems,
        totalPoints: "198,400 points",
        savedAddresses: [],
    },
};

/** Confirm Order button in loading state after the user submits. */
export const Confirming: Story = {
    args: {
        items: sampleItems,
        totalPoints: "198,400 points",
        savedAddresses: sampleAddresses,
        isConfirming: true,
    },
};

// ─── AddressPickerModal ────────────────────────────────────────────────────────

const addressPickerModalMeta = {
    title: "Base/Checkout/AddressPickerModal",
    component: AddressPickerModal,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta<typeof AddressPickerModal>;

/** Interactive modal — open and select an address. Demonstrates scrolling with multiple entries. */
export const AddressPickerModalDefault: StoryObj<typeof addressPickerModalMeta> = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        const [selectedId, setSelectedId] = useState("addr-1");
        return (
            <div>
                <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-primary shadow-xs hover:bg-gray-50"
                    onClick={() => setIsOpen(true)}
                >
                    Open Address Picker
                </button>
                <p className="mt-3 text-sm text-tertiary">
                    Selected: {sampleAddresses.find((a) => a.id === selectedId)?.street}
                </p>
                <AddressPickerModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    addresses={sampleAddresses}
                    selectedId={selectedId}
                    onConfirm={(id) => setSelectedId(id)}
                />
            </div>
        );
    },
    args: {} as never,
};

// ─── OrderSummary ─────────────────────────────────────────────────────────────

const orderSummaryMeta = {
    title: "Base/Checkout/OrderSummary",
    component: OrderSummary,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta<typeof OrderSummary>;

export const OrderSummaryDefault: StoryObj<typeof orderSummaryMeta> = {
    render: (args) => (
        <div className="max-w-lg">
            <OrderSummary {...args} />
        </div>
    ),
    args: {
        items: sampleItems,
        totalPoints: "198,400 points",
    },
};

// ─── AddressForm ──────────────────────────────────────────────────────────────

const addressFormMeta = {
    title: "Base/Checkout/AddressForm",
    component: AddressForm,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
    argTypes: {
        onSave: { action: "onSave" },
        onCancel: { action: "onCancel" },
    },
} satisfies Meta<typeof AddressForm>;

/** Empty form — for adding a new address. */
export const AddressFormEmpty: StoryObj<typeof addressFormMeta> = {
    render: (args) => (
        <div className="max-w-lg rounded-xl border border-gray-200 p-6">
            <AddressForm {...args} />
        </div>
    ),
    args: {},
};

/** Pre-filled form — for editing an existing address. */
export const AddressFormPrefilled: StoryObj<typeof addressFormMeta> = {
    render: (args) => (
        <div className="max-w-lg rounded-xl border border-gray-200 p-6">
            <AddressForm {...args} />
        </div>
    ),
    args: {
        initialValues: sampleAddresses[0],
        onCancel: undefined, // supplied via argTypes action
    },
};

// ─── AddressCard ──────────────────────────────────────────────────────────────

const addressCardMeta = {
    title: "Base/Checkout/AddressCard",
    component: AddressCard,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
    argTypes: {
        onEdit: { action: "onEdit" },
        onDelete: { action: "onDelete" },
    },
} satisfies Meta<typeof AddressCard>;

/** Selected state — wrapped in the required RadioGroup context. */
export const AddressCardSelected: StoryObj<typeof addressCardMeta> = {
    render: (args) => (
        <div className="max-w-lg">
            <RadioGroup aria-label="Select address" defaultValue="addr-1">
                <AddressCard {...args} />
            </RadioGroup>
        </div>
    ),
    args: {
        address: sampleAddresses[0],
    },
};

/** Unselected state. */
export const AddressCardUnselected: StoryObj<typeof addressCardMeta> = {
    render: (args) => (
        <div className="max-w-lg">
            <RadioGroup aria-label="Select address" defaultValue="">
                <AddressCard {...args} />
            </RadioGroup>
        </div>
    ),
    args: {
        address: sampleAddresses[1],
    },
};

/** Multiple cards in a group — the natural in-context usage. */
export const AddressCardGroup: StoryObj<typeof addressCardMeta> = {
    render: (args) => (
        <div className="max-w-lg space-y-3">
            <RadioGroup aria-label="Select address" defaultValue="addr-1">
                {sampleAddresses.map((address) => (
                    <AddressCard key={address.id} {...args} address={address} />
                ))}
            </RadioGroup>
        </div>
    ),
    args: {
        address: sampleAddresses[0],
    },
};
