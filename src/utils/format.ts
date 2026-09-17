const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const numberFormatter = new Intl.NumberFormat("en-US");

/** Formats an ISO date (`YYYY-MM-DD`) as `Oct 1, 2026`, reading it as a local date so the day never shifts. */
export const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    return dateFormatter.format(new Date(year, month - 1, day));
};

/** Formats a number as US currency, e.g. `$12,480.00`. */
export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

/** Formats a number with thousands separators, e.g. `12,480`. */
export const formatNumber = (value: number) => numberFormatter.format(value);
