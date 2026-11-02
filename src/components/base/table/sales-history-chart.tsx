import type { FC } from "react";
import { useState } from "react";
import { cx } from "@/utils/cx";
import { formatCurrency } from "@/utils/format";
import { formatSalesMonth } from "./sales-history-types";

const compactCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

/** Plot height in pixels, excluding the month labels. */
const PLOT_HEIGHT = 208;

export type SalesChartSeries = {
    id: string;
    label: string;
    /** Fill class for the series' bars and legend swatch. */
    colorClassName: string;
};

export type SalesChartMonth = {
    /** `YYYY-MM`. */
    month: string;
    /** `upcoming` months have not ended yet, so they are not expected to have an upload. */
    status: "uploaded" | "missing" | "upcoming";
    /** Sales keyed by series id. */
    amounts: Record<string, number>;
    /** The same month's total last year, drawn as a marker for comparison. */
    lastYear?: number;
};

interface SalesHistoryChartProps {
    year: number;
    series: SalesChartSeries[];
    months: SalesChartMonth[];
}

const monthTotal = (month: SalesChartMonth) => Object.values(month.amounts).reduce((total, amount) => total + amount, 0);

/** Rounds up to a clean axis maximum and splits it into four even steps. */
const niceTicks = (max: number) => {
    if (max <= 0) return [0];
    const rawStep = max / 4;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const step = [1, 2, 2.5, 5, 10].map((multiple) => multiple * magnitude).find((candidate) => candidate >= rawStep) ?? rawStep;
    return Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) => index * step);
};

const Swatch: FC<{ className: string }> = ({ className }) => <span className={cx("size-2.5 shrink-0 rounded-xs", className)} aria-hidden="true" />;

/** Short horizontal key matching the last-year marker drawn on each column. */
const LastYearKey: FC = () => <span className="h-0.5 w-3.5 shrink-0 rounded-full bg-fg-quaternary" aria-hidden="true" />;

/**
 * Monthly sales as columns, stacked by series when there is more than one. A short marker
 * on each column shows the same month last year. Hover or focus a month for its breakdown;
 * the table below the chart carries every value.
 */
export const SalesHistoryChart: FC<SalesHistoryChartProps> = ({ year, series, months }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const totals = months.map(monthTotal);
    const hasLastYear = months.some((month) => month.lastYear !== undefined);
    const ticks = niceTicks(Math.max(0, ...totals, ...months.map((month) => month.lastYear ?? 0)));
    const axisMax = ticks[ticks.length - 1] || 1;
    const toPercent = (value: number) => (value / axisMax) * 100;

    const bestIndex = totals.reduce((best, total, index) => (months[index].status === "uploaded" && total > (totals[best] ?? -1) ? index : best), -1);
    const active = activeIndex === null ? undefined : months[activeIndex];

    const describe = (month: SalesChartMonth, index: number) => {
        const name = `${formatSalesMonth(month.month)} ${year}`;
        if (month.status === "missing") return `${name}: not uploaded`;
        if (month.status === "upcoming") return `${name}: not yet due`;
        const lastYear = month.lastYear === undefined ? "" : `, ${year - 1}: ${formatCurrency(month.lastYear)}`;
        return `${name}: ${formatCurrency(totals[index])}${lastYear}`;
    };

    return (
        <div className="flex flex-col gap-4 border-b border-secondary px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-primary">{series.length > 1 ? "Monthly sales by supplier" : "Monthly sales"}</p>
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-tertiary" aria-label="Legend">
                    {series.length > 1 &&
                        series.map((item) => (
                            <li key={item.id} className="flex items-center gap-1.5">
                                <Swatch className={item.colorClassName} />
                                {item.label}
                            </li>
                        ))}
                    {series.length === 1 && (
                        <li className="flex items-center gap-1.5">
                            <Swatch className={series[0].colorClassName} />
                            {year}
                        </li>
                    )}
                    {hasLastYear && (
                        <li className="flex items-center gap-1.5">
                            <LastYearKey />
                            {year - 1}
                        </li>
                    )}
                </ul>
            </div>

            <div className="flex gap-3">
                {/* Y axis labels */}
                <div className="relative w-10 shrink-0 text-right text-xs text-quaternary tabular-nums" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
                    {ticks.map((tick) => (
                        <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: `${toPercent(tick)}%` }}>
                            {compactCurrency.format(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative min-w-0 flex-1">
                    {/* Gridlines */}
                    <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
                        {ticks.map((tick) => (
                            <div key={tick} className={cx("absolute inset-x-0 h-px", tick === 0 ? "bg-border-primary" : "bg-border-secondary")} style={{ bottom: `${toPercent(tick)}%` }} />
                        ))}
                    </div>

                    <div role="group" aria-label={`${year} monthly sales chart`} className="relative flex" onPointerLeave={() => setActiveIndex(null)}>
                        {months.map((month, index) => {
                            const total = totals[index];
                            const visibleSeries = series.filter((item) => (month.amounts[item.id] ?? 0) > 0);

                            return (
                                <div
                                    key={month.month}
                                    tabIndex={0}
                                    aria-label={describe(month, index)}
                                    onPointerEnter={() => setActiveIndex(index)}
                                    onFocus={() => setActiveIndex(index)}
                                    onBlur={() => setActiveIndex(null)}
                                    className="group flex min-w-0 flex-1 cursor-default flex-col items-center rounded-md px-px outline-brand focus-visible:outline-2"
                                >
                                    <div
                                        className={cx("relative flex w-full justify-center rounded-t-md transition-colors", activeIndex === index && "bg-primary_hover")}
                                        style={{ height: PLOT_HEIGHT }}
                                    >
                                        {/* Stacked column, growing from the baseline with a 2px surface gap between segments */}
                                        {month.status === "uploaded" && (
                                            <div className="absolute bottom-0 flex w-full max-w-6 flex-col-reverse gap-0.5" style={{ height: `${toPercent(total)}%` }}>
                                                {visibleSeries.map((item, segmentIndex) => (
                                                    <div
                                                        key={item.id}
                                                        className={cx("min-h-px w-full", item.colorClassName, segmentIndex === visibleSeries.length - 1 && "rounded-t-sm")}
                                                        style={{ flexGrow: month.amounts[item.id], flexBasis: 0 }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Last year's total for the month */}
                                        {month.lastYear !== undefined && month.status !== "upcoming" && (
                                            <div
                                                className="absolute h-0.5 w-9 max-w-full rounded-full bg-fg-quaternary ring-2 ring-bg-primary"
                                                style={{ bottom: `calc(${toPercent(month.lastYear)}% - 1px)` }}
                                                aria-hidden="true"
                                            />
                                        )}

                                        {/* Direct label on the best month only */}
                                        {index === bestIndex && (
                                            <span
                                                className="absolute text-xs font-medium whitespace-nowrap text-secondary tabular-nums"
                                                style={{ bottom: `calc(${toPercent(Math.max(total, month.lastYear ?? 0))}% + 0.375rem)` }}
                                                aria-hidden="true"
                                            >
                                                {compactCurrency.format(total)}
                                            </span>
                                        )}
                                    </div>

                                    <span
                                        className={cx(
                                            "mt-2 flex items-center gap-1 text-xs",
                                            month.status === "upcoming" ? "text-quaternary" : "text-tertiary",
                                        )}
                                        aria-hidden="true"
                                    >
                                        {month.status === "missing" && <span className="size-1.5 rounded-full bg-utility-warning-500" />}
                                        {/* Single letters on narrow screens, where twelve short names collide */}
                                        <span className="sm:hidden">{formatSalesMonth(month.month, true).charAt(0)}</span>
                                        <span className="max-sm:hidden">{formatSalesMonth(month.month, true)}</span>
                                    </span>
                                </div>
                            );
                        })}

                        {/* Tooltip for the hovered or focused month */}
                        {active && activeIndex !== null && (
                            <div
                                className={cx(
                                    "pointer-events-none absolute top-0 z-20 w-64 rounded-lg bg-primary p-3 shadow-lg ring-1 ring-secondary",
                                    activeIndex >= months.length / 2 && "-translate-x-full",
                                )}
                                style={{
                                    left: `${((activeIndex + (activeIndex >= months.length / 2 ? 0 : 1)) / months.length) * 100}%`,
                                }}
                                aria-hidden="true"
                            >
                                <p className="text-xs font-semibold text-primary">
                                    {formatSalesMonth(active.month)} {year}
                                </p>
                                {active.status === "uploaded" ? (
                                    <>
                                        {series.length > 1 && (
                                            <ul className="mt-2 flex flex-col gap-1">
                                                {series.map((item) => (
                                                    <li key={item.id} className="flex items-center gap-2 text-xs text-tertiary">
                                                        <Swatch className={item.colorClassName} />
                                                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                                        <span className="text-secondary tabular-nums">{formatCurrency(active.amounts[item.id] ?? 0)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className={cx("flex items-center justify-between text-xs", series.length > 1 ? "mt-2 border-t border-secondary pt-2" : "mt-1")}>
                                            <span className="text-tertiary">Total</span>
                                            <span className="font-semibold text-primary tabular-nums">{formatCurrency(totals[activeIndex])}</span>
                                        </div>
                                        {active.lastYear !== undefined && (
                                            <div className="mt-1 flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1.5 text-tertiary">
                                                    <LastYearKey />
                                                    {year - 1}
                                                </span>
                                                <span className="text-secondary tabular-nums">
                                                    {formatCurrency(active.lastYear)}
                                                    {active.lastYear > 0 && (
                                                        <span className="ml-1 text-tertiary">({percent.format((totals[activeIndex] - active.lastYear) / active.lastYear)})</span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-1 text-xs text-tertiary">{active.status === "missing" ? "Sales for this month have not been uploaded." : "This month has not ended yet."}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
