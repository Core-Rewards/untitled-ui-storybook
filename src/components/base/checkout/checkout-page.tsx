import { useState } from "react";
import type { FC } from "react";
import { Button } from "@/components/base/buttons/button";
import type { CartItemType } from "@/components/base/shopping-cart/cart-item";
import { AddressPickerModal } from "./address-picker-modal";
import type { AddressFormValues } from "./address-form";
import { AddressForm } from "./address-form";
import { OrderSummary } from "./order-summary";
import type { CheckoutAddress } from "./checkout-types";

interface CheckoutPageProps {
    /** Items in the cart — displayed read-only in the order summary. */
    items: CartItemType[];
    /** Formatted total points string (e.g., "198,400 points"). */
    totalPoints: string;
    /** Previously saved addresses. The first entry is treated as the last used. */
    savedAddresses: CheckoutAddress[];
    /**
     * Called with the fully-formed new address (including a generated `id`)
     * when the user saves a new address via the inline form.
     */
    onAddAddress?: (address: CheckoutAddress) => void;
    /** Called with the selected address `id` when the user confirms the order. */
    onConfirmOrder: (selectedAddressId: string) => void;
    /** When true, shows a loading state on the Confirm Order button. */
    isConfirming?: boolean;
}

export const CheckoutPage: FC<CheckoutPageProps> = ({
    items,
    totalPoints,
    savedAddresses,
    onAddAddress,
    onConfirmOrder,
    isConfirming = false,
}) => {
    // Manage addresses locally so the inline form can add without requiring a parent re-render.
    const [addresses, setAddresses] = useState<CheckoutAddress[]>(savedAddresses);

    // Default to the first saved address (last used).
    const [selectedAddressId, setSelectedAddressId] = useState<string>(
        savedAddresses[0]?.id ?? "",
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<CheckoutAddress | null>(null);

    const handleSaveNew = (values: AddressFormValues) => {
        const newAddress: CheckoutAddress = { ...values, id: crypto.randomUUID() };
        setAddresses([newAddress]);
        setSelectedAddressId(newAddress.id);
        onAddAddress?.(newAddress);
    };

    const handleSaveEdit = (values: AddressFormValues) => {
        if (!editingAddress) return;
        const updated: CheckoutAddress = { ...values, id: editingAddress.id };
        setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? updated : a)));
        setEditingAddress(null);
    };

    const handleDelete = (id: string) => {
        const remaining = addresses.filter((a) => a.id !== id);
        setAddresses(remaining);
        if (selectedAddressId === id) setSelectedAddressId(remaining[0]?.id ?? "");
    };

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const lastUsedId = addresses[0]?.id;
    const canConfirm = !!selectedAddress && !editingAddress;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-center text-display-sm font-bold text-primary">Checkout</h1>

            {/* ── Shipping Address ── */}
            <section aria-label="Shipping address" className="mb-8">
                {/* Heading row with "Change" link */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-primary">Shipping address</h2>
                    {addresses.length > 0 && (
                        <Button
                            color="link-color"
                            size="sm"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Change
                        </Button>
                    )}
                </div>

                {/* No saved addresses — show the inline add form */}
                {addresses.length === 0 && (
                    <div className="rounded-xl border border-gray-200 p-6">
                        <AddressForm onSave={handleSaveNew} />
                    </div>
                )}

                {/* Inline edit form */}
                {editingAddress && (
                    <div className="rounded-xl border border-gray-200 p-6">
                        <p className="mb-4 text-sm font-semibold text-secondary">Edit address</p>
                        <AddressForm
                            initialValues={editingAddress}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingAddress(null)}
                        />
                    </div>
                )}

                {/* Single address display */}
                {selectedAddress && !editingAddress && (
                    <div className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                            {/* Address lines + "Last used" badge beneath */}
                            <div className="text-sm leading-relaxed">
                                <p className="font-semibold text-primary">{selectedAddress.name}</p>
                                <p className="text-tertiary">{selectedAddress.street}</p>
                                <p className="text-tertiary">
                                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
                                </p>
                                <p className="text-tertiary">{selectedAddress.country}</p>
                                {selectedAddressId === lastUsedId && (
                                    <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-secondary">
                                        Last used
                                    </span>
                                )}
                            </div>

                            {/* Edit / Delete actions */}
                            <div className="flex shrink-0 items-center gap-1 self-start">
                                <Button
                                    color="link-color"
                                    size="sm"
                                    onClick={() => setEditingAddress(selectedAddress)}
                                >
                                    Edit
                                </Button>
                                <span aria-hidden="true" className="text-sm text-gray-300">·</span>
                                <Button
                                    color="link-gray"
                                    size="sm"
                                    onClick={() => handleDelete(selectedAddress.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* ── Divider ── */}
            <div className="mb-8 border-t border-gray-200" />

            {/* ── Order Summary ── */}
            <section aria-label="Order summary" className="mb-8">
                <OrderSummary items={items} totalPoints={totalPoints} />
            </section>

            {/* ── Confirm Order ── */}
            <Button
                color="primary"
                size="lg"
                className="w-full"
                isDisabled={!canConfirm}
                isLoading={isConfirming}
                onClick={() => canConfirm && onConfirmOrder(selectedAddressId)}
            >
                Confirm Order
            </Button>

            {/* ── Address Picker Modal ── */}
            <AddressPickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                addresses={addresses}
                selectedId={selectedAddressId}
                onConfirm={(id) => setSelectedAddressId(id)}
            />
        </div>
    );
};

export type { CheckoutPageProps };
export type { CheckoutAddress } from "./checkout-types";
