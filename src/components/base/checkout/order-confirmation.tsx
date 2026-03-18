import type { FC } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { CartItemType } from "@/components/base/shopping-cart/cart-item";
import type { CheckoutAddress } from "./checkout-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderConfirmationData = {
    /** Order reference number (e.g. "ORD-123456"). */
    orderNumber: string;
    /** Human-readable date string (e.g. "March 15, 2026"). */
    dateOrdered: string;
    /** The shipping address selected at checkout. */
    shippingAddress: CheckoutAddress;
    /** Items included in this order. */
    items: CartItemType[];
    /** Formatted order total in points (e.g. "198,400 points"). */
    totalPoints: string;
    /** Customer email address shown in the confirmation step message. */
    customerEmail?: string;
};

interface OrderConfirmationProps extends OrderConfirmationData {
    /** Called when the user clicks "Continue Shopping". Omit if using continueShoppingHref. */
    onContinueShopping?: () => void;
    /** Renders "Continue Shopping" as an anchor when provided. */
    continueShoppingHref?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** A label → value row used inside the Order Details card. */
const DetailRow: FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-tertiary">{label}</span>
        <span className="font-medium text-primary">{value}</span>
    </div>
);

/** A numbered step used in the "What to expect next" section. */
const Step: FC<{ number: 1 | 2; title: string; description: string }> = ({
    number,
    title,
    description,
}) => (
    <div className="flex gap-4">
        <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-sm font-bold text-white"
        >
            {number}
        </div>
        <div className="pt-0.5">
            <p className="text-sm font-semibold text-primary">{title}</p>
            <p className="mt-1 text-sm text-tertiary">{description}</p>
        </div>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const OrderConfirmation: FC<OrderConfirmationProps> = ({
    orderNumber,
    dateOrdered,
    shippingAddress,
    items,
    totalPoints,
    customerEmail,
    onContinueShopping,
    continueShoppingHref,
}) => {
    const emailLine = customerEmail
        ? `A confirmation email is on its way to ${customerEmail}.`
        : "A confirmation email is on its way to the address on file.";

    const itemLabel = items.length === 1 ? "Item ordered" : "Items ordered";

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">

            {/* ── Success hero ─────────────────────────────────────────────── */}
            <div className="mb-8 text-center">
                {/* Animated success circle */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
                    <svg
                        className="h-8 w-8 text-success-600"
                        viewBox="0 0 32 32"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M6 16.5L12.5 23L26 9"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <h1 className="text-display-sm font-bold text-primary">Order Successful!</h1>
                <p className="mt-2 text-sm text-tertiary">
                    Thank you for your order. We're getting it ready for you.
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-secondary">
                    Order #{orderNumber}
                </p>
            </div>

            {/* ── Order Details card ───────────────────────────────────────── */}
            <div className="overflow-hidden rounded-xl border border-gray-200">

                {/* Metadata: number + date */}
                <div className="space-y-3 px-6 py-5">
                    <h2 className="text-sm font-semibold text-primary">Order details</h2>
                    <DetailRow label="Order number" value={`#${orderNumber}`} />
                    <DetailRow label="Date ordered" value={dateOrdered} />
                </div>

                {/* Shipping address */}
                <div className="border-t border-gray-200 px-6 py-5">
                    <p className="mb-3 text-sm font-semibold text-primary">Shipping to</p>
                    <div className="text-sm leading-relaxed">
                        <p className="font-medium text-secondary">{shippingAddress.name}</p>
                        <p className="text-tertiary">{shippingAddress.street}</p>
                        <p className="text-tertiary">
                            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                        </p>
                        <p className="text-tertiary">{shippingAddress.country}</p>
                    </div>
                </div>

                {/* Items list */}
                <div className="border-t border-gray-200 px-6 py-5">
                    <p className="mb-4 text-sm font-semibold text-primary">{itemLabel}</p>
                    <ul role="list" className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
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
                                        {item.color && (
                                            <p className="mt-0.5 text-tertiary">{item.color}</p>
                                        )}
                                        {item.size && (
                                            <p className="text-tertiary">{item.size}</p>
                                        )}
                                        <p className="mt-0.5 text-tertiary">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold text-primary">
                                        {item.price}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-5">
                    <span className="text-base font-semibold text-primary">Total</span>
                    <span className="text-base font-semibold text-primary">{totalPoints}</span>
                </div>
            </div>

            {/* ── What to expect next ──────────────────────────────────────── */}
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 px-6 py-5">
                <h2 className="mb-5 text-sm font-semibold text-primary">What to expect next</h2>

                <div className="space-y-5">
                    <Step
                        number={1}
                        title="Confirmation email"
                        description={emailLine}
                    />

                    <div className="border-t border-gray-100" />

                    <Step
                        number={2}
                        title="Shipping notification"
                        description="Once your item(s) have shipped, you'll receive a shipping confirmation email with your tracking number so you can follow your order every step of the way."
                    />
                </div>
            </div>

            {/* ── Continue Shopping ────────────────────────────────────────── */}
            <div className="mt-8 flex justify-center">
                <Button
                    color="link-color"
                    size="sm"
                    href={continueShoppingHref}
                    onClick={onContinueShopping}
                    iconTrailing={ArrowRight}
                >
                    Continue Shopping
                </Button>
            </div>
        </div>
    );
};

export type { OrderConfirmationProps };
