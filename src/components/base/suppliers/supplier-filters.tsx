import type { FC } from "react";
import type { Key } from "react-aria-components";
import { Button as AriaButton, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { CheckCircle, Tag01 } from "@untitledui/icons";
import { TableSearchInput } from "@/components/base/table/table-toolbar";
import { cx, sortCx } from "@/utils/cx";
import type { Division, DivisionCode, SupplierFilterCounts, SupplierFilterState } from "./supplier-types";
import { DEFAULT_SUPPLIER_FILTERS, DIVISIONS, hasActiveFilters } from "./supplier-utils";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: "flex flex-col gap-3",
    // Divisions on the left and the two toggles on the right share a row from `lg` up; search gets the row below.
    topRow: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
    // Segmented control; scrolls sideways inside its frame if a phone is too narrow for it.
    group: "flex max-w-full shrink-0 gap-0.5 self-start overflow-x-auto rounded-lg bg-secondary_subtle p-1 ring-1 ring-secondary [scrollbar-width:none] ring-inset",
    segment: [
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-secondary outline-brand transition-colors duration-100",
        "hover:bg-primary_hover hover:text-secondary_hover",
        "selected:bg-brand-solid selected:text-white selected:shadow-xs selected:hover:bg-brand-solid_hover",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    segmentCount: "min-w-5 rounded-full lg:max-xl:sr-only bg-tertiary px-1.5 text-center text-xs font-medium text-tertiary tabular-nums in-selected:bg-white/20 in-selected:text-white",
    toggle: [
        "group inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold whitespace-nowrap outline-brand ring-1 ring-inset transition-colors duration-100",
        "bg-primary text-secondary ring-primary hover:bg-primary_hover",
        "selected:bg-brand-primary selected:text-brand-secondary selected:ring-brand",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ].join(" "),
    toggleIcon: "size-4 text-fg-quaternary group-selected:text-fg-brand-secondary",
    toggleCount: "text-xs font-medium lg:max-xl:sr-only text-quaternary tabular-nums group-selected:text-brand-tertiary",
    toggles: "flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap",
});

// ── Component ─────────────────────────────────────────────────────────────────

export interface SupplierFiltersProps {
    value: SupplierFilterState;
    onChange: (value: SupplierFilterState) => void;
    /** Shown beside each option. Omit to hide counts. */
    counts?: SupplierFilterCounts;
    divisions?: Division[];
    searchPlaceholder?: string;
    className?: string;
}

/**
 * Division segments and the promotion and qualifying-product toggles on one
 * row from `lg` up, with search full width below. Counts show what each
 * option would leave on screen, so nobody clicks into an empty result.
 * Between `lg` and `xl` they are visually hidden (still announced) so the
 * row fits beside the app sidebar.
 */
export const SupplierFilters: FC<SupplierFiltersProps> = ({ value, onChange, counts, divisions = DIVISIONS, searchPlaceholder = "Search suppliers", className }) => {
    const update = (next: Partial<SupplierFilterState>) => onChange({ ...value, ...next });

    const onDivisionChange = (keys: Set<Key>) => {
        const [key] = keys;
        if (key) update({ division: key as DivisionCode | "all" });
    };

    const options: { id: DivisionCode | "all"; label: string; title?: string }[] = [
        { id: "all", label: "All divisions" },
        ...divisions.map((division) => ({ id: division.code, label: division.label, title: division.name })),
    ];

    return (
        <div className={cx(styles.root, className)}>
            <div className={styles.topRow}>
                <ToggleButtonGroup
                    aria-label="Division"
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[value.division]}
                    onSelectionChange={onDivisionChange}
                    className={styles.group}
                >
                    {options.map((option) => (
                        <ToggleButton
                            key={option.id}
                            id={option.id}
                            isDisabled={option.id !== value.division && counts?.divisions[option.id] === 0}
                            // Full division name for screen readers; the pill shows the short code.
                            aria-label={counts ? `${option.title ?? option.label}, ${counts.divisions[option.id]} suppliers` : (option.title ?? option.label)}
                            className={styles.segment}
                        >
                            {option.label}
                            {counts && <span className={styles.segmentCount}>{counts.divisions[option.id]}</span>}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <div className={styles.toggles}>
                    <ToggleButton
                        isSelected={value.promotionsOnly}
                        onChange={(promotionsOnly) => update({ promotionsOnly })}
                        // Never strand someone on an empty page; still let them turn it off.
                        isDisabled={!value.promotionsOnly && counts?.promotions === 0}
                        className={styles.toggle}
                    >
                        <Tag01 className={styles.toggleIcon} aria-hidden="true" />
                        Promotions
                        {counts && <span className={styles.toggleCount}>{counts.promotions}</span>}
                    </ToggleButton>
                    <ToggleButton
                        isSelected={value.qualifyingOnly}
                        onChange={(qualifyingOnly) => update({ qualifyingOnly })}
                        isDisabled={!value.qualifyingOnly && counts?.qualifying === 0}
                        className={styles.toggle}
                    >
                        <CheckCircle className={styles.toggleIcon} aria-hidden="true" />
                        Qualifying products
                        {counts && <span className={styles.toggleCount}>{counts.qualifying}</span>}
                    </ToggleButton>
                </div>
            </div>

            <TableSearchInput value={value.query} onChange={(query) => update({ query })} placeholder={searchPlaceholder} className="sm:w-full" />
        </div>
    );
};

/** Text button that resets every filter. Renders nothing when none are set. */
export const ClearSupplierFiltersButton: FC<{ value: SupplierFilterState; onChange: (value: SupplierFilterState) => void; className?: string }> = ({
    value,
    onChange,
    className,
}) =>
    hasActiveFilters(value) ? (
        <AriaButton
            onPress={() => onChange(DEFAULT_SUPPLIER_FILTERS)}
            className={cx(
                "cursor-pointer rounded-sm text-sm font-semibold text-brand-secondary outline-brand hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                className,
            )}
        >
            Clear filters
        </AriaButton>
    ) : null;
