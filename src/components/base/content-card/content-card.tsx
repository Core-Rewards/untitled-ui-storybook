import type { FC } from "react";
import { ArrowRight, Play } from "@untitledui/icons";
import { Badge, type BadgeColor } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import { formatContentDate, parseContentDate, resolveCategory } from "./content-card-categories";
import type { ContentCardImage, ContentCardProps, ContentCardVariant, ContentCategory } from "./content-card-types";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: "@container h-full overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs",
    layout: {
        default: "flex h-full flex-col",
        featured: "flex h-full flex-col @3xl:flex-row",
    },
    media: {
        base: "relative shrink-0 overflow-hidden",
        default: "aspect-video",
        featured: "aspect-video @3xl:aspect-auto @3xl:min-h-80 @3xl:w-1/2",
    },
    image: "absolute inset-0 size-full object-cover",
    body: {
        base: "flex flex-1 flex-col",
        default: "p-6",
        featured: "p-6 @3xl:justify-center @3xl:p-10",
    },
    meta: "flex flex-wrap items-center gap-x-3 gap-y-2",
    date: "text-sm text-tertiary",
    title: {
        base: "mt-4 font-semibold text-primary",
        default: "line-clamp-2 text-lg",
        featured: "line-clamp-3 text-xl @3xl:text-display-xs",
    },
    description: {
        base: "mt-2 text-md text-tertiary",
        default: "line-clamp-3",
        featured: "line-clamp-4",
    },
    // Spacing lives on a wrapper because the link-color Button forces `p-0!`.
    cta: {
        base: "mt-auto pt-6",
        featured: "@3xl:mt-0 @3xl:pt-8",
    },
    ctaButton: "motion-safe:hover:*:data-[icon=trailing]:translate-x-0.5",
    ring: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
    playButton:
        "absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-fg-brand-primary shadow-lg backdrop-blur-sm",
});

/**
 * Soft panel behind the category icon when there is no image, with faint rings echoing the
 * featured-icon patterns. The tint is lighter in dark mode, where the 50 shades are deep.
 */
const panelColors = sortCx({
    gray: { bg: "bg-utility-gray-50 dark:bg-utility-gray-50/40", ring: "border-utility-gray-200" },
    brand: { bg: "bg-utility-brand-50 dark:bg-utility-brand-50/40", ring: "border-utility-brand-200" },
    error: { bg: "bg-utility-error-50 dark:bg-utility-error-50/40", ring: "border-utility-error-200" },
    warning: { bg: "bg-utility-warning-50 dark:bg-utility-warning-50/40", ring: "border-utility-warning-200" },
    success: { bg: "bg-utility-success-50 dark:bg-utility-success-50/40", ring: "border-utility-success-200" },
    blue: { bg: "bg-utility-blue-50 dark:bg-utility-blue-50/40", ring: "border-utility-blue-200" },
    indigo: { bg: "bg-utility-indigo-50 dark:bg-utility-indigo-50/40", ring: "border-utility-indigo-200" },
    purple: { bg: "bg-utility-purple-50 dark:bg-utility-purple-50/40", ring: "border-utility-purple-200" },
    orange: { bg: "bg-utility-orange-50 dark:bg-utility-orange-50/40", ring: "border-utility-orange-200" },
} satisfies Record<BadgeColor, { bg: string; ring: string }>);

/** Ring diameters and opacities, innermost first. */
const rings = [
    "size-24 opacity-100",
    "size-40 opacity-70",
    "size-56 opacity-40",
    "size-72 opacity-20",
];

// ── Media ─────────────────────────────────────────────────────────────────────

interface ContentCardMediaProps {
    variant: ContentCardVariant;
    category: ContentCategory;
    image?: ContentCardImage;
}

const ContentCardMedia: FC<ContentCardMediaProps> = ({ variant, category, image }) => {
    if (!image) {
        return (
            <div className={cx(styles.media.base, styles.media[variant], "flex items-center justify-center", panelColors[category.color].bg)} aria-hidden="true">
                {rings.map((ring) => (
                    <span key={ring} className={cx(styles.ring, ring, panelColors[category.color].ring)} />
                ))}
                <FeaturedIcon icon={category.icon} color={category.color} theme="light" size="xl" />
            </div>
        );
    }

    return (
        <div className={cx(styles.media.base, styles.media[variant], "bg-secondary")}>
            <img src={image.src} alt={image.alt} className={styles.image} />
            {category.isVideo && (
                <span className={styles.playButton} aria-hidden="true">
                    <Play className="ml-0.5 size-6 fill-current" />
                </span>
            )}
        </div>
    );
};

// ── Component ─────────────────────────────────────────────────────────────────

export const ContentCard: FC<ContentCardProps> = ({
    variant = "default",
    category: categoryProp,
    title,
    description,
    href,
    image,
    date,
    ctaLabel,
    external = false,
    headingLevel = 3,
    className,
}) => {
    const category = resolveCategory(categoryProp);
    const parsedDate = date ? parseContentDate(date) : null;
    const formattedDate = parsedDate ? formatContentDate(parsedDate) : null;
    const Heading = `h${headingLevel}` as const;
    const CategoryIcon = category.icon;

    return (
        <article className={cx(styles.root, className)}>
            <div className={styles.layout[variant]}>
                <ContentCardMedia variant={variant} category={category} image={image} />

                <div className={cx(styles.body.base, styles.body[variant])}>
                    <div className={styles.meta}>
                        <Badge color={category.color} type="badge-color" size="md">
                            <CategoryIcon className="size-3" aria-hidden="true" />
                            {category.label}
                        </Badge>
                        {formattedDate && (
                            <time dateTime={formattedDate.dateTime} className={styles.date}>
                                {formattedDate.label}
                            </time>
                        )}
                    </div>

                    <Heading className={cx(styles.title.base, styles.title[variant])}>{title}</Heading>

                    {description && <p className={cx(styles.description.base, styles.description[variant])}>{description}</p>}

                    <div className={cx(styles.cta.base, variant === "featured" && styles.cta.featured)}>
                        <Button
                            href={href}
                            color="link-color"
                            size="md"
                            iconTrailing={ArrowRight}
                            className={styles.ctaButton}
                            {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                        >
                            {ctaLabel ?? category.ctaLabel}
                            {/* "Read more" alone is ambiguous in a list of links, so name the content too. */}
                            <span className="sr-only">
                                : {title}
                                {external && " (opens in new tab)"}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
};
