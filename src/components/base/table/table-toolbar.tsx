import type { FC } from "react";
import { Button as AriaButton, Dialog, DialogTrigger, Input, Popover, SearchField } from "react-aria-components";
import { ChevronDown, SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Checkbox } from "@/components/base/checkboxes/checkbox";
import { cx } from "@/utils/cx";
import type { TableFilterOption } from "./table-types";

interface TableSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    /** Accessible label. Defaults to the placeholder. */
    "aria-label"?: string;
}

export const TableSearchInput: FC<TableSearchInputProps> = ({ value, onChange, placeholder = "Search", className, "aria-label": ariaLabel }) => (
    <SearchField value={value} onChange={onChange} aria-label={ariaLabel ?? placeholder} className={cx("relative w-full sm:w-70", className)}>
        <SearchLg className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-quaternary" />
        <Input
            placeholder={placeholder}
            className={cx(
                "w-full rounded-lg bg-primary py-2.5 pr-3.5 pl-10 text-sm text-primary shadow-xs ring-1 ring-primary outline-none ring-inset",
                "placeholder:text-fg-quaternary",
                "transition-shadow duration-100 focus:ring-2 focus:ring-brand",
            )}
        />
    </SearchField>
);

interface TableFilterDropdownProps {
    label: string;
    options: TableFilterOption[];
    /** Currently selected option values. */
    value: string[];
    onChange: (value: string[]) => void;
}

/** Multi-select dropdown used for the filter controls above a table. */
export const TableFilterDropdown: FC<TableFilterDropdownProps> = ({ label, options, value, onChange }) => {
    const toggle = (optionValue: string, isSelected: boolean) => {
        onChange(isSelected ? [...value, optionValue] : value.filter((item) => item !== optionValue));
    };

    return (
        <DialogTrigger>
            <AriaButton
                className={cx(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap text-secondary shadow-xs-skeumorphic ring-1 ring-primary outline-brand ring-inset",
                    "hover:bg-primary_hover hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
            >
                {label}
                {value.length > 0 && (
                    <Badge color="brand" size="sm" type="pill-color">
                        {value.length}
                    </Badge>
                )}
                <ChevronDown className="size-4 text-fg-quaternary" />
            </AriaButton>

            <Popover
                placement="bottom start"
                offset={4}
                className="w-56 origin-top rounded-lg bg-primary py-1.5 shadow-lg ring-1 ring-secondary ring-inset entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95"
            >
                <Dialog aria-label={`${label} filter`} className="outline-none">
                    <div className="flex flex-col">
                        {options.map((option) => (
                            <Checkbox
                                key={option.value}
                                isSelected={value.includes(option.value)}
                                onChange={(isSelected) => toggle(option.value, isSelected)}
                                className="px-3 py-2 hover:bg-primary_hover"
                            >
                                {option.label}
                            </Checkbox>
                        ))}
                    </div>
                    {value.length > 0 && (
                        <div className="mt-1.5 border-t border-secondary pt-1.5">
                            <AriaButton
                                onPress={() => onChange([])}
                                className="w-full cursor-pointer px-3 py-1.5 text-left text-sm font-semibold text-brand-secondary outline-brand hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:-outline-offset-2"
                            >
                                Clear
                            </AriaButton>
                        </div>
                    )}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};
