import type { FC } from "react";
import { FileDownload02, Pin01, Tag01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useControllableState } from "@/utils/use-controllable-state";
import { DataTable } from "./data-table";
import type { TableColumn, TableFilter, TableSortDescriptor } from "./table-types";
import type { Promotion } from "./promotions-types";
import {
    PROMOTION_STATUS_COLORS,
    PROMOTION_STATUS_LABELS,
    PROMOTION_STATUS_RANK,
    formatPointsMultiplier,
    formatPromotionDate,
} from "./promotions-types";

const DEFAULT_SORT: TableSortDescriptor = { column: "endDate", direction: "ascending" };

const statusFilter: TableFilter<Promotion> = {
    id: "status",
    label: "Status",
    options: Object.entries(PROMOTION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    getValue: (promotion) => promotion.status,
};

const createColumns = (isPinned: (promotion: Promotion) => boolean, onTogglePin: (promotion: Promotion) => void): TableColumn<Promotion>[] => [
    {
        id: "name",
        header: "Promotion name",
        isRowHeader: true,
        sortValue: (promotion) => promotion.name,
        headerClassName: "w-64",
        cell: (promotion) => <span className="font-medium text-primary">{promotion.name}</span>,
    },
    {
        id: "description",
        header: "Description",
        sortValue: (promotion) => promotion.description,
        headerClassName: "w-96",
        // Keeps the column readable once the table starts scrolling on narrow viewports.
        cellClassName: "min-w-64",
        cell: (promotion) => <p className="max-w-96">{promotion.description}</p>,
    },
    {
        id: "pointsMultiplier",
        header: "Points multiplier",
        sortValue: (promotion) => promotion.pointsMultiplier,
        headerClassName: "w-40",
        cellClassName: "whitespace-nowrap",
        cell: (promotion) => (
            <Badge color="brand" size="sm">
                {formatPointsMultiplier(promotion.pointsMultiplier)}
            </Badge>
        ),
    },
    {
        id: "startDate",
        header: "Start date",
        sortValue: (promotion) => promotion.startDate,
        headerClassName: "w-36",
        cellClassName: "whitespace-nowrap",
        cell: (promotion) => formatPromotionDate(promotion.startDate),
    },
    {
        id: "endDate",
        header: "End date",
        sortValue: (promotion) => promotion.endDate,
        headerClassName: "w-36",
        cellClassName: "whitespace-nowrap",
        cell: (promotion) => formatPromotionDate(promotion.endDate),
    },
    {
        id: "status",
        header: "Status",
        sortValue: (promotion) => PROMOTION_STATUS_RANK[promotion.status],
        headerClassName: "w-36",
        cellClassName: "whitespace-nowrap",
        cell: (promotion) => (
            <Badge color={PROMOTION_STATUS_COLORS[promotion.status]} size="sm" dot>
                {PROMOTION_STATUS_LABELS[promotion.status]}
            </Badge>
        ),
    },
    {
        id: "actions",
        header: "Actions",
        srOnlyHeader: true,
        align: "right",
        headerClassName: "w-28",
        cellClassName: "whitespace-nowrap",
        cell: (promotion) => {
            const pinned = isPinned(promotion);

            return (
                <div className="flex items-center justify-end gap-0.5">
                    {promotion.flyerUrl && (
                        <Button
                            color="tertiary"
                            size="sm"
                            href={promotion.flyerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            iconLeading={FileDownload02}
                            aria-label={`Open the ${promotion.name} flyer PDF in a new tab`}
                        />
                    )}
                    <Button
                        color="tertiary"
                        size="sm"
                        onClick={() => onTogglePin(promotion)}
                        iconLeading={Pin01}
                        aria-label={pinned ? `Unpin ${promotion.name}` : `Pin ${promotion.name}`}
                        aria-pressed={pinned}
                        className={cx(pinned && "*:data-icon:text-fg-brand-primary hover:*:data-icon:text-fg-brand-primary")}
                    />
                </div>
            );
        },
    },
];

const EmptyState: FC = () => (
    <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary ring-inset">
            <Tag01 className="size-5 text-fg-quaternary" />
        </div>
        <p className="text-sm font-semibold text-primary">Promotions coming soon</p>
        <p className="text-sm text-tertiary">Check back shortly for new ways to earn points.</p>
    </div>
);

export interface PromotionsTableProps {
    /** Every promotion to show, pinned or not. */
    promotions: Promotion[];
    /** Ids of pinned promotions. Pass this to own pin state, e.g. to persist it per user. */
    pinnedIds?: string[];
    /** Initial pinned ids when `pinnedIds` is not provided. */
    defaultPinnedIds?: string[];
    /** Called with the full pinned id list whenever it changes. */
    onPinnedIdsChange?: (pinnedIds: string[]) => void;
    /** Called with the promotion that was pinned or unpinned. */
    onTogglePin?: (promotion: Promotion, isPinned: boolean) => void;
    /** Card title. Defaults to "Promotions". */
    title?: string;
    /** Supporting line under the title. */
    description?: string;
    /** Rows per page in the main table. Defaults to 10. */
    defaultPageSize?: number;
    /** Rows-per-page choices in the footer. Defaults to 10, 25, 50 and 100. */
    rowsPerPageOptions?: number[];
}

/**
 * Promotions table with a search and status filter toolbar, sortable columns and
 * pagination. Pinned promotions are lifted into their own card above the main
 * table, where they sort among themselves and stay out of pagination.
 */
export const PromotionsTable: FC<PromotionsTableProps> = ({
    promotions,
    pinnedIds: controlledPinnedIds,
    defaultPinnedIds = [],
    onPinnedIdsChange,
    onTogglePin,
    title = "Promotions",
    description,
    defaultPageSize = 10,
    rowsPerPageOptions = [10, 25, 50, 100],
}) => {
    const [pinnedIds, setPinnedIds] = useControllableState(controlledPinnedIds, defaultPinnedIds, onPinnedIdsChange);

    const isPinned = (promotion: Promotion) => pinnedIds.includes(promotion.id);

    const togglePin = (promotion: Promotion) => {
        const willBePinned = !pinnedIds.includes(promotion.id);
        setPinnedIds(willBePinned ? [...pinnedIds, promotion.id] : pinnedIds.filter((id) => id !== promotion.id));
        onTogglePin?.(promotion, willBePinned);
    };

    const columns = createColumns(isPinned, togglePin);

    const pinned = promotions.filter((promotion) => pinnedIds.includes(promotion.id));
    const unpinned = promotions.filter((promotion) => !pinnedIds.includes(promotion.id));

    return (
        <div className="flex flex-col gap-6">
            {pinned.length > 0 && (
                <DataTable
                    aria-label="Pinned promotions"
                    title="Pinned promotions"
                    description="Kept at the top for quick access. Unpin one to move it back to the full list."
                    columns={columns}
                    data={pinned}
                    getRowId={(promotion) => promotion.id}
                    defaultSortDescriptor={DEFAULT_SORT}
                    tableClassName="min-w-4xl"
                />
            )}

            <DataTable
                aria-label="Promotions"
                title={title}
                description={description}
                columns={columns}
                data={unpinned}
                getRowId={(promotion) => promotion.id}
                defaultSortDescriptor={DEFAULT_SORT}
                search={{ placeholder: "Search promotions", getText: (promotion) => `${promotion.name} ${promotion.description}` }}
                filters={[statusFilter]}
                pagination
                defaultPageSize={defaultPageSize}
                rowsPerPageOptions={rowsPerPageOptions}
                emptyState={<EmptyState />}
                noResultsState="No promotions match your search."
                tableClassName="min-w-4xl"
            />
        </div>
    );
};
