import type { BadgeColor } from "@/components/base/badges/badge";

/**
 * One uploaded sales total. Programs that report by supplier have one record per
 * supplier per month; other programs have one record per month and no `supplier`.
 */
export type SalesRecord = {
    /** Unique identifier for the record. */
    id: string;
    /** Sales month, as `YYYY-MM`. */
    month: string;
    /** Total sales for the month in dollars. */
    amount: number;
    /** Supplier the sales were made through. Only set when the program reports by supplier. */
    supplier?: string;
    /** Date the upload was received, as an ISO date (`YYYY-MM-DD`). */
    uploadedDate?: string;
};

/**
 * `month` lists one row per month, `supplier` totals the year for each supplier, and
 * `grid` crosses the two with a row per supplier and a column per month.
 */
export type SalesHistoryView = "month" | "supplier" | "grid";

export type SalesMonthStatus = "uploaded" | "missing";

export const SALES_MONTH_STATUS_LABELS: Record<SalesMonthStatus, string> = {
    uploaded: "Uploaded",
    missing: "Not uploaded",
};

export const SALES_MONTH_STATUS_COLORS: Record<SalesMonthStatus, BadgeColor> = {
    uploaded: "success",
    missing: "warning",
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const shortMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

/** Formats a `YYYY-MM` month as `September`, or `Sep` when `short` is set. */
export const formatSalesMonth = (month: string, short = false) => {
    const [year, monthIndex] = month.split("-").map(Number);
    return (short ? shortMonthFormatter : monthFormatter).format(new Date(year, monthIndex - 1, 1));
};

/** Builds a `YYYY-MM` key from a year and a 1-based month. */
export const toMonthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

/**
 * Chart series fills in fixed order, validated for color-vision deficiency against both
 * surfaces. Dark mode steps down a shade so every fill stays inside the dark lightness band.
 */
export const SALES_SERIES_COLORS = [
    "bg-brand-600 dark:bg-brand-500",
    "bg-teal-500 dark:bg-teal-600",
    "bg-orange-500 dark:bg-orange-600",
    "bg-blue-400 dark:bg-blue-500",
    "bg-pink-500 dark:bg-pink-600",
];

/** Fill for suppliers folded into "Other" when there are more than the palette can name. */
export const SALES_OTHER_SERIES_COLOR = "bg-gray-400 dark:bg-gray-500";

export const OTHER_SERIES_ID = "__other";

/**
 * Maps every supplier to its chart series. Suppliers keep the same color whatever year or
 * filter is shown: the biggest sellers over all records get the named colors, and past five
 * suppliers the rest share a grey "Other" series.
 */
export const getSupplierSeries = (records: SalesRecord[]) => {
    const totals = new Map<string, number>();
    for (const record of records) {
        if (record.supplier) totals.set(record.supplier, (totals.get(record.supplier) ?? 0) + record.amount);
    }

    const ranked = [...totals.keys()].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0) || a.localeCompare(b));
    const named = ranked.length > SALES_SERIES_COLORS.length ? ranked.slice(0, SALES_SERIES_COLORS.length - 1) : ranked;

    const series = named.map((supplier, index) => ({ id: supplier, label: supplier, colorClassName: SALES_SERIES_COLORS[index] }));
    if (named.length < ranked.length) series.push({ id: OTHER_SERIES_ID, label: "Other suppliers", colorClassName: SALES_OTHER_SERIES_COLOR });

    const seriesBySupplier = new Map(ranked.map((supplier) => [supplier, named.includes(supplier) ? supplier : OTHER_SERIES_ID]));
    return { series, seriesBySupplier };
};
