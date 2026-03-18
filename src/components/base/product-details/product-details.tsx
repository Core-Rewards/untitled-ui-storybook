import { useCallback, useState } from "react";
import type { FC } from "react";
import { Button as SpinButton, Group, Input as NumberInput, Label, NumberField, Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductColor = {
    /** Unique identifier for this color option. */
    id: string;
    /** Display name shown next to the label (e.g. "Midnight Black"). */
    name: string;
    /** CSS color value for the swatch (e.g. "#1a1a1a"). */
    value: string;
};

export type ProductSize = {
    /** Unique identifier for this size option. */
    id: string;
    /** Display label (e.g. "S", "M", "XL", "Regular"). */
    label: string;
    /** Whether this size is currently in stock. Out-of-stock sizes are shown with a strikethrough and are unselectable. */
    inStock: boolean;
    /** Optional description shown below the label when rendered as a card. */
    description?: string;
};

export type ProductAvailability =
    | { type: "in-stock" }
    | { type: "out-of-stock" }
    | { type: "ships-in"; message: string };

export type ProductDetailsData = {
    /** Unique identifier for the product. */
    id: string;
    /** Product name displayed as the page heading. */
    name: string;
    /** Formatted points string (e.g. "131,000 points"). */
    points: string;
    /** Product description text shown below the CTAs. */
    description: string;
    /** Source URL for the product image. */
    imageSrc: string;
    /** Alt text for the product image. */
    imageAlt: string;
    /** Stock or shipping availability for this product. */
    availability: ProductAvailability;
    /** Available color options. Omit when the product has no color variant. */
    colors?: ProductColor[];
    /** Available size options. Omit when the product has no size variant. */
    sizes?: ProductSize[];
};

export interface ProductDetailsProps extends ProductDetailsData {
    /** Called when the user clicks "Add to Cart". Receives the selected variant IDs and quantity. */
    onAddToCart?: (options: { colorId?: string; sizeId?: string; quantity: number }) => void;
    /** Called when the user clicks the wishlist heart button. */
    onAddToWishlist?: () => void;
    /** Shows a loading spinner on "Add to Cart" while the action is in-flight. */
    isAddingToCart?: boolean;
    /** Renders the heart button in a filled / active (wishlisted) state. */
    isWishlisted?: boolean;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const spinButtonStyles = cx(
    "flex h-full w-10 shrink-0 items-center justify-center text-lg leading-none text-tertiary",
    "transition-colors duration-100 hover:bg-gray-50",
    "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]",
    "disabled:cursor-not-allowed disabled:text-fg-disabled",
);

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Availability indicator reused from the cart-item design. */
const AvailabilityBadge: FC<{ availability: ProductAvailability }> = ({ availability }) => {
    if (availability.type === "in-stock") {
        return (
            <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 shrink-0 text-success-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm text-tertiary">In stock</span>
            </div>
        );
    }

    if (availability.type === "out-of-stock") {
        return (
            <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 shrink-0 text-fg-disabled" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm text-tertiary">Out of stock</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 shrink-0 text-fg-disabled" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-tertiary">{availability.message}</span>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ProductDetails: FC<ProductDetailsProps> = ({
    name,
    points,
    description,
    imageSrc,
    imageAlt,
    availability,
    colors,
    sizes,
    onAddToCart,
    onAddToWishlist,
    isAddingToCart = false,
    isWishlisted = false,
}) => {
    const [selectedColorId, setSelectedColorId] = useState(colors?.[0]?.id ?? "");
    const [selectedSizeId, setSelectedSizeId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

    const selectedColor = colors?.find((c) => c.id === selectedColorId);

    // Memoised icon factory — only recreates when isWishlisted changes.
    // Using useCallback here to capture the dependency, accepting that React will
    // remount this simple SVG icon when the wishlisted state toggles.
    const HeartIcon = useCallback(
        ({ className }: { className?: string }) => (
            <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                {isWishlisted ? (
                    // Solid / filled heart
                    <path
                        fill="currentColor"
                        d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
                    />
                ) : (
                    // Outline heart
                    <path
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                )}
            </svg>
        ),
        [isWishlisted],
    );

    const handleWishlistClick = () => {
        setFloatingHearts((prev) => [...prev, Date.now()]);
        onAddToWishlist?.();
    };

    const handleAddToCart = () => {
        onAddToCart?.({
            colorId: selectedColorId || undefined,
            sizeId: selectedSizeId || undefined,
            quantity,
        });
    };

    return (
        <div className="mx-auto max-w-4xl">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">

                {/* ── Product image ────────────────────────────────────────── */}
                <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        className="h-full w-full object-cover object-center"
                    />
                </div>

                {/* ── Product details ──────────────────────────────────────── */}
                <div className="mt-8 lg:mt-0">

                    {/* Name */}
                    <h1 className="text-display-xs font-bold text-primary">{name}</h1>

                    {/* Points */}
                    <p className="mt-3 text-xl font-semibold text-brand-secondary">{points}</p>

                    {/* Availability */}
                    <div className="mt-3">
                        <AvailabilityBadge availability={availability} />
                    </div>

                    {/* ── Color picker ──────────────────────────────────── */}
                    {colors && colors.length > 0 && (
                        <div className="mt-6">
                            <RadioGroup
                                value={selectedColorId}
                                onChange={setSelectedColorId}
                                aria-label="Color"
                                orientation="horizontal"
                            >
                                <Label className="text-sm font-medium text-primary">
                                    Color
                                    {selectedColor && (
                                        <span className="ml-1 font-normal text-secondary">
                                            — {selectedColor.name}
                                        </span>
                                    )}
                                </Label>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {colors.map((color) => (
                                        <Radio
                                            key={color.id}
                                            value={color.id}
                                            aria-label={color.name}
                                            className={({ isSelected, isFocusVisible }) =>
                                                cx(
                                                    "relative h-8 w-8 cursor-pointer rounded-full outline-none transition-all duration-100",
                                                    isFocusVisible && "ring-2 ring-brand-solid ring-offset-1",
                                                    isSelected && "ring-2 ring-brand-solid ring-offset-2",
                                                )
                                            }
                                        >
                                            <span
                                                className="absolute inset-0 rounded-full border border-black/10"
                                                style={{ backgroundColor: color.value }}
                                            />
                                        </Radio>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* ── Size picker ───────────────────────────────────── */}
                    {sizes && sizes.length > 0 && (() => {
                        const hasDescriptions = sizes.some((s) => s.description);
                        return (
                            <div className="mt-6">
                                <RadioGroup
                                    value={selectedSizeId}
                                    onChange={setSelectedSizeId}
                                    aria-label="Size"
                                    orientation="horizontal"
                                >
                                    <Label className="text-sm font-medium text-primary">Size</Label>
                                    {hasDescriptions ? (
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            {sizes.map((size) => (
                                                <Radio
                                                    key={size.id}
                                                    value={size.id}
                                                    isDisabled={!size.inStock}
                                                    className={({ isSelected, isFocusVisible, isDisabled }) =>
                                                        cx(
                                                            "relative cursor-pointer rounded-xl border p-4 outline-none transition-colors duration-100",
                                                            isFocusVisible && "ring-2 ring-brand-solid ring-offset-1",
                                                            isSelected
                                                                ? "border-brand-solid bg-white"
                                                                : isDisabled
                                                                    ? "cursor-not-allowed border-gray-200 opacity-40"
                                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                                                        )
                                                    }
                                                >
                                                    {({ isSelected }) => (
                                                        <>
                                                            {isSelected && (
                                                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-solid">
                                                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                                                        <path d="M10 3L5 8.5L2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                            <span className="block text-sm font-semibold text-primary">{size.label}</span>
                                                            {size.description && (
                                                                <span className="mt-1 block text-sm text-tertiary">{size.description}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </Radio>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {sizes.map((size) => (
                                                <Radio
                                                    key={size.id}
                                                    value={size.id}
                                                    isDisabled={!size.inStock}
                                                    className={({ isSelected, isFocusVisible, isDisabled }) =>
                                                        cx(
                                                            "relative flex h-9 min-w-[2.5rem] cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium outline-none transition-colors duration-100",
                                                            isFocusVisible && "ring-2 ring-brand-solid ring-offset-1",
                                                            isSelected
                                                                ? "border-brand-solid bg-brand-50 text-brand-700"
                                                                : isDisabled
                                                                    ? "cursor-not-allowed border-gray-200 text-fg-disabled line-through"
                                                                    : "border-gray-200 text-secondary hover:border-gray-300 hover:bg-gray-50",
                                                        )
                                                    }
                                                >
                                                    {size.label}
                                                </Radio>
                                            ))}
                                        </div>
                                    )}
                                </RadioGroup>
                            </div>
                        );
                    })()}

                    {/* ── Quantity ──────────────────────────────────────── */}
                    <div className="mt-6">
                        <NumberField value={quantity} minValue={1} onChange={setQuantity}>
                            <Label className="text-sm font-medium text-primary">Quantity</Label>
                            <Group className="mt-3 flex h-10 w-max items-center overflow-hidden rounded-lg border border-gray-200">
                                <SpinButton slot="decrement" className={spinButtonStyles}>−</SpinButton>
                                <NumberInput className="w-12 bg-transparent text-center text-sm font-medium text-primary outline-none" />
                                <SpinButton slot="increment" className={cx(spinButtonStyles, "border-l border-gray-200")}>+</SpinButton>
                            </Group>
                        </NumberField>
                    </div>

                    {/* ── Add to Cart + Wishlist ─────────────────────────── */}
                    <div className="mt-8 flex gap-3">
                        <Button
                            color="primary"
                            size="lg"
                            className="flex-1"
                            isLoading={isAddingToCart}
                            isDisabled={availability.type === "out-of-stock"}
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </Button>
                        <div className="relative">
                            <Button
                                color="secondary"
                                size="lg"
                                iconLeading={HeartIcon}
                                className={isWishlisted ? "text-error-600" : undefined}
                                onClick={handleWishlistClick}
                                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            />
                            {floatingHearts.map((id) => (
                                <svg
                                    key={id}
                                    viewBox="0 0 24 24"
                                    className="pointer-events-none absolute text-error-600"
                                    style={{ left: "50%", top: "50%", width: "1.25rem", height: "1.25rem", animation: "float-heart 0.7s ease-out forwards" }}
                                    fill="currentColor"
                                    aria-hidden="true"
                                    onAnimationEnd={() => setFloatingHearts((prev) => prev.filter((h) => h !== id))}
                                >
                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                </svg>
                            ))}
                        </div>
                    </div>

                    {/* ── Description ───────────────────────────────────── */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h2 className="text-sm font-semibold text-primary">Description</h2>
                        <p className="mt-3 text-sm leading-relaxed text-secondary">{description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
