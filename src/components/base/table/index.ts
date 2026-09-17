import { TableBody, TableCardHeader, TableCardRoot, TableCell, TableHead, TableHeader, TableRoot, TableRow } from "./table";

/** Composable table primitives, e.g. `<Table.Root><Table.Header><Table.Head/>…`. */
export const Table = {
    Root: TableRoot,
    Header: TableHeader,
    Head: TableHead,
    Body: TableBody,
    Row: TableRow,
    Cell: TableCell,
};

/** Card shell that wraps a table with a title, description, badge and toolbar. */
export const TableCard = {
    Root: TableCardRoot,
    Header: TableCardHeader,
};

export { TableBody, TableCardHeader, TableCardRoot, TableCell, TableHead, TableHeader, TableRoot, TableRow } from "./table";
export type { TableAlign, TableSize } from "./table";

export { DataTable } from "./data-table";
export type { DataTableProps } from "./data-table";

export { TablePagination } from "./table-pagination";
export { TableFilterDropdown, TableSearchInput } from "./table-toolbar";

export type { SortDirection, TableColumn, TableFilter, TableFilterOption, TableFilterValues, TableSearchConfig, TableSortDescriptor } from "./table-types";

export { PromotionsTable } from "./promotions-table";
export type { PromotionsTableProps } from "./promotions-table";
export type { Promotion, PromotionStatus } from "./promotions-types";
export { PROMOTION_STATUS_COLORS, PROMOTION_STATUS_LABELS, formatPointsMultiplier, formatPromotionDate } from "./promotions-types";

export { SalesSubmissionsTable } from "./sales-submissions-table";
export type { SalesSubmissionsTableProps } from "./sales-submissions-table";
export type { SalesSubmission, SalesSubmissionStatus } from "./sales-submissions-types";
export { SALES_SUBMISSION_STATUS_COLORS, SALES_SUBMISSION_STATUS_LABELS } from "./sales-submissions-types";

export { BookingHistoryTable } from "./booking-history-table";
export type { BookingHistoryTableProps } from "./booking-history-table";
export type { Booking, BookingStatus } from "./booking-history-types";
export { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "./booking-history-types";
