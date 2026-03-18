import type { FC } from "react";
import type { CartItemType } from "@/components/base/shopping-cart/cart-item";

interface OrderSummaryProps {
    /** Items in the order (read-only). */
    items: CartItemType[];
    /** Formatted total string displayed in points (e.g., "198,400 points"). */
    totalPoints: string;
}

export const OrderSummary: FC<OrderSummaryProps> = ({ items, totalPoints }) => (
    <div>
        <h2 className="text-base font-semibold text-primary">Order summary</h2>

        <ul role="list" className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
            {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="h-full w-full object-cover object-center"
                        />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 items-start justify-between gap-2">
                        <div className="text-sm">
                            <p className="font-semibold text-primary">{item.name}</p>
                            {item.color && <p className="mt-0.5 text-tertiary">{item.color}</p>}
                            {item.size && <p className="text-tertiary">{item.size}</p>}
                            <p className="mt-0.5 text-tertiary">Qty: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-primary">{item.price}</p>
                    </div>
                </li>
            ))}
        </ul>

        {/* Total row */}
        <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-4">
            <p className="text-base font-semibold text-primary">Total</p>
            <p className="text-base font-semibold text-primary">{totalPoints}</p>
        </div>
    </div>
);

export type { OrderSummaryProps };
