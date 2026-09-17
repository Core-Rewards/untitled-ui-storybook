import type { FC } from "react";
import { CalendarCheck01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { formatDate, formatNumber } from "@/utils/format";
import { DataTable } from "./data-table";
import type { TableColumn, TableFilter, TableSortDescriptor } from "./table-types";
import type { Booking } from "./booking-history-types";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, BOOKING_STATUS_RANK } from "./booking-history-types";

const DEFAULT_SORT: TableSortDescriptor = { column: "arrivalDate", direction: "descending" };

const statusFilter: TableFilter<Booking> = {
    id: "status",
    label: "Status",
    options: Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    getValue: (booking) => booking.status,
};

/** Builds the hotel filter from the properties actually present in the data. */
const createHotelFilter = (bookings: Booking[]): TableFilter<Booking> => ({
    id: "hotel",
    label: "Hotel",
    options: [...new Set(bookings.map((booking) => booking.hotel))].sort().map((hotel) => ({ value: hotel, label: hotel })),
    getValue: (booking) => booking.hotel,
});

const columns: TableColumn<Booking>[] = [
    {
        id: "hotel",
        header: "Hotel",
        isRowHeader: true,
        sortValue: (booking) => booking.hotel,
        headerClassName: "w-72",
        cell: (booking) => <span className="font-medium text-primary">{booking.hotel}</span>,
    },
    {
        id: "company",
        header: "Company",
        sortValue: (booking) => booking.company,
        headerClassName: "w-56",
        cell: (booking) => booking.company,
    },
    {
        id: "arrivalDate",
        header: "Arrival date",
        sortValue: (booking) => booking.arrivalDate,
        cellClassName: "whitespace-nowrap",
        cell: (booking) => formatDate(booking.arrivalDate),
    },
    {
        id: "departureDate",
        header: "Departure date",
        sortValue: (booking) => booking.departureDate,
        cellClassName: "whitespace-nowrap",
        cell: (booking) => formatDate(booking.departureDate),
    },
    {
        id: "reservationId",
        header: "Reservation ID",
        sortValue: (booking) => booking.reservationId,
        cellClassName: "whitespace-nowrap",
        cell: (booking) => booking.reservationId,
    },
    {
        id: "estimatedRewardPoints",
        header: "Est. reward points",
        align: "right",
        sortValue: (booking) => booking.estimatedRewardPoints,
        cellClassName: "whitespace-nowrap",
        cell: (booking) => <span className="font-medium text-primary">{formatNumber(booking.estimatedRewardPoints)}</span>,
    },
    {
        id: "status",
        header: "Status",
        sortValue: (booking) => BOOKING_STATUS_RANK[booking.status],
        cellClassName: "whitespace-nowrap",
        cell: (booking) => (
            <Badge color={BOOKING_STATUS_COLORS[booking.status]} size="sm" dot>
                {BOOKING_STATUS_LABELS[booking.status]}
            </Badge>
        ),
    },
];

const EmptyState: FC = () => (
    <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary ring-inset">
            <CalendarCheck01 className="size-5 text-fg-quaternary" />
        </div>
        <p className="text-sm font-semibold text-primary">No bookings yet</p>
        <p className="text-sm text-tertiary">Group room bookings for meetings and events will appear here once they are submitted.</p>
    </div>
);

export interface BookingHistoryTableProps {
    /** Bookings to show. */
    bookings: Booking[];
    /** Card title. Defaults to "Booking history". */
    title?: string;
    /** Supporting line under the title. */
    description?: string;
    /** Rows per page. Defaults to 10. */
    defaultPageSize?: number;
    /** Rows-per-page choices in the footer. Defaults to 10, 25, 50 and 100. */
    rowsPerPageOptions?: number[];
}

/**
 * Booking history for meetings and events group rooms, with sortable columns, a
 * search box, hotel and status filters, and pagination. Rows are read-only.
 */
export const BookingHistoryTable: FC<BookingHistoryTableProps> = ({
    bookings,
    title = "Booking history",
    description,
    defaultPageSize = 10,
    rowsPerPageOptions = [10, 25, 50, 100],
}) => (
    <DataTable
        aria-label="Booking history"
        title={title}
        description={description}
        columns={columns}
        data={bookings}
        getRowId={(booking) => booking.id}
        defaultSortDescriptor={DEFAULT_SORT}
        search={{
            placeholder: "Search hotel, company or ID",
            getText: (booking) => `${booking.hotel} ${booking.company} ${booking.reservationId}`,
        }}
        filters={[createHotelFilter(bookings), statusFilter]}
        pagination
        defaultPageSize={defaultPageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        emptyState={<EmptyState />}
        noResultsState="No bookings match your search."
        tableClassName="min-w-4xl"
    />
);
