export type DivisionCode = "IESD" | "ISD" | "HVAC" | "PLB";

export interface Division {
    code: DivisionCode;
    /** Short label for chips and filters, e.g. `HVAC`. */
    label: string;
    /** Full name, e.g. `Plumbing Division`. */
    name: string;
}

export type SocialNetwork = "facebook" | "instagram" | "linkedin" | "pinterest" | "x" | "youtube";

/**
 * A supplier's participation in one division. Promotions and qualifying
 * product lists are set per division, so a supplier can run a promotion in
 * HVAC while every product earns in Plumbing.
 */
export interface SupplierListing {
    division: DivisionCode;
    /** Link to the supplier's promotion in this division. Omit when there is none. */
    promotionHref?: string;
    /** Link to the list of products that earn points. Omit when every product earns. */
    qualifyingProductsHref?: string;
}

export interface Supplier {
    id: string;
    name: string;
    /** Logo image. Falls back to the supplier's initials when missing or broken. */
    logoSrc?: string;
    websiteHref?: string;
    /** Only the networks given here are shown, in a fixed order. */
    socials?: Partial<Record<SocialNetwork, string>>;
    /** One entry per division the supplier participates in. */
    listings: SupplierListing[];
}

export interface SupplierFilterState {
    /** `all` or a division code. */
    division: DivisionCode | "all";
    query: string;
    /** Only suppliers running a promotion. */
    promotionsOnly: boolean;
    /** Only suppliers with a qualifying product list. */
    qualifyingOnly: boolean;
}

/** A supplier that passed the filters, with just the listings that matched. */
export interface SupplierMatch {
    supplier: Supplier;
    listings: SupplierListing[];
}

export interface SupplierFilterCounts {
    /** Suppliers per division (and `all`) under the other active filters. */
    divisions: Record<DivisionCode | "all", number>;
    promotions: number;
    qualifying: number;
}
