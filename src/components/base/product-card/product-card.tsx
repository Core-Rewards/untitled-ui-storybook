import type { FC } from "react";
import { Link } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductType = {
    /** Unique identifier for the product. */
    id: string;
    /** Name of the product. */
    name: string;
    /** URL to link to when the product card is clicked. */
    href: string;
    /** Price or points display string (e.g. "131,000 points"). */
    points: string;
    /** Source URL for the product image. */
    imageSrc: string;
    /** Alt text for the product image. */
    imageAlt: string;
    /** Optional badge label shown over the image (e.g. "New", "Sale"). */
    badge?: string;
    /** Color variant for the badge. Defaults to "brand". */
    badgeColor?: "brand" | "success" | "error" | "warning" | "gray";
    /** Discounted points value. When set, `points` is shown with a strikethrough and this value is shown as the current price. */
    discountedPoints?: string;
};

export interface ProductCardProps {
    /** Product data to display. */
    product: ProductType;
    /** Additional class names applied to the root link element. */
    className?: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: "group block rounded-xl outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
    imageWrapper: "relative overflow-hidden rounded-xl",
    image: "aspect-square w-full bg-secondary object-cover transition duration-200 ease-linear group-hover:opacity-75 lg:aspect-7/8",
    badge: {
        base: "absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white",
        brand: "bg-brand-solid",
        success: "bg-success-solid",
        error: "bg-error-solid",
        warning: "bg-warning-solid",
        gray: "bg-fg-quaternary",
    },
    name: "mt-4 text-sm font-medium text-secondary",
    points: "mt-1 text-md font-semibold text-primary",
    pointsDiscounted: "mt-1 flex items-baseline gap-2",
    pointsOriginal: "text-md font-semibold text-tertiary line-through",
    pointsSale: "text-md font-semibold text-primary",
});

// ── Component ─────────────────────────────────────────────────────────────────

export const ProductCard: FC<ProductCardProps> = ({ product, className }) => {
    return (
        <Link href={product.href} className={cx(styles.root, className)}>
            <div className={styles.imageWrapper}>
                <img
                    alt={product.imageAlt}
                    src={product.imageSrc}
                    className={styles.image}
                />
                {product.badge && (
                    <span className={cx(styles.badge.base, styles.badge[product.badgeColor ?? "brand"])}>
                        {product.badge}
                    </span>
                )}
            </div>
            <h3 className={styles.name}>{product.name}</h3>
            {product.discountedPoints ? (
                <p className={styles.pointsDiscounted}>
                    <span className={styles.pointsOriginal}>{product.points}</span>
                    <span className={styles.pointsSale}>{product.discountedPoints}</span>
                </p>
            ) : (
                <p className={styles.points}>{product.points}</p>
            )}
        </Link>
    );
};
