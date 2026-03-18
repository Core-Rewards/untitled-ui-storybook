import { useState } from "react";
import type { FC } from "react";
import { ArrowRight, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { CartItem, type CartItemType } from "./cart-item";

export type { CartItemType };

interface CartDrawerProps {
    /** Initial items in the cart. */
    items: CartItemType[];
    /** Formatted subtotal string (e.g., "198,400 points"). */
    subtotal: string;
    /** Whether the drawer is currently open. */
    isOpen: boolean;
    /** Called when the drawer should close. */
    onClose: () => void;
    /** Called with the item's id when the user clicks Remove. */
    onRemoveItem?: (id: string) => void;
    /** Called with the item's id and new quantity when quantity changes. */
    onQuantityChange?: (id: string, quantity: number) => void;
    /** Called when the user clicks the Checkout button (non-link usage). */
    onCheckout?: () => void;
    /** When provided, the Checkout button renders as a link to this URL. */
    checkoutHref?: string;
    /** URL for the "Continue Shopping" link. Defaults to "#". */
    continueShoppingHref?: string;
}

export const CartDrawer: FC<CartDrawerProps> = ({
    items: initialItems,
    subtotal,
    isOpen,
    onClose,
    onRemoveItem,
    onQuantityChange,
    onCheckout,
    checkoutHref,
    continueShoppingHref = "#",
}) => {
    const [items, setItems] = useState<CartItemType[]>(initialItems);

    const handleRemove = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        onRemoveItem?.(id);
    };

    const isEmpty = items.length === 0;

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => { if (!open) onClose(); }}
            isDismissable
            className={cx(
                "fixed inset-0 z-50 flex justify-end bg-black/50",
                "transition-opacity duration-300",
                "data-[entering]:opacity-0 data-[exiting]:opacity-0",
            )}
        >
            <Modal
                className={cx(
                    "flex h-full w-[30vw] flex-col bg-white shadow-xl outline-none",
                    "transition-transform duration-300 ease-out",
                    "data-[entering]:translate-x-full data-[exiting]:translate-x-full",
                )}
            >
                <Dialog aria-label="Shopping cart" className="flex h-full flex-col outline-none">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-5">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-semibold text-primary">Your Cart</h2>
                            {!isEmpty && (
                                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-solid px-1.5 text-xs font-semibold leading-none text-white tabular-nums">
                                    {items.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close cart"
                            className={cx(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-tertiary",
                                "transition-colors duration-100 hover:bg-gray-50 hover:text-secondary",
                                "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2",
                            )}
                        >
                            <XClose size={20} />
                        </button>
                    </div>

                    {/* ── Scrollable item list ────────────────────────────── */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-4">
                        {isEmpty ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                                <p className="text-sm font-medium text-secondary">Your cart is empty</p>
                                <p className="text-sm text-tertiary">Add some items to get started.</p>
                            </div>
                        ) : (
                            <ul role="list" className="divide-y divide-gray-200">
                                {items.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onRemove={handleRemove}
                                        onQuantityChange={onQuantityChange}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* ── Sticky footer ───────────────────────────────────── */}
                    <div className="shrink-0 border-t border-gray-200 px-4 pb-8 pt-5">
                        {/* Subtotal row */}
                        <div className="flex items-center justify-between">
                            <p className="text-base font-semibold text-primary">Subtotal</p>
                            <p className="text-base font-semibold text-primary">{subtotal}</p>
                        </div>
                       
                    {/* Checkout CTA */}
                        <div className="mt-5">
                            {checkoutHref ? (
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="w-full"
                                    href={checkoutHref}
                                    isDisabled={isEmpty}
                                >
                                    Checkout
                                </Button>
                            ) : (
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="w-full"
                                    onClick={onCheckout}
                                    isDisabled={isEmpty}
                                >
                                    Checkout
                                </Button>
                            )}
                        </div>

                        {/* Continue shopping */}
                        <div className="mt-4 flex justify-center text-sm text-tertiary">
                            <p>
                                or{" "}
                                <Button
                                    color="link-color"
                                    size="sm"
                                    href={continueShoppingHref}
                                    iconTrailing={ArrowRight}
                                    onClick={onClose}
                                >
                                    Continue Shopping
                                </Button>
                            </p>
                        </div>
                    </div>

                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
