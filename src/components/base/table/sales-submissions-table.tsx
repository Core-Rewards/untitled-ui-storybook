import type { FC, ReactNode } from "react";
import { FileSearch02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";
import { DataTable } from "./data-table";
import type { TableColumn, TableFilter, TableSortDescriptor } from "./table-types";
import type { SalesSubmission } from "./sales-submissions-types";
import { SALES_SUBMISSION_STATUS_COLORS, SALES_SUBMISSION_STATUS_LABELS, SALES_SUBMISSION_STATUS_RANK } from "./sales-submissions-types";

const DEFAULT_SORT: TableSortDescriptor = { column: "quoteCreatedDate", direction: "descending" };

/** Stands in for data a submission does not have yet, e.g. before the quote becomes an ABB order. */
const Blank: FC = () => (
    <span className="text-fg-quaternary" aria-label="Not available">
        —
    </span>
);

const statusFilter: TableFilter<SalesSubmission> = {
    id: "status",
    label: "Status",
    options: Object.entries(SALES_SUBMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    getValue: (submission) => submission.status,
};

const columns: TableColumn<SalesSubmission>[] = [
    {
        id: "quoteNumber",
        header: "Quote #",
        isRowHeader: true,
        sortValue: (submission) => submission.quoteNumber,
        cellClassName: "whitespace-nowrap",
        cell: (submission) => <span className="font-medium text-primary">{submission.quoteNumber}</span>,
    },
    {
        id: "quoteCreatedDate",
        header: "Quote creation date",
        sortValue: (submission) => submission.quoteCreatedDate,
        cellClassName: "whitespace-nowrap",
        cell: (submission) => formatDate(submission.quoteCreatedDate),
    },
    {
        id: "quoteAmount",
        header: "Quote amount",
        align: "right",
        sortValue: (submission) => submission.quoteAmount,
        cellClassName: "whitespace-nowrap",
        cell: (submission) => formatCurrency(submission.quoteAmount),
    },
    {
        id: "abbOrderNumber",
        header: "ABB order #",
        sortValue: (submission) => submission.abbOrderNumber ?? "",
        cellClassName: "whitespace-nowrap",
        cell: (submission) => submission.abbOrderNumber ?? <Blank />,
    },
    {
        id: "abbOrderDate",
        header: "ABB order date",
        sortValue: (submission) => submission.abbOrderDate ?? "",
        cellClassName: "whitespace-nowrap",
        cell: (submission) => (submission.abbOrderDate ? formatDate(submission.abbOrderDate) : <Blank />),
    },
    {
        id: "abbOrderAmount",
        header: "ABB order amount",
        align: "right",
        sortValue: (submission) => submission.abbOrderAmount ?? -1,
        cellClassName: "whitespace-nowrap",
        cell: (submission) => (submission.abbOrderAmount === undefined ? <Blank /> : formatCurrency(submission.abbOrderAmount)),
    },
    {
        id: "eligibleOrderAmount",
        header: "Eligible order amount",
        align: "right",
        sortValue: (submission) => submission.eligibleOrderAmount ?? -1,
        cellClassName: "whitespace-nowrap",
        cell: (submission) => (submission.eligibleOrderAmount === undefined ? <Blank /> : formatCurrency(submission.eligibleOrderAmount)),
    },
    {
        id: "pointValue",
        header: "Point value",
        align: "right",
        sortValue: (submission) => submission.pointValue ?? -1,
        cellClassName: "whitespace-nowrap",
        cell: (submission) =>
            submission.pointValue === undefined ? <Blank /> : <span className="font-medium text-primary">{formatNumber(submission.pointValue)}</span>,
    },
    {
        id: "status",
        header: "Status",
        sortValue: (submission) => SALES_SUBMISSION_STATUS_RANK[submission.status],
        cellClassName: "whitespace-nowrap",
        cell: (submission) => (
            <Badge color={SALES_SUBMISSION_STATUS_COLORS[submission.status]} size="sm" dot>
                {SALES_SUBMISSION_STATUS_LABELS[submission.status]}
            </Badge>
        ),
    },
];

const EmptyState: FC = () => (
    <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary ring-inset">
            <FileSearch02 className="size-5 text-fg-quaternary" />
        </div>
        <p className="text-sm font-semibold text-primary">No submissions yet</p>
        <p className="text-sm text-tertiary">Quotes you submit will show up here with their point value once they are processed.</p>
    </div>
);

export interface SalesSubmissionsTableProps {
    /** Submissions to show. */
    submissions: SalesSubmission[];
    /** Selected submission ids. Pass this to own selection state. */
    selectedIds?: string[];
    /** Initially selected ids when `selectedIds` is not provided. */
    defaultSelectedIds?: string[];
    /** Called with the full selected id list whenever it changes. */
    onSelectionChange?: (selectedIds: string[]) => void;
    /** Buttons rendered in the selected-count bar, e.g. a bulk export action. */
    selectionActions?: ReactNode;
    /** Card title. Defaults to "Sales submissions". */
    title?: string;
    /** Supporting line under the title. */
    description?: string;
    /** Rows per page. Defaults to 10. */
    defaultPageSize?: number;
    /** Rows-per-page choices in the footer. Defaults to 10, 25, 50 and 100. */
    rowsPerPageOptions?: number[];
}

/**
 * Sales submissions table with checkbox selection, sortable columns, a search and
 * status filter toolbar, and pagination. Submissions that have not become an ABB
 * order yet show a dash in the order and eligibility columns.
 */
export const SalesSubmissionsTable: FC<SalesSubmissionsTableProps> = ({
    submissions,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
    selectionActions,
    title = "Sales submissions",
    description,
    defaultPageSize = 10,
    rowsPerPageOptions = [10, 25, 50, 100],
}) => (
    <DataTable
        aria-label="Sales submissions"
        title={title}
        description={description}
        columns={columns}
        data={submissions}
        getRowId={(submission) => submission.id}
        defaultSortDescriptor={DEFAULT_SORT}
        search={{ placeholder: "Search quote or order #", getText: (submission) => `${submission.quoteNumber} ${submission.abbOrderNumber ?? ""}` }}
        filters={[statusFilter]}
        selectionMode="multiple"
        selectedIds={selectedIds}
        defaultSelectedIds={defaultSelectedIds}
        onSelectionChange={onSelectionChange}
        selectionActions={selectionActions}
        pagination
        defaultPageSize={defaultPageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        emptyState={<EmptyState />}
        noResultsState="No submissions match your search."
        tableClassName="min-w-5xl"
    />
);
