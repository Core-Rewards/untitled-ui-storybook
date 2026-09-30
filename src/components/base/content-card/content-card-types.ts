import type { FC } from "react";
import type { BadgeColor } from "@/components/base/badges/badge";

export type ContentCardVariant = "default" | "featured";

/** Keys for the built-in category presets. */
export type ContentCategoryKey = "news" | "new-product" | "resource" | "video" | "event" | "promotion";

export type ContentCategory = {
    /** Label shown in the category badge (e.g. "News"). */
    label: string;
    /** Tints the badge and the no-image panel. */
    color: BadgeColor;
    /** Shown in the badge and, larger, in the no-image panel. */
    icon: FC<{ className?: string }>;
    /** Call-to-action text used when the card does not set `ctaLabel` (e.g. "Read more"). */
    ctaLabel: string;
    /** Overlays a play button on the card image. */
    isVideo?: boolean;
};

export type ContentCardImage = {
    src: string;
    /** Describe the image, or pass `""` when it only decorates the title. */
    alt: string;
};

export interface ContentCardProps {
    /** `featured` spans the full width with the image beside the content. Defaults to `default`. */
    variant?: ContentCardVariant;
    /** A preset key, or a custom category. */
    category: ContentCategoryKey | ContentCategory;
    title: string;
    /** Supporting text, truncated to a few lines. */
    description?: string;
    /** Where the call-to-action button links to. The button is the card's only link. */
    href: string;
    /** When omitted, a panel tinted in the category color shows the category icon instead. */
    image?: ContentCardImage;
    /** Publish date, as a `Date` or an ISO date string (e.g. "2026-09-30"). */
    date?: Date | string;
    /** Overrides the category's default call-to-action text. */
    ctaLabel?: string;
    /** Opens the link in a new tab. */
    external?: boolean;
    /** Heading level for the title, to fit the page outline. Defaults to `3`. */
    headingLevel?: 2 | 3 | 4;
    className?: string;
}
