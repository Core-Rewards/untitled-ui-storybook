import { useEffect, useState } from "react";
import type { FC } from "react";
import { Dialog, Modal, ModalOverlay, Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { CheckoutAddress } from "./checkout-types";

interface AddressPickerModalProps {
    /** Controls modal visibility. */
    isOpen: boolean;
    /** Called when the modal should close (Cancel, Escape, or backdrop click). */
    onClose: () => void;
    /** All saved addresses to choose from. */
    addresses: CheckoutAddress[];
    /** The currently active address id — pre-selected when the modal opens. */
    selectedId: string;
    /** Called with the chosen address id when the user clicks "Use this address". */
    onConfirm: (id: string) => void;
}

export const AddressPickerModal: FC<AddressPickerModalProps> = ({
    isOpen,
    onClose,
    addresses,
    selectedId,
    onConfirm,
}) => {
    const [pendingId, setPendingId] = useState(selectedId);

    // Re-sync the pending selection to the current active address each time the modal opens.
    useEffect(() => {
        if (isOpen) setPendingId(selectedId);
    }, [isOpen, selectedId]);

    const handleConfirm = () => {
        onConfirm(pendingId);
        onClose();
    };

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => { if (!open) onClose(); }}
            isDismissable
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
            <Modal className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl outline-none max-h-[420px]">
                <Dialog aria-label="Select a shipping address" className="flex min-h-0 flex-1 flex-col outline-none">
                    {/* ── Header ── */}
                    <div className="shrink-0 border-b border-gray-200 px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">Select a shipping address</h2>
                    </div>

                    {/* ── Scrollable address list ── */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <RadioGroup
                            value={pendingId}
                            onChange={setPendingId}
                            aria-label="Shipping addresses"
                            className="space-y-2"
                        >
                            {addresses.map((address) => (
                                <Radio
                                    key={address.id}
                                    value={address.id}
                                    className={({ isSelected, isFocusVisible }) =>
                                        cx(
                                            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 outline-none transition-colors duration-100",
                                            isFocusVisible && "ring-2 ring-brand-solid ring-offset-2",
                                            isSelected
                                                ? "border-brand-solid bg-brand-50"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                                        )
                                    }
                                >
                                    {({ isSelected }) => (
                                        <>
                                            {/* Custom radio dot */}
                                            <div
                                                aria-hidden="true"
                                                className={cx(
                                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-100",
                                                    isSelected
                                                        ? "border-brand-solid bg-brand-solid"
                                                        : "border-gray-300 bg-white",
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                                )}
                                            </div>

                                            {/* Condensed address: street, city, state */}
                                            <span className="text-sm text-primary">
                                                {address.street}, {address.city}, {address.state}
                                            </span>
                                        </>
                                    )}
                                </Radio>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex shrink-0 gap-3 border-t border-gray-200 px-6 py-4">
                        <Button color="secondary" size="md" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" size="md" className="flex-1" onClick={handleConfirm}>
                            Use this address
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
