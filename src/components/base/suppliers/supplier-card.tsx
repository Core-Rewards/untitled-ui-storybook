import { useState } from "react";
import type { FC, ReactElement } from "react";
import { Button as AriaButton, Link as AriaLink, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { CheckCircle, ChevronDown, LinkExternal01, Tag01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";
import { SOCIAL_NETWORKS } from "./supplier-socials";
import type { Division, Supplier, SupplierListing } from "./supplier-types";
import { DIVISIONS, highlightRuns, supplierInitials } from "./supplier-utils";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    // h-full so cards in a grid row line up whatever their content.
    root: "group/card flex h-full flex-col rounded-2xl bg-primary shadow-xs ring-1 ring-secondary ring-inset transition duration-200 ease-out hover:shadow-lg hover:ring-primary motion-reduce:transition-none",
    // Fixed height so logos line up across a row whether or not a card has a promotion.
    topRow: "flex h-12 items-center justify-end px-4 pt-3",
    divisions: "mt-2 flex flex-wrap justify-center gap-1 px-4",
    // Logos are JPGs on white, so the tile stays white in dark mode too.
    logoTile: "mx-4 flex aspect-[348/200] items-center justify-center overflow-hidden rounded-xl bg-white",
    logoImage: "pointer-events-none size-full object-contain transition duration-300 ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none",
    logoFallback: "flex size-full flex-col items-center justify-center gap-1 bg-secondary_subtle",
    name: "mt-3 line-clamp-2 px-4 text-center text-md font-semibold text-primary",
    mark: "rounded-[3px] bg-brand-secondary text-brand-secondary",
    socials: "flex flex-wrap items-center justify-center px-2 pt-2",
    social: "flex size-7 items-center justify-center rounded-md text-fg-quaternary outline-brand transition-colors hover:bg-primary_hover hover:text-fg-brand-secondary focus-visible:outline-2",
    footer: "mt-auto grid gap-2 px-4 pt-4 pb-4",
    // Same box as a `md` button so every footer is the same height.
    allEarn: "flex items-center justify-center gap-1.5 rounded-lg bg-secondary_subtle px-3.5 py-2.5 text-sm font-medium text-tertiary ring-1 ring-secondary ring-inset",
    promoBadge: "shrink-0 rounded-full outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
    menu: "w-56 origin-top-right rounded-lg bg-primary py-1.5 shadow-lg ring-1 ring-secondary outline-none ring-inset entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95",
    menuItem: "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm font-medium text-secondary outline-none focus:bg-primary_hover",
});

// ── Parts ─────────────────────────────────────────────────────────────────────

const SupplierLogo: FC<{ supplier: Supplier }> = ({ supplier }) => {
    const [failed, setFailed] = useState(false);

    if (!supplier.logoSrc || failed) {
        return (
            <div className={styles.logoFallback} aria-hidden="true">
                <span className="text-display-xs font-semibold tracking-tight text-quaternary">{supplierInitials(supplier.name)}</span>
            </div>
        );
    }
    // The name is the heading right below, so the image is decorative.
    return <img src={supplier.logoSrc} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} className={styles.logoImage} />;
};

const HighlightedName: FC<{ name: string; highlight?: string }> = ({ name, highlight }) => (
    <>
        {highlightRuns(name, highlight ?? "").map((run, index) =>
            run.match ? (
                <mark key={index} className={styles.mark}>
                    {run.text}
                </mark>
            ) : (
                run.text
            ),
        )}
    </>
);

interface DivisionLink {
    division: Division;
    href: string;
}

/**
 * One link goes straight there. Several (the same supplier runs a promotion
 * in two divisions, say) open a menu to pick the division.
 */
const LinkOrMenu: FC<{
    links: DivisionLink[];
    menuLabel: string;
    renderLink: (href: string) => ReactElement;
    renderTrigger: () => ReactElement;
}> = ({ links, menuLabel, renderLink, renderTrigger }) => {
    if (links.length === 1) return renderLink(links[0].href);

    return (
        <MenuTrigger>
            {renderTrigger()}
            <Popover placement="bottom end" offset={6} className={styles.menu}>
                <Menu aria-label={menuLabel} className="outline-none">
                    {links.map(({ division, href }) => (
                        <MenuItem key={division.code} href={href} className={styles.menuItem}>
                            {division.name}
                        </MenuItem>
                    ))}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

const linksFor = (listings: SupplierListing[], divisions: Division[], key: "promotionHref" | "qualifyingProductsHref"): DivisionLink[] =>
    listings.flatMap((listing) => {
        const division = divisions.find((d) => d.code === listing.division);
        const href = listing[key];
        return division && href ? [{ division, href }] : [];
    });

// ── Card ──────────────────────────────────────────────────────────────────────

export interface SupplierCardProps {
    supplier: Supplier;
    /**
     * The listings that apply where the card is shown, e.g. only the HVAC one
     * when the page is filtered to HVAC. They decide whether the card offers
     * a promotion or a qualifying product list. Defaults to every listing.
     */
    listings?: SupplierListing[];
    /** Search text to highlight in the supplier name. */
    highlight?: string;
    /** Division lookup for chips and menus. Defaults to the four AD divisions. */
    divisions?: Division[];
    /** Heading level for the supplier name. Defaults to 3, under a page `h1` and a letter `h2`. */
    headingLevel?: 2 | 3 | 4;
    className?: string;
}

export const SupplierCard: FC<SupplierCardProps> = ({ supplier, listings = supplier.listings, highlight, divisions = DIVISIONS, headingLevel = 3, className }) => {
    const Heading = `h${headingLevel}` as const;
    const promotions = linksFor(listings, divisions, "promotionHref");
    const qualifying = linksFor(listings, divisions, "qualifyingProductsHref");
    const socials = SOCIAL_NETWORKS.filter((network) => supplier.socials?.[network.key]);

    return (
        <article aria-label={supplier.name} className={cx(styles.root, className)}>
            <div className={styles.topRow}>
                {promotions.length > 0 && (
                    <LinkOrMenu
                        links={promotions}
                        menuLabel={`${supplier.name} promotions`}
                        renderLink={(href) => (
                            <AriaLink href={href} aria-label={`View ${supplier.name} promotion`} className={styles.promoBadge}>
                                <PromotionBadge />
                            </AriaLink>
                        )}
                        renderTrigger={() => (
                            <AriaButton aria-label={`View ${supplier.name} promotions`} className={cx(styles.promoBadge, "cursor-pointer")}>
                                <PromotionBadge count={promotions.length} />
                            </AriaButton>
                        )}
                    />
                )}
            </div>

            <div className={styles.logoTile}>
                <SupplierLogo key={supplier.logoSrc} supplier={supplier} />
            </div>

            <Heading className={styles.name}>
                <HighlightedName name={supplier.name} highlight={highlight} />
            </Heading>

            <ul className={styles.divisions} aria-label="Divisions">
                {supplier.listings.map((listing) => {
                    const division = divisions.find((d) => d.code === listing.division);
                    return (
                        <li key={listing.division} title={division?.name}>
                            <Badge size="sm" type="badge-modern">
                                {division?.label ?? listing.division}
                            </Badge>
                        </li>
                    );
                })}
            </ul>

            {socials.length > 0 && (
                <ul className={styles.socials} aria-label={`${supplier.name} on social media`}>
                    {socials.map((network) => (
                        <li key={network.key}>
                            <a
                                href={supplier.socials![network.key]}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${supplier.name} on ${network.label}`}
                                title={network.label}
                                className={styles.social}
                            >
                                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d={network.path} />
                                </svg>
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            <div className={styles.footer}>
                {qualifying.length > 0 ? (
                    <LinkOrMenu
                        links={qualifying}
                        menuLabel={`${supplier.name} qualifying products`}
                        renderLink={(href) => (
                            <Button color="secondary" size="md" href={href} className="w-full">
                                Qualifying products
                            </Button>
                        )}
                        renderTrigger={() => (
                            <Button color="secondary" size="md" iconTrailing={ChevronDown} className="w-full">
                                Qualifying products
                            </Button>
                        )}
                    />
                ) : (
                    <p className={styles.allEarn}>
                        <CheckCircle className="size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />
                        All products earn
                    </p>
                )}

                {supplier.websiteHref && (
                    <Button
                        color="primary"
                        size="md"
                        href={supplier.websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        iconTrailing={LinkExternal01}
                        aria-label={`Visit the ${supplier.name} website (opens in a new tab)`}
                        className="w-full"
                    >
                        Website
                    </Button>
                )}
            </div>
        </article>
    );
};

const PromotionBadge: FC<{ count?: number }> = ({ count }) => (
    <Badge color="warning" size="md" className="gap-1 font-semibold">
        <Tag01 className="size-3.5" aria-hidden="true" />
        {count && count > 1 ? `${count} promotions` : "Promotion"}
    </Badge>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

/** Placeholder with the card's footprint, for the first load. */
export const SupplierCardSkeleton: FC<{ className?: string }> = ({ className }) => (
    <div aria-hidden="true" className={cx(styles.root, "animate-pulse hover:shadow-xs hover:ring-secondary motion-reduce:animate-none", className)}>
        <div className={styles.topRow}>
            <div className="h-5 w-12 rounded-md bg-tertiary" />
        </div>
        <div className={cx(styles.logoTile, "bg-tertiary")} />
        <div className="mx-auto mt-4 h-5 w-2/3 rounded bg-tertiary" />
        <div className="mx-auto mt-4 h-4 w-1/2 rounded bg-tertiary" />
        <div className={styles.footer}>
            <div className="h-10 rounded-lg bg-tertiary" />
            <div className="h-10 rounded-lg bg-tertiary" />
        </div>
    </div>
);
