import type { FC } from "react";
import { ArrowRight, ArrowUpRight, Play } from "@untitledui/icons";
import { Link as AriaLink } from "react-aria-components";
import { Badge, type BadgeColor } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import { formatContentDate, parseContentDate, resolveCategory } from "./content-card-categories";
import type { ContentCardImage, ContentCardLinkStyle, ContentCardProps, ContentCardVariant, ContentCategory } from "./content-card-types";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: {
        base: "group/card @container relative h-full overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs",
        // The title link stretches over the whole card, so show its focus ring on the card.
        card: "outline-brand has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2",
    },
    layout: {
        default: "flex h-full flex-col",
        featured: "flex h-full flex-col @3xl:flex-row",
    },
    media: {
        base: "group/media relative shrink-0 overflow-hidden",
        default: "aspect-video",
        featured: "aspect-video @3xl:aspect-auto @3xl:min-h-80 @3xl:w-1/2",
    },
    image: {
        base: "absolute inset-0 size-full object-cover transition-transform duration-300 ease-out",
        // Zoom follows whatever is clickable: the image itself, or the whole card.
        button: "motion-safe:group-hover/media:scale-105",
        card: "motion-safe:group-hover/card:scale-105",
    },
    body: {
        base: "flex flex-1 flex-col",
        default: "p-6",
        featured: "p-6 @3xl:justify-center @3xl:p-10",
    },
    meta: "flex flex-wrap items-center gap-x-3 gap-y-2",
    date: "text-sm text-tertiary",
    title: {
        base: "mt-4 font-semibold text-primary",
        default: "text-lg",
        featured: "text-xl @3xl:text-display-xs",
    },
    titleClamp: {
        default: "line-clamp-2",
        featured: "line-clamp-3",
    },
    titleWithArrow: "flex items-start justify-between gap-4",
    titleLink: "outline-none after:absolute after:inset-0",
    titleArrow: {
        base: "size-6 shrink-0 text-fg-quaternary transition duration-200 ease-out group-hover/card:text-fg-quaternary_hover motion-safe:group-hover/card:translate-x-0.5 motion-safe:group-hover/card:-translate-y-0.5",
        default: "mt-0.5",
        featured: "mt-0.5 @3xl:mt-1",
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
    linkStyle: ContentCardLinkStyle;
}

const ContentCardMedia: FC<ContentCardMediaProps> = ({ variant, category, image, linkStyle }) => {
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
            <img src={image.src} alt={image.alt} className={cx(styles.image.base, styles.image[linkStyle])} />
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
    linkStyle = "button",
    external = false,
    headingLevel = 3,
    className,
}) => {
    const category = resolveCategory(categoryProp);
    const parsedDate = date ? parseContentDate(date) : null;
    const formattedDate = parsedDate ? formatContentDate(parsedDate) : null;
    const Heading = `h${headingLevel}` as const;
    const CategoryIcon = category.icon;
    const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

    return (
        <article className={cx(styles.root.base, linkStyle === "card" && styles.root.card, className)}>
            <div className={styles.layout[variant]}>
                <ContentCardMedia variant={variant} category={category} image={image} linkStyle={linkStyle} />

                <div className={cx(styles.body.base, styles.body[variant])}>
                    <div className={styles.meta}>
                        <Badge color={category.color} type="pill-color" size="md">
                            <CategoryIcon className="size-3" aria-hidden="true" />
                            {category.label}
                        </Badge>
                        {formattedDate && (
                            <time dateTime={formattedDate.dateTime} className={styles.date}>
                                {formattedDate.label}
                            </time>
                        )}
                    </div>

                    {linkStyle === "card" ? (
                        <Heading className={cx(styles.title.base, styles.title[variant], styles.titleWithArrow)}>
                            <AriaLink href={href} className={styles.titleLink} {...linkProps}>
                                <span className={styles.titleClamp[variant]}>{title}</span>
                                {external && <span className="sr-only"> (opens in new tab)</span>}
                            </AriaLink>
                            <ArrowUpRight className={cx(styles.titleArrow.base, styles.titleArrow[variant])} aria-hidden="true" />
                        </Heading>
                    ) : (
                        <Heading className={cx(styles.title.base, styles.title[variant], styles.titleClamp[variant])}>{title}</Heading>
                    )}

                    {description && <p className={cx(styles.description.base, styles.description[variant])}>{description}</p>}

                    {linkStyle === "button" && (
                        <div className={cx(styles.cta.base, variant === "featured" && styles.cta.featured)}>
                            <Button href={href} color="link-color" size="md" iconTrailing={ArrowRight} className={styles.ctaButton} {...linkProps}>
                                {ctaLabel ?? category.ctaLabel}
                                {/* "Read more" alone is ambiguous in a list of links, so name the content too. */}
                                <span className="sr-only">
                                    : {title}
                                    {external && " (opens in new tab)"}
                                </span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};
