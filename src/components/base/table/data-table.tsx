import type { ReactNode } from "react";
import { useMemo } from "react";
import type { Selection, SortDescriptor } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkboxes/checkbox";
import { useControllableState } from "@/utils/use-controllable-state";
import { cx } from "@/utils/cx";
import type { TableSize } from "./table";
import { TableBody, TableCardHeader, TableCardRoot, TableHead, TableHeader, TableRoot, TableRow, TableCell } from "./table";
import { TablePagination } from "./table-pagination";
import { TableFilterDropdown, TableSearchInput } from "./table-toolbar";
import type { TableColumn, TableFilter, TableFilterValues, TableSearchConfig, TableSortDescriptor } from "./table-types";

export interface DataTableProps<T> {
    /** Accessible name for the table. */
    "aria-label": string;
    /** Column definitions, rendered left to right in the order given. */
    columns: TableColumn<T>[];
    /** The full row set. Searching, filtering, sorting and pagination are applied to it. */
    data: T[];
    /** Returns a stable unique id for a row. */
    getRowId: (row: T) => string;
    /** Row density. Defaults to `md`. */
    size?: TableSize;
    /** Classes for the `<table>` element, e.g. a `min-w-*` that makes narrow viewports scroll. */
    tableClassName?: string;

    /** Card title. Omit to render the table without a titled header. */
    title?: ReactNode;
    /** Supporting line under the title. */
    description?: ReactNode;
    /** Badge next to the title. Defaults to the number of rows currently shown; pass `null` to hide it. */
    badge?: ReactNode;
    /** Controls pinned to the right of the header. */
    headerActions?: ReactNode;

    /** Controlled sort. Pair with `onSortChange`. */
    sortDescriptor?: TableSortDescriptor;
    /** Initial sort when uncontrolled. */
    defaultSortDescriptor?: TableSortDescriptor;
    onSortChange?: (descriptor: TableSortDescriptor) => void;

    /** Enables the search input above the table. */
    search?: TableSearchConfig<T>;
    /** Controlled search query. Pair with `onSearchChange`. */
    searchQuery?: string;
    defaultSearchQuery?: string;
    onSearchChange?: (query: string) => void;

    /** Enables filter dropdowns above the table. */
    filters?: TableFilter<T>[];
    /** Controlled filter selections, keyed by filter id. Pair with `onFilterChange`. */
    filterValues?: TableFilterValues;
    defaultFilterValues?: TableFilterValues;
    onFilterChange?: (values: TableFilterValues) => void;

    /** Enables the pagination footer. */
    pagination?: boolean;
    /** Controlled page, 1-based. Pair with `onPageChange`. */
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** Controlled rows per page. Pair with `onPageSizeChange`. */
    pageSize?: number;
    defaultPageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Renders a rows-per-page control in the footer. */
    rowsPerPageOptions?: number[];

    /** Set to `multiple` to add a checkbox column with select-all. Defaults to `none`. */
    selectionMode?: "none" | "multiple";
    /** Controlled selected row ids. Pair with `onSelectionChange`. */
    selectedIds?: string[];
    defaultSelectedIds?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
    /** Buttons rendered in the selected-count bar, e.g. a bulk export action. */
    selectionActions?: ReactNode;

    /** Shown when `data` is empty. */
    emptyState?: ReactNode;
    /** Shown when rows exist but the search or filters exclude all of them. */
    noResultsState?: ReactNode;

    className?: string;
}

const compare = (a: string | number, b: string | number) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

const matchesFilters = <T,>(row: T, filters: TableFilter<T>[], values: TableFilterValues) =>
    filters.every((filter) => {
        const selected = values[filter.id];
        if (!selected || selected.length === 0) return true;

        const rowValue = filter.getValue(row);
        const rowValues = Array.isArray(rowValue) ? rowValue : [rowValue];
        return rowValues.some((value) => selected.includes(value));
    });

export function DataTable<T>({
    "aria-label": ariaLabel,
    columns,
    data,
    getRowId,
    size = "md",
    tableClassName,
    title,
    description,
    badge,
    headerActions,
    sortDescriptor: controlledSort,
    defaultSortDescriptor,
    onSortChange,
    search,
    searchQuery: controlledSearchQuery,
    defaultSearchQuery = "",
    onSearchChange,
    filters,
    filterValues: controlledFilterValues,
    defaultFilterValues,
    onFilterChange,
    pagination = false,
    page: controlledPage,
    defaultPage = 1,
    onPageChange,
    pageSize: controlledPageSize,
    defaultPageSize = 10,
    onPageSizeChange,
    rowsPerPageOptions,
    selectionMode = "none",
    selectedIds: controlledSelectedIds,
    defaultSelectedIds,
    onSelectionChange,
    selectionActions,
    emptyState,
    noResultsState,
    className,
}: DataTableProps<T>) {
    const [sortDescriptor, setSortDescriptor] = useControllableState(controlledSort, defaultSortDescriptor ?? { column: columns[0]?.id ?? "", direction: "ascending" }, onSortChange);
    const [searchQuery, setSearchQuery] = useControllableState(controlledSearchQuery, defaultSearchQuery, onSearchChange);
    const [filterValues, setFilterValues] = useControllableState(controlledFilterValues, defaultFilterValues ?? {}, onFilterChange);
    const [page, setPage] = useControllableState(controlledPage, defaultPage, onPageChange);
    const [pageSize, setPageSize] = useControllableState(controlledPageSize, defaultPageSize, onPageSizeChange);
    const [selectedIds, setSelectedIds] = useControllableState(controlledSelectedIds, defaultSelectedIds ?? [], onSelectionChange);

    const visibleRows = useMemo(() => {
        let rows = data;

        const query = searchQuery.trim().toLowerCase();
        if (search && query) {
            rows = rows.filter((row) => search.getText(row).toLowerCase().includes(query));
        }

        if (filters && filters.length > 0) {
            rows = rows.filter((row) => matchesFilters(row, filters, filterValues));
        }

        const sortColumn = columns.find((column) => column.id === sortDescriptor.column);
        if (sortColumn?.sortValue) {
            const { sortValue } = sortColumn;
            rows = [...rows].sort((a, b) => {
                const result = compare(sortValue(a), sortValue(b));
                return sortDescriptor.direction === "descending" ? -result : result;
            });
        }

        return rows;
    }, [data, search, searchQuery, filters, filterValues, columns, sortDescriptor]);

    const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
    // Guard against a stale page left behind by a shrinking result set.
    const currentPage = Math.min(page, totalPages);
    const pageRows = pagination ? visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : visibleRows;

    const items = useMemo(() => pageRows.map((row) => ({ id: getRowId(row), value: row })), [pageRows, getRowId]);

    const isSelectable = selectionMode === "multiple";
    const pageIds = items.map((item) => item.id);
    // React Aria only knows about the rows on the current page, so selections made on
    // other pages are held here and merged back in on every change.
    const pageSelection = new Set(selectedIds.filter((id) => pageIds.includes(id)));

    const handleSelectionChange = (selection: Selection) => {
        const nextOnThisPage = selection === "all" ? pageIds : [...selection].map(String);
        setSelectedIds([...selectedIds.filter((id) => !pageIds.includes(id)), ...nextOnThisPage]);
    };

    const hasToolbar = Boolean(search) || (filters?.length ?? 0) > 0;
    const isFiltered = searchQuery.trim().length > 0 || Object.values(filterValues).some((values) => values.length > 0);

    const toolbar = hasToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {search && (
                <TableSearchInput
                    value={searchQuery}
                    onChange={(value) => {
                        setSearchQuery(value);
                        setPage(1);
                    }}
                    placeholder={search.placeholder}
                    aria-label={`Search ${ariaLabel.toLowerCase()}`}
                />
            )}
            {filters?.map((filter) => (
                <TableFilterDropdown
                    key={filter.id}
                    label={filter.label}
                    options={filter.options}
                    value={filterValues[filter.id] ?? []}
                    onChange={(values) => {
                        setFilterValues({ ...filterValues, [filter.id]: values });
                        setPage(1);
                    }}
                />
            ))}
        </div>
    );

    return (
        <TableCardRoot className={className}>
            {title != null ? (
                <TableCardHeader title={title} description={description} badge={badge === undefined ? visibleRows.length : badge} actions={headerActions}>
                    {toolbar}
                </TableCardHeader>
            ) : (
                hasToolbar && <div className="border-b border-secondary px-6 py-4">{toolbar}</div>
            )}

            {isSelectable && selectedIds.length > 0 && (
                <div className="flex flex-col gap-3 border-b border-secondary bg-secondary px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-secondary">
                        {selectedIds.length} {selectedIds.length === 1 ? "row" : "rows"} selected
                    </p>
                    <div className="flex items-center gap-3">
                        {selectionActions}
                        <Button color="link-gray" size="sm" onClick={() => setSelectedIds([])}>
                            Clear selection
                        </Button>
                    </div>
                </div>
            )}

            <TableRoot aria-label={ariaLabel} size={size} className={tableClassName} selectionMode={isSelectable ? "multiple" : undefined} selectedKeys={pageSelection} onSelectionChange={handleSelectionChange} sortDescriptor={sortDescriptor as SortDescriptor} onSortChange={(descriptor) => setSortDescriptor({ column: String(descriptor.column), direction: descriptor.direction })}>
                <TableHeader>
                    {isSelectable && (
                        <TableHead id="__selection" className="w-12 pr-0">
                            <Checkbox slot="selection" />
                        </TableHead>
                    )}
                    {columns.map((column) => (
                        <TableHead
                            key={column.id}
                            id={column.id}
                            isRowHeader={column.isRowHeader}
                            allowsSorting={Boolean(column.sortValue)}
                            align={column.align}
                            srOnlyLabel={column.srOnlyHeader}
                            className={column.headerClassName}
                        >
                            {column.header}
                        </TableHead>
                    ))}
                </TableHeader>

                <TableBody
                    items={items}
                    renderEmptyState={() => (
                        <div className="px-6 py-12 text-center text-sm text-tertiary">{(isFiltered ? noResultsState : emptyState) ?? "No rows to show"}</div>
                    )}
                >
                    {(item) => (
                        <TableRow>
                            {isSelectable && (
                                <TableCell className="w-12 pr-0">
                                    <Checkbox slot="selection" />
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell key={column.id} align={column.align} className={cx(column.cellClassName)}>
                                    {column.cell(item.value)}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableBody>
            </TableRoot>

            {pagination && (
                <TablePagination
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    pageSize={pageSize}
                    rowsPerPageOptions={rowsPerPageOptions}
                    onPageSizeChange={(next) => {
                        setPageSize(next);
                        setPage(1);
                    }}
                />
            )}
        </TableCardRoot>
    );
}
