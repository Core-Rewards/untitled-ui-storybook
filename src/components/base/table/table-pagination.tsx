import type { FC } from "react";
import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

interface TablePaginationProps {
    /** Current page, 1-based. */
    page: number;
    /** Total number of pages. Always at least 1. */
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Rows per page. Required when `rowsPerPageOptions` is set. */
    pageSize?: number;
    /** Renders a rows-per-page control when provided, e.g. `[10, 25, 50, 100]`. */
    rowsPerPageOptions?: number[];
    onPageSizeChange?: (pageSize: number) => void;
    className?: string;
}

export const TablePagination: FC<TablePaginationProps> = ({
    page,
    totalPages,
    onPageChange,
    pageSize,
    rowsPerPageOptions,
    onPageSizeChange,
    className,
}) => (
    <div className={cx("flex flex-col-reverse items-center gap-4 border-t border-secondary px-6 py-3.5 sm:flex-row sm:justify-between", className)}>
        <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-secondary">
                Page {page} of {totalPages}
            </p>

            {rowsPerPageOptions && rowsPerPageOptions.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-tertiary">
                    <span className="sr-only sm:not-sr-only">Rows per page</span>
                    <select
                        value={pageSize}
                        onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
                        className="cursor-pointer rounded-lg bg-primary py-1.5 pr-8 pl-2.5 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-brand ring-inset hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {rowsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </div>

        <div className="flex items-center gap-3">
            <Button color="secondary" size="sm" iconLeading={ArrowLeft} isDisabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Previous
            </Button>
            <Button color="secondary" size="sm" iconTrailing={ArrowRight} isDisabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next
            </Button>
        </div>
    </div>
);
