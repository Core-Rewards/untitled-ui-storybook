import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";
import { createContext, useContext } from "react";
import type {
    CellProps as AriaCellProps,
    ColumnProps as AriaColumnProps,
    RowProps as AriaRowProps,
    TableBodyProps as AriaTableBodyProps,
    TableHeaderProps as AriaTableHeaderProps,
    TableProps as AriaTableProps,
} from "react-aria-components";
import {
    Cell as AriaCell,
    Column as AriaColumn,
    Row as AriaRow,
    Table as AriaTable,
    TableBody as AriaTableBody,
    TableHeader as AriaTableHeader,
} from "react-aria-components";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { cx } from "@/utils/cx";

/** Row density. `sm` tightens the vertical padding on every cell. */
export type TableSize = "sm" | "md";

const TableSizeContext = createContext<TableSize>("md");

/** Horizontal alignment for a column's header and its cells. */
export type TableAlign = "left" | "center" | "right";

const alignments: Record<TableAlign, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

// ── Table ─────────────────────────────────────────────────────────────────────

interface TableRootProps extends Omit<AriaTableProps, "className"> {
    className?: string;
    /** Row density. Defaults to `md`. */
    size?: TableSize;
    /** Classes for the scroll container that wraps the table. */
    wrapperClassName?: string;
}

export const TableRoot = ({ size = "md", className, wrapperClassName, ...props }: TableRootProps) => (
    <TableSizeContext.Provider value={size}>
        <div className={cx("w-full overflow-x-auto", wrapperClassName)}>
            <AriaTable {...props} className={cx("w-full", className)} />
        </div>
    </TableSizeContext.Provider>
);

type TableHeaderPropsWithClass<T extends object> = Omit<AriaTableHeaderProps<T>, "className"> & { className?: string };

export const TableHeader = <T extends object>({ className, ...props }: TableHeaderPropsWithClass<T>) => (
    <AriaTableHeader {...props} className={cx("bg-secondary", className)} />
);

interface TableHeadProps extends Omit<AriaColumnProps, "children" | "className"> {
    children?: ReactNode;
    className?: string;
    /** Header and cell alignment. Defaults to `left`. */
    align?: TableAlign;
    /** Hide the label visually but keep it available to screen readers. */
    srOnlyLabel?: boolean;
}

export const TableHead = ({ children, className, align = "left", srOnlyLabel = false, ...props }: TableHeadProps) => (
    <AriaColumn
        {...props}
        className={cx(
            "group relative px-6 py-3 text-xs font-semibold whitespace-nowrap text-tertiary outline-brand focus-visible:outline-2 focus-visible:-outline-offset-2",
            "border-b border-secondary",
            alignments[align],
            props.allowsSorting && "cursor-pointer hover:text-tertiary_hover",
            className,
        )}
    >
        {({ allowsSorting, sortDirection }) => (
            <span className={cx("flex items-center gap-1", align === "right" && "justify-end", align === "center" && "justify-center")}>
                <span className={cx(srOnlyLabel && "sr-only")}>{children}</span>
                {allowsSorting && <SortIndicator direction={sortDirection} />}
            </span>
        )}
    </AriaColumn>
);

const SortIndicator: FC<{ direction?: "ascending" | "descending" }> = ({ direction }) => {
    if (!direction) {
        // Hint that the column is sortable without competing with the active sort.
        return <ArrowDown className="size-3 shrink-0 text-fg-quaternary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />;
    }

    const Icon = direction === "ascending" ? ArrowUp : ArrowDown;
    return <Icon className="size-3 shrink-0 text-fg-quaternary" />;
};

type TableBodyPropsWithClass<T extends object> = Omit<AriaTableBodyProps<T>, "className"> & { className?: string };

export const TableBody = <T extends object>({ className, ...props }: TableBodyPropsWithClass<T>) => <AriaTableBody {...props} className={cx(className)} />;

type TableRowPropsWithClass<T extends object> = Omit<AriaRowProps<T>, "className"> & { className?: string };

export const TableRow = <T extends object>({ className, ...props }: TableRowPropsWithClass<T>) => (
    <AriaRow
        {...props}
        className={cx(
            "border-b border-secondary outline-brand last:border-b-0 hover:bg-primary_hover focus-visible:outline-2 focus-visible:-outline-offset-2",
            // Applied by React Aria when the table has a selection mode.
            "selected:bg-secondary",
            className,
        )}
    />
);

interface TableCellProps extends Omit<AriaCellProps, "className"> {
    className?: string;
    /** Cell alignment. Defaults to `left`. Match this to the column's `align`. */
    align?: TableAlign;
}

export const TableCell = ({ className, align = "left", ...props }: TableCellProps) => {
    const size = useContext(TableSizeContext);

    return (
        <AriaCell
            {...props}
            className={cx("px-6 align-middle text-sm text-tertiary", size === "sm" ? "py-3" : "py-4", alignments[align], className)}
        />
    );
};

// ── Table card ────────────────────────────────────────────────────────────────

export const TableCardRoot: FC<ComponentPropsWithoutRef<"div">> = ({ className, ...props }) => (
    <div {...props} className={cx("overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset", className)} />
);

interface TableCardHeaderProps {
    /** Card title, e.g. "Promotions". */
    title: ReactNode;
    /** Supporting line under the title. */
    description?: ReactNode;
    /** Rendered as a badge next to the title, e.g. a row count. */
    badge?: ReactNode;
    /** Buttons or controls pinned to the right of the header. */
    actions?: ReactNode;
    /** Rendered below the title row, typically a search and filter toolbar. */
    children?: ReactNode;
    className?: string;
}

export const TableCardHeader: FC<TableCardHeaderProps> = ({ title, description, badge, actions, children, className }) => (
    <div className={cx("flex flex-col gap-4 border-b border-secondary px-6 py-5", className)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-primary">{title}</h2>
                    {badge != null && <Badge color="brand" size="sm">{badge}</Badge>}
                </div>
                {description && <p className="text-sm text-tertiary">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
        {children}
    </div>
);
