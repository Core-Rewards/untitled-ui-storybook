import { useState } from "react";
import type { FC } from "react";
import { Button as SpinButton, Group, Input as NumberInput, Label, NumberField } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export type CartItemType = {
    /** Unique identifier for the cart item. */
    id: string;
    /** Name of the product. */
    name: string;
    /** Color variant of the product. */
    color: string;
    /** Size variant of the product. */
    size: string;
    /** Quantity of this item in the cart. */
    quantity: number;
    /** Formatted price string (e.g., "$32.00"). */
    price: string;
    /** Source URL for the product image. */
    imageSrc: string;
    /** Alt text for the product image. */
    imageAlt: string;
};

interface CartItemProps {
    /** The cart item data to display. */
    item: CartItemType;
    /** Called with the item's id when the user clicks Remove. */
    onRemove?: (id: string) => void;
    /** Called with the item's id and the new quantity when the user changes quantity. */
    onQuantityChange?: (id: string, quantity: number) => void;
}

const spinButtonStyles = cx(
    "flex h-full w-8 shrink-0 items-center justify-center text-base leading-none text-tertiary",
    "transition-colors duration-100 hover:bg-gray-50",
    "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]",
    "disabled:cursor-not-allowed disabled:text-fg-disabled",
);

export const CartItem: FC<CartItemProps> = ({ item, onRemove, onQuantityChange }) => {
    const [quantity, setQuantity] = useState(item.quantity);

    const handleQuantityChange = (qty: number) => {
        setQuantity(qty);
        onQuantityChange?.(item.id, qty);
    };

    return (
        <li className="flex py-6">
            {/* Product image */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <img
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    className="h-full w-full object-cover object-center"
                />
            </div>

            {/* Product details */}
            <div className="ml-4 flex flex-1 flex-col">
                {/* Name and price row */}
                <div className="flex justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-primary">{item.name}</h3>
                        {item.color && <p className="mt-1 text-sm text-tertiary">{item.color}</p>}
                        {item.size && <p className="text-sm text-tertiary">{item.size}</p>}
                    </div>
                    <p className="ml-4 text-sm font-semibold text-primary">{item.price}</p>
                </div>

                {/* Quantity stepper */}
                <div className="mt-3">
                    <NumberField
                        value={quantity}
                        minValue={1}
                        onChange={handleQuantityChange}
                    >
                        <Label className="sr-only">Quantity</Label>
                        <Group className="flex h-8 w-max items-center overflow-hidden rounded-lg border border-gray-200">
                            <SpinButton slot="decrement" className={cx(spinButtonStyles, "border-r border-gray-200")}>
                                −
                            </SpinButton>
                            <NumberInput className="w-10 bg-transparent text-center text-sm font-medium text-primary outline-none" />
                            <SpinButton slot="increment" className={cx(spinButtonStyles, "border-l border-gray-200")}>
                                +
                            </SpinButton>
                        </Group>
                    </NumberField>
                </div>

                {/* Remove row */}
                <div className="mt-3 flex flex-1 items-end justify-end">
                    <Button color="link-color" size="sm" onClick={() => onRemove?.(item.id)}>
                        Remove
                    </Button>
                </div>
            </div>
        </li>
    );
};
