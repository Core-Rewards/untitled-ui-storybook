import type { FC } from "react";
import { formatCurrency } from "@/utils/format";
import { cx } from "@/utils/cx";
import { TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from "./table";
import { formatSalesMonth } from "./sales-history-types";

const compactCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

/** Lightest and darkest brand tint used to shade a cell, as a percentage mixed into the surface. */
const SHADE_RANGE = [4, 32];

export type SalesGridMonth = {
    /** `YYYY-MM`. */
    month: string;
    /** False when the month has not been uploaded. */
    isUploaded: boolean;
};

export type SalesGridRow = {
    supplier: string;
    /** Fill class for the supplier's chart series, shown as a swatch beside the name. */
    colorClassName?: string;
    /** Sales keyed by `YYYY-MM`. */
    amounts: Record<string, number>;
};

interface SalesHistoryGridProps {
    year: number;
    months: SalesGridMonth[];
    rows: SalesGridRow[];
}

const rowTotal = (row: SalesGridRow) => Object.values(row.amounts).reduce((total, amount) => total + amount, 0);

const stickyColumn = "sticky left-0 z-10";

/**
 * Suppliers down the side, months across the top. Each cell is shaded on a single brand
 * hue by its amount, so a supplier's seasonality reads across the row and a month's split
 * reads down the column. Amounts are compact; the full figure is in the cell's title.
 */
export const SalesHistoryGrid: FC<SalesHistoryGridProps> = ({ year, months, rows }) => {
    const sortedRows = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a));
    const maxCell = Math.max(0, ...rows.flatMap((row) => Object.values(row.amounts)));
    const monthTotal = (month: string) => rows.reduce((total, row) => total + (row.amounts[month] ?? 0), 0);
    const grandTotal = rows.reduce((total, row) => total + rowTotal(row), 0);

    const shade = (amount: number) => {
        if (maxCell === 0 || amount === 0) return undefined;
        const strength = SHADE_RANGE[0] + (amount / maxCell) * (SHADE_RANGE[1] - SHADE_RANGE[0]);
        return `color-mix(in oklab, var(--color-brand-600) ${strength.toFixed(1)}%, transparent)`;
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-3 border-b border-secondary px-6 py-3 text-xs text-tertiary">
                <span>Shading shows each supplier's monthly sales</span>
                <span className="flex items-center gap-1.5" aria-hidden="true">
                    Lower
                    <span className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(to right, ${shade(maxCell * 0.01) ?? "transparent"}, ${shade(maxCell)})` }} />
                    Higher
                </span>
            </div>

            <TableRoot aria-label={`${year} sales by supplier and month`} size="sm" className="min-w-max">
                <TableHeader>
                    <TableHead id="supplier" isRowHeader className={cx(stickyColumn, "bg-secondary")}>
                        Supplier
                    </TableHead>
                    {months.map(({ month, isUploaded }) => (
                        <TableHead key={month} id={month} align="right" className="px-3">
                            <span className="inline-flex items-center gap-1">
                                {!isUploaded && <span className="size-1.5 rounded-full bg-utility-warning-500" aria-hidden="true" />}
                                {formatSalesMonth(month, true)}
                                {!isUploaded && <span className="sr-only">, not uploaded</span>}
                            </span>
                        </TableHead>
                    ))}
                    <TableHead id="total" align="right">
                        {year} total
                    </TableHead>
                </TableHeader>

                <TableBody>
                    {sortedRows.map((row) => (
                        <TableRow key={row.supplier} id={row.supplier}>
                            <TableCell className={cx(stickyColumn, "bg-primary whitespace-nowrap")}>
                                <span className="flex items-center gap-2 font-medium text-primary">
                                    {row.colorClassName && <span className={cx("size-2 shrink-0 rounded-xs", row.colorClassName)} aria-hidden="true" />}
                                    {row.supplier}
                                </span>
                            </TableCell>
                            {months.map(({ month, isUploaded }) => {
                                const amount = row.amounts[month];

                                return (
                                    <TableCell key={month} align="right" className="p-1 tabular-nums">
                                        {isUploaded ? (
                                            <span
                                                className="block rounded-md px-2 py-2 text-secondary"
                                                style={{ backgroundColor: shade(amount ?? 0) }}
                                                title={formatCurrency(amount ?? 0)}
                                            >
                                                {compactCurrency.format(amount ?? 0)}
                                            </span>
                                        ) : (
                                            <span className="block px-2 py-2 text-fg-quaternary" aria-label="Not uploaded">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                );
                            })}
                            <TableCell align="right" className="font-semibold whitespace-nowrap text-primary tabular-nums">
                                {formatCurrency(rowTotal(row))}
                            </TableCell>
                        </TableRow>
                    ))}

                    <TableRow id="__total" className="bg-secondary hover:bg-secondary">
                        <TableCell className={cx(stickyColumn, "bg-secondary font-semibold text-primary")}>Total</TableCell>
                        {months.map(({ month, isUploaded }) => (
                            <TableCell key={month} align="right" className="px-3 font-semibold text-primary tabular-nums">
                                {isUploaded ? <span title={formatCurrency(monthTotal(month))}>{compactCurrency.format(monthTotal(month))}</span> : <span className="text-fg-quaternary">—</span>}
                            </TableCell>
                        ))}
                        <TableCell align="right" className="font-semibold whitespace-nowrap text-primary tabular-nums">
                            {formatCurrency(grandTotal)}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </TableRoot>
        </div>
    );
};
