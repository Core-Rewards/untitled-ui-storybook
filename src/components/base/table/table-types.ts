import type { ReactNode } from "react";
import type { TableAlign } from "./table";

export type SortDirection = "ascending" | "descending";

export type TableSortDescriptor = {
    /** The `id` of the column being sorted. */
    column: string;
    direction: SortDirection;
};

export type TableColumn<T> = {
    /** Unique column id. Used as the sort key. */
    id: string;
    /** Header label. */
    header: ReactNode;
    /** Renders the cell contents for a row. */
    cell: (row: T) => ReactNode;
    /**
     * Returns the value this column sorts on. Strings sort alphabetically,
     * numbers numerically. Omit to make the column unsortable.
     */
    sortValue?: (row: T) => string | number;
    /** Header and cell alignment. Defaults to `left`. */
    align?: TableAlign;
    /** Marks this column as the row's accessible name. Set it on exactly one column. */
    isRowHeader?: boolean;
    /** Keep the header available to screen readers but hide it visually, e.g. for an actions column. */
    srOnlyHeader?: boolean;
    headerClassName?: string;
    cellClassName?: string;
};

export type TableFilterOption = {
    value: string;
    label: string;
};

export type TableFilter<T> = {
    /** Unique filter id, used as the key in `TableFilterValues`. */
    id: string;
    /** Trigger label, e.g. "Status". */
    label: string;
    /** Selectable options, rendered in the order given. */
    options: TableFilterOption[];
    /** Returns the row's value(s) for this filter. A row matches if any of them is selected. */
    getValue: (row: T) => string | string[];
};

/** Selected option values, keyed by filter id. An empty or missing array means "no filter". */
export type TableFilterValues = Record<string, string[]>;

export type TableSearchConfig<T> = {
    /** Placeholder text. Defaults to "Search". */
    placeholder?: string;
    /** Returns the text this row is matched against. */
    getText: (row: T) => string;
};
