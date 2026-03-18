import { useState } from "react";
import type { FC } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CartItem, type CartItemType } from "./cart-item";

export type { CartItemType };

interface ShoppingCartProps {
    /** Initial items in the cart. */
    items: CartItemType[];
    /** Formatted subtotal string (e.g., "$96.00"). */
    subtotal: string;
    /** Called with the item's id when the user clicks Remove. */
    onRemoveItem?: (id: string) => void;
    /** Called with the item's id and the new quantity when the user changes quantity. */
    onQuantityChange?: (id: string, quantity: number) => void;
    /** Called when the user clicks the Checkout button (non-link usage). */
    onCheckout?: () => void;
    /** When provided, the Checkout button renders as a link to this URL. */
    checkoutHref?: string;
    /** URL for the "Continue Shopping" link. Defaults to "#". */
    continueShoppingHref?: string;
}

export const ShoppingCart: FC<ShoppingCartProps> = ({
    items: initialItems,
    subtotal,
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
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-8 text-center text-display-sm font-bold text-primary">
                Shopping Cart
            </h1>

            {/* Item list */}
            <div className="border-t border-gray-200">
                {isEmpty ? (
                    <p className="py-12 text-center text-sm text-tertiary">Your cart is empty.</p>
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

            {/* Subtotal and actions */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between">
                    <p className="text-base font-semibold text-primary">Subtotal</p>
                    <p className="text-base font-semibold text-primary">{subtotal}</p>
                </div>

                <div className="mt-6">
                    {checkoutHref ? (
                        <Button color="primary" size="lg" className="w-full" href={checkoutHref} isDisabled={isEmpty}>
                            Checkout
                        </Button>
                    ) : (
                        <Button color="primary" size="lg" className="w-full" onClick={onCheckout} isDisabled={isEmpty}>
                            Checkout
                        </Button>
                    )}
                </div>

                <div className="mt-4 flex justify-center text-sm text-tertiary">
                    <p>
                        or{" "}
                        <Button
                            color="link-color"
                            size="sm"
                            href={continueShoppingHref}
                            iconTrailing={ArrowRight}
                        >
                            Continue Shopping
                        </Button>
                    </p>
                </div>
            </div>
        </div>
    );
};
