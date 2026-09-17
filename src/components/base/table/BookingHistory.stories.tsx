import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookingHistoryTable } from "./booking-history-table";
import type { Booking } from "./booking-history-types";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const bookings: Booking[] = [
    {
        id: "mvp01",
        hotel: "Loews Regency New York",
        company: "Conference Group",
        arrivalDate: "2026-10-12",
        departureDate: "2026-10-15",
        reservationId: "MVP01",
        estimatedRewardPoints: 18500,
        status: "complete",
    },
    {
        id: "mvp02",
        hotel: "Loews Atlanta Hotel",
        company: "Meridian Events Group",
        arrivalDate: "2026-11-03",
        departureDate: "2026-11-06",
        reservationId: "MVP02",
        estimatedRewardPoints: 12250,
        status: "pending",
    },
    {
        id: "mvp03",
        hotel: "Loews Chicago Hotel",
        company: "Summit Planning Partners",
        arrivalDate: "2026-09-28",
        departureDate: "2026-10-01",
        reservationId: "MVP03",
        estimatedRewardPoints: 9400,
        status: "complete",
    },
    {
        id: "mvp04",
        hotel: "Loews Coronado Bay Resort",
        company: "Conference Group",
        arrivalDate: "2026-12-07",
        departureDate: "2026-12-11",
        reservationId: "MVP04",
        estimatedRewardPoints: 27800,
        status: "pending",
    },
    {
        id: "mvp05",
        hotel: "Loews Vanderbilt Hotel",
        company: "Brightline Meetings",
        arrivalDate: "2026-08-17",
        departureDate: "2026-08-20",
        reservationId: "MVP05",
        estimatedRewardPoints: 6150,
        status: "rejected",
    },
    {
        id: "mvp06",
        hotel: "Loews Miami Beach Hotel",
        company: "Atlas Incentives",
        arrivalDate: "2026-09-08",
        departureDate: "2026-09-12",
        reservationId: "MVP06",
        estimatedRewardPoints: 21300,
        status: "complete",
    },
    {
        id: "mvp07",
        hotel: "Loews Philadelphia Hotel",
        company: "Conference Group",
        arrivalDate: "2026-07-21",
        departureDate: "2026-07-23",
        reservationId: "MVP07",
        estimatedRewardPoints: 4875,
        status: "complete",
    },
    {
        id: "mvp08",
        hotel: "Loews Regency New York",
        company: "Northstar Travel Collective",
        arrivalDate: "2027-01-19",
        departureDate: "2027-01-22",
        reservationId: "MVP08",
        estimatedRewardPoints: 16900,
        status: "pending",
    },
];

/** Enough rows to exercise pagination and the hotel filter. */
const manyBookings: Booking[] = [
    ...bookings,
    ...Array.from({ length: 20 }, (_, index) => {
        const hotels = [
            "Loews Regency New York",
            "Loews Atlanta Hotel",
            "Loews Chicago Hotel",
            "Loews Hollywood Hotel",
            "Loews New Orleans Hotel",
            "Loews Kansas City Hotel",
        ];
        const companies = ["Conference Group", "Meridian Events Group", "Summit Planning Partners", "Atlas Incentives"];
        const month = String((index % 12) + 1).padStart(2, "0");
        const arrivalDay = String((index % 20) + 1).padStart(2, "0");
        const departureDay = String((index % 20) + 4).padStart(2, "0");

        return {
            id: `mvp${index + 9}`,
            hotel: hotels[index % hotels.length],
            company: companies[index % companies.length],
            arrivalDate: `2026-${month}-${arrivalDay}`,
            departureDate: `2026-${month}-${departureDay}`,
            reservationId: `MVP${String(index + 9).padStart(2, "0")}`,
            estimatedRewardPoints: 3500 + index * 1275,
            status: (["complete", "pending", "rejected"] as const)[index % 3],
        } satisfies Booking;
    }),
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Tables/Booking History",
    component: BookingHistoryTable,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof BookingHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Sortable columns, search across hotel, company and reservation ID, plus hotel and status filters. */
export const Default: Story = {
    args: {
        bookings,
        description: "Group room bookings for meetings and events, newest arrival first.",
    },
};

/** Twenty-eight rows at five per page, across six properties. */
export const Paginated: Story = {
    args: {
        bookings: manyBookings,
        description: "Every group booking on record for your properties.",
        defaultPageSize: 5,
        rowsPerPageOptions: [5, 10, 25, 50],
    },
};

/** A single property, showing how the hotel filter narrows to what the data contains. */
export const SingleProperty: Story = {
    args: {
        bookings: bookings.filter((booking) => booking.hotel === "Loews Regency New York"),
        title: "Loews Regency New York",
        description: "Group bookings at this property.",
    },
};

/** With nothing booked yet, the table falls back to its empty state. */
export const Empty: Story = {
    args: {
        bookings: [],
    },
};
