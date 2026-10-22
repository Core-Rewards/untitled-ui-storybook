import { useDeferredValue, useId, useMemo, useRef } from "react";
import type { FC, ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { SearchRefraction } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";
import { useControllableState } from "@/utils/use-controllable-state";
import { SupplierCard, SupplierCardSkeleton } from "./supplier-card";
import { ClearSupplierFiltersButton, SupplierFilters } from "./supplier-filters";
import type { Division, Supplier, SupplierFilterState, SupplierMatch } from "./supplier-types";
import { ALPHABET, DEFAULT_SUPPLIER_FILTERS, DIVISIONS, countSupplierFilters, filterSuppliers, groupByLetter } from "./supplier-utils";

const SKELETON_COUNT = 8;
/** Below this many results, letter headings would mostly hold one card each, so the grid stays flat. */
const GROUP_MIN_RESULTS = 24;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    header: "mb-8 flex flex-col gap-3",
    title: "text-display-sm font-semibold tracking-tight text-primary md:text-display-md",
    description: "text-lg text-tertiary",
    // Pulled out to the page gutter so the blurred band spans the content width.
    toolbar: "z-10 -mx-4 flex flex-col gap-3 border-b border-secondary bg-primary/90 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8",
    summaryRow: "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
    summary: "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tertiary",
    alphabet: "-mx-1 flex max-w-full gap-0.5 overflow-x-auto px-1 [scrollbar-width:none]",
    letterButton:
        "flex h-7 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-xs font-semibold text-tertiary outline-brand transition-colors hover:bg-primary_hover hover:text-brand-secondary focus-visible:outline-2 disabled:cursor-default disabled:text-disabled disabled:hover:bg-transparent",
    grid: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    letterHeading: "mb-4 flex items-center gap-3 text-display-xs font-semibold text-primary",
    empty: "flex flex-col items-center px-4 py-20 text-center",
});

// ── Parts ─────────────────────────────────────────────────────────────────────

const scrollParent = (element: HTMLElement): HTMLElement | null => {
    for (let node = element.parentElement; node; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node);
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
    }
    return null;
};

const CardGrid: FC<{ matches: SupplierMatch[]; query: string; divisions: Division[] }> = ({ matches, query, divisions }) => (
    <ul className={styles.grid}>
        {matches.map(({ supplier, listings }) => (
            <li key={supplier.id}>
                <SupplierCard supplier={supplier} listings={listings} highlight={query} divisions={divisions} />
            </li>
        ))}
    </ul>
);

const EmptyState: FC<{ onClear: () => void }> = ({ onClear }) => (
    <div className={styles.empty}>
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary ring-8 ring-secondary_subtle">
            <SearchRefraction className="size-6 text-fg-quaternary" aria-hidden="true" />
        </span>
        <p className="text-md font-semibold text-primary">No suppliers found</p>
        <p className="mt-1 mb-6 max-w-sm text-sm text-tertiary">Nothing matches every filter you've set. Try a different name or division.</p>
        <Button color="secondary" size="md" onClick={onClear}>
            Clear filters
        </Button>
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export interface ParticipatingSuppliersProps {
    suppliers: Supplier[];
    /** Shows card skeletons in place of results. */
    isLoading?: boolean;
    /** Controlled filters. Pair with `onFiltersChange`, e.g. to sync the URL. */
    filters?: SupplierFilterState;
    defaultFilters?: SupplierFilterState;
    onFiltersChange?: (filters: SupplierFilterState) => void;
    /** Splits results under A–Z headings with a jump bar once there are enough of them. Defaults to true. */
    groupByLetter?: boolean;
    /** Keeps the filters pinned while the results scroll, from `md` up. Defaults to true. */
    stickyToolbar?: boolean;
    divisions?: Division[];
    title?: ReactNode;
    description?: ReactNode;
    className?: string;
}

/**
 * The Participating Suppliers page body: heading, filters and the supplier
 * grid. One card per supplier however many divisions it is in; filtering by
 * division narrows the grid and switches each card to that division's
 * promotion and qualifying product links.
 */
export const ParticipatingSuppliers: FC<ParticipatingSuppliersProps> = ({
    suppliers,
    isLoading = false,
    filters: controlledFilters,
    defaultFilters = DEFAULT_SUPPLIER_FILTERS,
    onFiltersChange,
    groupByLetter: grouped = true,
    stickyToolbar = true,
    divisions = DIVISIONS,
    title = "Participating Suppliers",
    description = "Explore our network of trusted partners. Filter by division, or find a supplier running a promotion.",
    className,
}) => {
    const [filters, setFilters] = useControllableState(controlledFilters, defaultFilters, onFiltersChange);
    // Typing stays instant; the grid catches up a frame later.
    const deferredFilters = useDeferredValue(filters);
    const idPrefix = useId();
    const toolbarRef = useRef<HTMLDivElement>(null);

    const matches = useMemo(() => filterSuppliers(suppliers, deferredFilters, divisions), [suppliers, deferredFilters, divisions]);
    const counts = useMemo(() => countSupplierFilters(suppliers, deferredFilters, divisions), [suppliers, deferredFilters, divisions]);
    const showGroups = grouped && matches.length > GROUP_MIN_RESULTS;
    const groups = useMemo(() => (showGroups ? groupByLetter(matches) : []), [showGroups, matches]);
    const letters = new Set(groups.map((group) => group.letter));

    const promotionCount = matches.filter((match) => match.listings.some((listing) => listing.promotionHref)).length;
    const qualifyingCount = matches.filter((match) => match.listings.some((listing) => listing.qualifyingProductsHref)).length;
    const letterId = (letter: string) => `${idPrefix}-letter-${letter === "#" ? "num" : letter}`;

    const jumpTo = (letter: string) => {
        const section = document.getElementById(letterId(letter));
        if (!section) return;
        // Land below the pinned toolbar rather than under it.
        const toolbar = toolbarRef.current;
        const offset = stickyToolbar && toolbar && getComputedStyle(toolbar).position === "sticky" ? toolbar.offsetHeight + 16 : 16;
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        // Scroll only the nearest scrolling ancestor; `scrollIntoView` would also shift an app shell's outer frame.
        const container = scrollParent(section);
        if (container) {
            const top = section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - offset;
            container.scrollTo({ top, behavior });
        } else {
            window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior });
        }
        section.focus({ preventScroll: true });
    };

    const clear = () => setFilters(DEFAULT_SUPPLIER_FILTERS);

    return (
        <section aria-labelledby={`${idPrefix}-title`} className={className}>
            <header className={styles.header}>
                <h1 id={`${idPrefix}-title`} className={styles.title}>
                    {title}
                </h1>
                {description && <p className={styles.description}>{description}</p>}
            </header>

            <div ref={toolbarRef} className={cx(styles.toolbar, stickyToolbar && "md:sticky md:top-0")}>
                <SupplierFilters value={filters} onChange={setFilters} counts={isLoading ? undefined : counts} divisions={divisions} />

                <div className={styles.summaryRow}>
                    <p className={styles.summary} aria-live="polite">
                        {isLoading ? (
                            "Loading suppliers…"
                        ) : (
                            <>
                                <span>
                                    Showing <span className="font-semibold text-secondary tabular-nums">{matches.length}</span> of{" "}
                                    <span className="tabular-nums">{suppliers.length}</span> suppliers
                                </span>
                                {promotionCount > 0 && <span>· {promotionCount} with a promotion</span>}
                                {qualifyingCount > 0 && <span>· {qualifyingCount} with qualifying products</span>}
                            </>
                        )}
                        <ClearSupplierFiltersButton value={filters} onChange={setFilters} className="ml-1" />
                    </p>

                    {showGroups && !isLoading && (
                        <nav aria-label="Jump to letter" className={styles.alphabet}>
                            {ALPHABET.map((letter) => (
                                <AriaButton
                                    key={letter}
                                    isDisabled={!letters.has(letter)}
                                    onPress={() => jumpTo(letter)}
                                    aria-label={letter === "#" ? "Jump to numbers" : `Jump to ${letter}`}
                                    className={styles.letterButton}
                                >
                                    {letter}
                                </AriaButton>
                            ))}
                        </nav>
                    )}
                </div>
            </div>

            <div className="pt-8">
                {isLoading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                            <SupplierCardSkeleton key={index} />
                        ))}
                    </div>
                ) : matches.length === 0 ? (
                    <EmptyState onClear={clear} />
                ) : showGroups ? (
                    <div className="flex flex-col gap-10">
                        {groups.map((group) => (
                            <section key={group.letter} id={letterId(group.letter)} tabIndex={-1} aria-labelledby={`${letterId(group.letter)}-heading`} className="outline-none">
                                <h2 id={`${letterId(group.letter)}-heading`} className={styles.letterHeading}>
                                    <span aria-hidden="true">{group.letter}</span>
                                    <span className="sr-only">{group.letter === "#" ? "Numbers" : group.letter}</span>
                                    <span className="h-px flex-1 bg-border-secondary" aria-hidden="true" />
                                    <span className="text-sm font-medium text-quaternary tabular-nums">
                                        {group.matches.length} supplier{group.matches.length === 1 ? "" : "s"}
                                    </span>
                                </h2>
                                <CardGrid matches={group.matches} query={deferredFilters.query} divisions={divisions} />
                            </section>
                        ))}
                    </div>
                ) : (
                    <CardGrid matches={matches} query={deferredFilters.query} divisions={divisions} />
                )}
            </div>
        </section>
    );
};
