import type { FC, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { ArrowDown, ArrowUp, BarChart10, Calendar } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { cx } from "@/utils/cx";
import { formatCurrency, formatDate } from "@/utils/format";
import { useControllableState } from "@/utils/use-controllable-state";
import { DataTable } from "./data-table";
import { TableCardHeader, TableCardRoot } from "./table";
import { TableFilterDropdown } from "./table-toolbar";
import type { TableColumn, TableSortDescriptor } from "./table-types";
import type { SalesHistoryView, SalesMonthStatus, SalesRecord } from "./sales-history-types";
import { SALES_MONTH_STATUS_COLORS, SALES_MONTH_STATUS_LABELS, SALES_SERIES_COLORS, formatSalesMonth, getSupplierSeries, toMonthKey } from "./sales-history-types";
import type { SalesChartMonth, SalesChartSeries } from "./sales-history-chart";
import { SalesHistoryChart } from "./sales-history-chart";
import type { SalesGridRow } from "./sales-history-grid";
import { SalesHistoryGrid } from "./sales-history-grid";

const MONTH_SORT: TableSortDescriptor = { column: "month", direction: "ascending" };
const SUPPLIER_SORT: TableSortDescriptor = { column: "amount", direction: "descending" };

const wholeDollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

const styles = {
    viewGroup: "flex shrink-0 gap-0.5 self-start rounded-lg bg-secondary_subtle p-1 ring-1 ring-secondary ring-inset sm:ml-auto",
    viewSegment: [
        "inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-secondary outline-brand transition-colors duration-100",
        "hover:bg-primary_hover hover:text-secondary_hover",
        "selected:bg-brand-solid selected:text-white selected:shadow-xs selected:hover:bg-brand-solid_hover",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
    ].join(" "),
};

type MonthRow = {
    id: string;
    month: string;
    status: SalesMonthStatus;
    /** Undefined when the month has not been uploaded. */
    amount?: number;
    uploadedDate?: string;
    previousMonthAmount?: number;
    lastYearAmount?: number;
    /** Fraction of the year's total, 0–1. */
    share: number;
};

type SupplierRow = {
    id: string;
    supplier: string;
    /** Fill class of the supplier's chart series. */
    colorClassName?: string;
    amount: number;
    /** Sales over the months that also have an upload last year, for a like-for-like comparison. */
    comparableAmount: number;
    lastYearAmount?: number;
    monthsWithSales: number;
    share: number;
};

/** Stands in for a value that cannot be shown, e.g. a month that has not been uploaded. */
const Blank: FC = () => (
    <span className="text-fg-quaternary" aria-label="Not available">
        —
    </span>
);

/** Percentage change between two amounts, with an arrow tinted by direction. */
const Change: FC<{ current?: number; previous?: number }> = ({ current, previous }) => {
    if (current === undefined || previous === undefined || previous === 0) return <Blank />;

    const change = (current - previous) / previous;
    const Icon = change > 0 ? ArrowUp : ArrowDown;

    return (
        <span
            className={cx(
                "inline-flex items-center justify-end gap-1 font-medium tabular-nums",
                change > 0 ? "text-utility-success-700" : change < 0 ? "text-utility-error-700" : "text-tertiary",
            )}
        >
            {change !== 0 && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
            <span className="sr-only">{change > 0 ? "Up" : change < 0 ? "Down" : "No change"}</span>
            {percent.format(Math.abs(change))}
        </span>
    );
};

/**
 * A row's share of the total, as a percentage with a bar beside it. The bar is scaled to the
 * largest row rather than the total, so the column reads as a bar chart down the table.
 */
const ShareBar: FC<{ share: number; maxShare: number }> = ({ share, maxShare }) => (
    <div className="flex items-center gap-3">
        <div className="h-2 w-full min-w-20 overflow-hidden rounded-full bg-quaternary" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-solid" style={{ width: `${maxShare > 0 ? (share / maxShare) * 100 : 0}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right tabular-nums">{percent.format(share)}</span>
    </div>
);

const Stat: FC<{ label: string; value: ReactNode; supporting?: ReactNode }> = ({ label, value, supporting }) => (
    <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <p className="truncate text-xl font-semibold text-primary tabular-nums">{value}</p>
        {supporting && <div className="text-sm text-tertiary">{supporting}</div>}
    </div>
);

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const maxShareOf = (rows: { share: number }[]) => Math.max(0, ...rows.map((row) => row.share));

const monthColumns = (year: number, maxShare: number): TableColumn<MonthRow>[] => [
    {
        id: "month",
        header: "Month",
        isRowHeader: true,
        sortValue: (row) => row.month,
        cellClassName: "whitespace-nowrap",
        cell: (row) => <span className="font-medium text-primary">{formatSalesMonth(row.month)}</span>,
    },
    {
        id: "amount",
        header: "Total sales",
        align: "right",
        sortValue: (row) => row.amount ?? -1,
        cellClassName: "whitespace-nowrap",
        cell: (row) => (row.amount === undefined ? <Blank /> : <span className="font-medium text-primary tabular-nums">{formatCurrency(row.amount)}</span>),
    },
    {
        id: "share",
        header: "Share of year",
        sortValue: (row) => row.share,
        headerClassName: "w-56",
        cell: (row) => (row.amount === undefined ? <Blank /> : <ShareBar share={row.share} maxShare={maxShare} />),
    },
    {
        id: "previousMonth",
        header: "vs prior month",
        align: "right",
        cellClassName: "whitespace-nowrap",
        cell: (row) => <Change current={row.amount} previous={row.previousMonthAmount} />,
    },
    {
        id: "lastYear",
        header: `vs ${year - 1}`,
        align: "right",
        cellClassName: "whitespace-nowrap",
        cell: (row) => <Change current={row.amount} previous={row.lastYearAmount} />,
    },
    {
        id: "status",
        header: "Upload",
        sortValue: (row) => (row.status === "missing" ? 0 : 1),
        cellClassName: "whitespace-nowrap",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <Badge color={SALES_MONTH_STATUS_COLORS[row.status]} size="sm" dot>
                    {SALES_MONTH_STATUS_LABELS[row.status]}
                </Badge>
                {row.uploadedDate && <span className="text-xs text-quaternary">{formatDate(row.uploadedDate)}</span>}
            </div>
        ),
    },
];

const supplierColumns = (year: number, maxShare: number): TableColumn<SupplierRow>[] => [
    {
        id: "supplier",
        header: "Supplier",
        isRowHeader: true,
        sortValue: (row) => row.supplier,
        cell: (row) => (
            <span className="flex items-center gap-2 font-medium text-primary">
                {row.colorClassName && <span className={cx("size-2 shrink-0 rounded-xs", row.colorClassName)} aria-hidden="true" />}
                {row.supplier}
            </span>
        ),
    },
    {
        id: "amount",
        header: `${year} sales`,
        align: "right",
        sortValue: (row) => row.amount,
        cellClassName: "whitespace-nowrap",
        cell: (row) => <span className="font-medium text-primary tabular-nums">{formatCurrency(row.amount)}</span>,
    },
    {
        id: "share",
        header: "Share of sales",
        sortValue: (row) => row.share,
        headerClassName: "w-56",
        cell: (row) => <ShareBar share={row.share} maxShare={maxShare} />,
    },
    {
        id: "average",
        header: "Avg. per month",
        align: "right",
        sortValue: (row) => (row.monthsWithSales > 0 ? row.amount / row.monthsWithSales : 0),
        cellClassName: "whitespace-nowrap tabular-nums",
        cell: (row) => (row.monthsWithSales > 0 ? formatCurrency(row.amount / row.monthsWithSales) : <Blank />),
    },
    {
        id: "lastYear",
        header: `vs ${year - 1}`,
        align: "right",
        cellClassName: "whitespace-nowrap",
        cell: (row) => <Change current={row.comparableAmount} previous={row.lastYearAmount} />,
    },
];

const EmptyState: FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary ring-inset">
            <BarChart10 className="size-5 text-fg-quaternary" />
        </div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-sm text-tertiary">{description}</p>
    </div>
);

const currentMonthKey = () => {
    const today = new Date();
    return toMonthKey(today.getFullYear(), today.getMonth() + 1);
};

export interface SalesHistoryTableProps {
    /** Uploaded monthly sales totals, across every year and supplier. */
    records: SalesRecord[];
    /** Selected year. Pass this to own the year state. */
    year?: number;
    /** Initial year when `year` is not provided. Defaults to the most recent year. */
    defaultYear?: number;
    onYearChange?: (year: number) => void;
    /**
     * Adds a By month / By supplier switch and a supplier filter. Defaults to on when any
     * record has a `supplier`, so programs that do not report by supplier never see it.
     */
    showSuppliers?: boolean;
    /** Initial view when suppliers are shown. Defaults to `month`. */
    defaultView?: SalesHistoryView;
    /**
     * The month in progress, as `YYYY-MM`. Earlier months are expected to have an upload and
     * show as "Not uploaded" when they do not. Defaults to the current calendar month.
     */
    currentMonth?: string;
    /**
     * Adds a monthly column chart above the table, stacked by supplier when the program
     * reports by supplier, with last year's monthly totals marked for comparison.
     */
    showChart?: boolean;
    /** Card title. Defaults to "Sales history". */
    title?: string;
    /** Supporting line under the title. */
    description?: string;
}

/**
 * Monthly sales history for one year. A summary row gives the year's total, its change
 * against the same months last year, the monthly average, the best month and how many
 * months have been uploaded. In programs that report by supplier, the table can switch
 * to a per-supplier breakdown, and the monthly view can be narrowed to chosen suppliers.
 */
export const SalesHistoryTable: FC<SalesHistoryTableProps> = ({
    records,
    year: controlledYear,
    defaultYear,
    onYearChange,
    showSuppliers,
    defaultView = "month",
    currentMonth = currentMonthKey(),
    showChart = false,
    title = "Sales history",
    description,
}) => {
    const [currentYear, currentMonthIndex] = currentMonth.split("-").map(Number);

    const years = useMemo(() => {
        const found = new Set(records.map((record) => Number(record.month.slice(0, 4))));
        found.add(currentYear);
        return [...found].sort((a, b) => b - a);
    }, [records, currentYear]);

    const suppliers = useMemo(
        () => [...new Set(records.flatMap((record) => (record.supplier ? [record.supplier] : [])))].sort(),
        [records],
    );
    const hasSuppliers = showSuppliers ?? suppliers.length > 0;
    const supplierSeries = useMemo(() => getSupplierSeries(records), [records]);

    // Default to the latest year that has data, so January does not open on an empty year.
    const latestYearWithData = years.find((candidate) => records.some((record) => record.month.startsWith(`${candidate}-`) && record.month < currentMonth));
    const [year, setYear] = useControllableState(controlledYear, defaultYear ?? latestYearWithData ?? currentYear, onYearChange);
    const [view, setView] = useState<SalesHistoryView>(defaultView);
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

    const activeView = hasSuppliers ? view : "month";

    const { monthRows, supplierRows, chart, grid, stats } = useMemo(() => {
        // The supplier filter narrows the monthly view only; the other views always show everyone.
        const inScope = (record: SalesRecord) =>
            activeView !== "month" || selectedSuppliers.length === 0 || (record.supplier !== undefined && selectedSuppliers.includes(record.supplier));

        const totals = new Map<string, number>();
        const uploads = new Map<string, string | undefined>();
        for (const record of records) {
            // Upload status reflects the whole upload, even when the supplier filter hides its rows.
            if (!uploads.has(record.month) || (record.uploadedDate && record.uploadedDate > (uploads.get(record.month) ?? ""))) {
                uploads.set(record.month, record.uploadedDate);
            }
            if (inScope(record)) totals.set(record.month, (totals.get(record.month) ?? 0) + record.amount);
        }

        const amountFor = (month: string) => (uploads.has(month) ? (totals.get(month) ?? 0) : undefined);

        // Only closed months are expected: every month of a past year, or the months before this one.
        const monthCount = year < currentYear ? 12 : year === currentYear ? currentMonthIndex - 1 : 0;
        const months = Array.from({ length: monthCount }, (_, index) => toMonthKey(year, index + 1));

        const yearTotal = sum(months.map((month) => amountFor(month) ?? 0));

        const monthRows: MonthRow[] = months.map((month, index) => {
            const amount = amountFor(month);
            const previousMonth = index === 0 ? toMonthKey(year - 1, 12) : months[index - 1];

            return {
                id: month,
                month,
                status: amount === undefined ? "missing" : "uploaded",
                amount,
                uploadedDate: uploads.get(month),
                previousMonthAmount: amountFor(previousMonth),
                lastYearAmount: amountFor(toMonthKey(year - 1, index + 1)),
                share: yearTotal > 0 && amount !== undefined ? amount / yearTotal : 0,
            };
        });

        const uploadedRows = monthRows.filter((row) => row.amount !== undefined);
        // Compare against last year over the same months only, so a part-year is not set against a full one.
        const comparableRows = uploadedRows.filter((row) => row.lastYearAmount !== undefined);
        const bestRow = uploadedRows.reduce<MonthRow | undefined>((best, row) => (!best || (row.amount ?? 0) > (best.amount ?? 0) ? row : best), undefined);

        const supplierTotal = (supplier: string, monthKeys: string[]) =>
            sum(records.filter((record) => record.supplier === supplier && monthKeys.includes(record.month)).map((record) => record.amount));
        const comparableMonths = comparableRows.map((row) => row.month);
        const comparableLastYearMonths = comparableMonths.map((month) => toMonthKey(year - 1, Number(month.slice(5))));

        const colorFor = (supplier: string) => supplierSeries.series.find((item) => item.id === supplierSeries.seriesBySupplier.get(supplier))?.colorClassName;

        const supplierRows: SupplierRow[] = suppliers.map((supplier) => {
            const amount = supplierTotal(supplier, months);
            const lastYearAmount = comparableMonths.length > 0 ? supplierTotal(supplier, comparableLastYearMonths) : undefined;

            return {
                id: supplier,
                supplier,
                colorClassName: colorFor(supplier),
                amount,
                comparableAmount: supplierTotal(supplier, comparableMonths),
                lastYearAmount,
                monthsWithSales: months.filter((month) => supplierTotal(supplier, [month]) > 0).length,
                share: yearTotal > 0 ? amount / yearTotal : 0,
            };
        });

        // The chart always spans the whole year, so its axis does not shift as months are uploaded.
        const chartSeries: SalesChartSeries[] = hasSuppliers ? supplierSeries.series : [{ id: "total", label: "Sales", colorClassName: SALES_SERIES_COLORS[0] }];
        const chartMonths: SalesChartMonth[] = Array.from({ length: 12 }, (_, index) => {
            const month = toMonthKey(year, index + 1);
            const amounts: Record<string, number> = {};
            for (const record of records) {
                if (record.month !== month || !inScope(record)) continue;
                const seriesId = hasSuppliers && record.supplier ? (supplierSeries.seriesBySupplier.get(record.supplier) ?? record.supplier) : "total";
                amounts[seriesId] = (amounts[seriesId] ?? 0) + record.amount;
            }

            return {
                month,
                status: month >= currentMonth ? "upcoming" : uploads.has(month) ? "uploaded" : "missing",
                amounts,
                lastYear: amountFor(toMonthKey(year - 1, index + 1)),
            };
        });

        const gridRows: SalesGridRow[] = suppliers.map((supplier) => ({
            supplier,
            colorClassName: colorFor(supplier),
            amounts: Object.fromEntries(months.map((month) => [month, supplierTotal(supplier, [month])])),
        }));

        return {
            monthRows,
            supplierRows,
            chart: { series: chartSeries, months: chartMonths },
            grid: { months: months.map((month) => ({ month, isUploaded: uploads.has(month) })), rows: gridRows },
            stats: {
                yearTotal,
                comparableTotal: sum(comparableRows.map((row) => row.amount ?? 0)),
                comparableLastYear: comparableRows.length > 0 ? sum(comparableRows.map((row) => row.lastYearAmount ?? 0)) : undefined,
                average: uploadedRows.length > 0 ? yearTotal / uploadedRows.length : undefined,
                best: bestRow,
                uploadedCount: uploadedRows.length,
                expectedCount: monthRows.length,
                missing: monthRows.filter((row) => row.status === "missing"),
            },
        };
    }, [records, year, currentYear, currentMonth, currentMonthIndex, suppliers, supplierSeries, hasSuppliers, selectedSuppliers, activeView]);

    const yearSelect = (
        <Select
            aria-label="Year"
            size="sm"
            icon={Calendar}
            className="w-32"
            items={years.map((option) => ({ id: option, label: String(option) }))}
            selectedKey={year}
            onSelectionChange={(key) => key != null && setYear(Number(key))}
        >
            {(item) => <SelectItem id={item.id} label={item.label} />}
        </Select>
    );

    const toolbar = hasSuppliers && (
        <>
            {activeView === "month" && (
                <TableFilterDropdown
                    label="Supplier"
                    options={suppliers.map((supplier) => ({ value: supplier, label: supplier }))}
                    value={selectedSuppliers}
                    onChange={setSelectedSuppliers}
                />
            )}
            <ToggleButtonGroup
                aria-label="View sales by"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[activeView]}
                onSelectionChange={(keys) => {
                    const [next] = [...keys];
                    if (next) setView(next as SalesHistoryView);
                }}
                className={styles.viewGroup}
            >
                <ToggleButton id="month" className={styles.viewSegment}>
                    By month
                </ToggleButton>
                <ToggleButton id="supplier" className={styles.viewSegment}>
                    By supplier
                </ToggleButton>
                <ToggleButton id="grid" className={styles.viewSegment}>
                    Grid
                </ToggleButton>
            </ToggleButtonGroup>
        </>
    );

    const yearOverYear = stats.comparableLastYear ? (stats.comparableTotal - stats.comparableLastYear) / stats.comparableLastYear : undefined;

    const summary = stats.uploadedCount > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-secondary px-6 py-5 lg:grid-cols-4">
            <Stat
                label={`${year} total sales`}
                value={wholeDollars.format(stats.yearTotal)}
                supporting={
                    yearOverYear === undefined ? (
                        `No ${year - 1} sales to compare`
                    ) : (
                        <span className="inline-flex flex-wrap items-center gap-1">
                            <Change current={stats.comparableTotal} previous={stats.comparableLastYear} />
                            <span>vs same months in {year - 1}</span>
                        </span>
                    )
                }
            />
            <Stat label="Monthly average" value={stats.average === undefined ? "—" : wholeDollars.format(stats.average)} supporting={`Across ${stats.uploadedCount} uploaded ${stats.uploadedCount === 1 ? "month" : "months"}`} />
            <Stat
                label="Best month"
                value={stats.best ? formatSalesMonth(stats.best.month) : "—"}
                supporting={stats.best?.amount !== undefined && wholeDollars.format(stats.best.amount)}
            />
            <Stat
                label="Months uploaded"
                value={`${stats.uploadedCount} of ${stats.expectedCount}`}
                supporting={
                    stats.missing.length === 0 ? (
                        <span className="text-utility-success-700">All caught up</span>
                    ) : (
                        <span className="text-utility-warning-700">Missing {stats.missing.map((row) => formatSalesMonth(row.month, true)).join(", ")}</span>
                    )
                }
            />
        </div>
    );

    const emptyState =
        records.length === 0 ? (
            <EmptyState title="No sales uploaded yet" description="Once you upload your monthly sales, each month's total will show up here." />
        ) : (
            <EmptyState title={`No sales for ${year} yet`} description={`${formatSalesMonth(currentMonth)} sales can be uploaded once the month ends.`} />
        );

    const hasData = stats.uploadedCount > 0;
    const aboveTable = (
        <>
            {summary}
            {showChart && hasData && <SalesHistoryChart year={year} series={chart.series} months={chart.months} />}
        </>
    );

    if (activeView === "grid") {
        return (
            <TableCardRoot>
                <TableCardHeader title={title} description={description} actions={yearSelect}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{toolbar}</div>
                </TableCardHeader>
                {aboveTable}
                {hasData ? <SalesHistoryGrid year={year} months={grid.months} rows={grid.rows} /> : <div className="px-6 py-12 text-center">{emptyState}</div>}
            </TableCardRoot>
        );
    }

    const shared = {
        title,
        description,
        badge: null,
        headerActions: yearSelect,
        toolbarActions: toolbar || undefined,
        summary: aboveTable,
        emptyState,
        tableClassName: "min-w-4xl",
    };

    return activeView === "supplier" ? (
        <DataTable
            key="supplier"
            {...shared}
            aria-label={`${year} sales by supplier`}
            columns={supplierColumns(year, maxShareOf(supplierRows))}
            data={supplierRows}
            getRowId={(row) => row.id}
            defaultSortDescriptor={SUPPLIER_SORT}
        />
    ) : (
        <DataTable
            key="month"
            {...shared}
            aria-label={`${year} sales by month`}
            columns={monthColumns(year, maxShareOf(monthRows))}
            data={monthRows}
            getRowId={(row) => row.id}
            defaultSortDescriptor={MONTH_SORT}
        />
    );
};
