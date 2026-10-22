import type { Division, DivisionCode, Supplier, SupplierFilterCounts, SupplierFilterState, SupplierListing, SupplierMatch } from "./supplier-types";

export const DIVISIONS: Division[] = [
    { code: "IESD", label: "IESD", name: "Independent Electrical Supply Division" },
    { code: "ISD", label: "ISD", name: "Industrial Supply Division" },
    { code: "HVAC", label: "HVAC", name: "HVAC Division" },
    { code: "PLB", label: "PLB", name: "Plumbing Division" },
];

export const DEFAULT_SUPPLIER_FILTERS: SupplierFilterState = { division: "all", query: "", promotionsOnly: false, qualifyingOnly: false };

export const hasActiveFilters = (filters: SupplierFilterState) =>
    filters.division !== "all" || filters.query.trim() !== "" || filters.promotionsOnly || filters.qualifyingOnly;

/** Lowercase, accent-free and punctuation-free, so `black decker` finds `Black & Decker` and `lindstrom` finds `Lindström`. */
export const normalizeSearchText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

export const searchTokens = (query: string) => normalizeSearchText(query).split(" ").filter(Boolean);

/** Every token must appear in the name (or a division's label or name). */
const matchesQuery = (supplier: Supplier, tokens: string[], divisions: Division[]) => {
    if (tokens.length === 0) return true;
    const divisionText = supplier.listings.map((listing) => {
        const division = divisions.find((d) => d.code === listing.division);
        return division ? `${division.label} ${division.name}` : listing.division;
    });
    const haystack = normalizeSearchText([supplier.name, ...divisionText].join(" "));
    return tokens.every((token) => haystack.includes(token));
};

const listingPasses = (listing: SupplierListing, filters: Pick<SupplierFilterState, "division" | "promotionsOnly" | "qualifyingOnly">) =>
    (filters.division === "all" || listing.division === filters.division) &&
    (!filters.promotionsOnly || !!listing.promotionHref) &&
    (!filters.qualifyingOnly || !!listing.qualifyingProductsHref);

/** Suppliers that pass every filter, sorted A–Z, each with the listings that matched. */
export function filterSuppliers(suppliers: Supplier[], filters: SupplierFilterState, divisions: Division[] = DIVISIONS): SupplierMatch[] {
    const tokens = searchTokens(filters.query);
    const matches: SupplierMatch[] = [];

    for (const supplier of suppliers) {
        if (!matchesQuery(supplier, tokens, divisions)) continue;
        const listings = supplier.listings.filter((listing) => listingPasses(listing, filters));
        if (listings.length > 0) matches.push({ supplier, listings });
    }

    return matches.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, undefined, { sensitivity: "base", numeric: true }));
}

/**
 * How many suppliers each option would show if picked, given the other
 * filters. Lets a chip say `HVAC 29` before anyone clicks it.
 */
export function countSupplierFilters(suppliers: Supplier[], filters: SupplierFilterState, divisions: Division[] = DIVISIONS): SupplierFilterCounts {
    const count = (next: Partial<SupplierFilterState>) => filterSuppliers(suppliers, { ...filters, ...next }, divisions).length;

    const divisionCounts = { all: count({ division: "all" }) } as Record<DivisionCode | "all", number>;
    for (const division of divisions) divisionCounts[division.code] = count({ division: division.code });

    return {
        divisions: divisionCounts,
        promotions: count({ promotionsOnly: true }),
        qualifying: count({ qualifyingOnly: true }),
    };
}

export interface SupplierLetterGroup {
    /** `A`–`Z`, or `#` for names that start with a digit or symbol. */
    letter: string;
    matches: SupplierMatch[];
}

export const ALPHABET = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export const letterFor = (name: string) => {
    const first = normalizeSearchText(name).charAt(0).toUpperCase();
    return first >= "A" && first <= "Z" ? first : "#";
};

/** Groups already-sorted matches by first letter, in alphabet order. */
export function groupByLetter(matches: SupplierMatch[]): SupplierLetterGroup[] {
    const groups = new Map<string, SupplierMatch[]>();
    for (const match of matches) {
        const letter = letterFor(match.supplier.name);
        groups.set(letter, [...(groups.get(letter) ?? []), match]);
    }
    return ALPHABET.filter((letter) => groups.has(letter)).map((letter) => ({ letter, matches: groups.get(letter)! }));
}

/** Splits `text` into runs, flagging the ones that match a search token, for highlighting. */
export function highlightRuns(text: string, query: string): { text: string; match: boolean }[] {
    const tokens = searchTokens(query);
    if (tokens.length === 0) return [{ text, match: false }];

    const lower = text.toLowerCase();
    const marked = new Array<boolean>(text.length).fill(false);
    for (const token of tokens) {
        let from = lower.indexOf(token);
        while (from !== -1) {
            marked.fill(true, from, from + token.length);
            from = lower.indexOf(token, from + token.length);
        }
    }

    const runs: { text: string; match: boolean }[] = [];
    for (let i = 0; i < text.length; i++) {
        const last = runs[runs.length - 1];
        if (last && last.match === marked[i]) last.text += text[i];
        else runs.push({ text: text[i], match: marked[i] });
    }
    return runs;
}

/** Up to two initials for the logo fallback: `Milwaukee Tool` → `MT`, `3M` → `3M`. */
export const supplierInitials = (name: string) => {
    const words = name.replace(/[^A-Za-z0-9 ]+/g, " ").split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
};
