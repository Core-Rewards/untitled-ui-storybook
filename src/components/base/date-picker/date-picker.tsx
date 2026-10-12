"use client";

import type { ReactNode } from "react";
import type { DateValue } from "@internationalized/date";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "@untitledui/icons";
import type { DatePickerProps as AriaDatePickerProps } from "react-aria-components";
import {
    Button as AriaButton,
    Calendar as AriaCalendar,
    CalendarCell as AriaCalendarCell,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    DateInput as AriaDateInput,
    DatePicker as AriaDatePicker,
    DateSegment as AriaDateSegment,
    Dialog as AriaDialog,
    Group as AriaGroup,
    Heading as AriaHeading,
    Popover as AriaPopover,
} from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

export interface DatePickerProps<T extends DateValue = DateValue> extends AriaDatePickerProps<T> {
    /** Label text shown above the field. */
    label?: string;
    /** Helper text shown below the field. Shown in red when the field is invalid. */
    hint?: ReactNode;
    /** Whether to hide the required indicator from the label. */
    hideRequiredIndicator?: boolean;
}

const navButtonStyles = cx(
    "flex size-9 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-hidden transition duration-100 ease-linear",
    "hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:ring-2 focus-visible:ring-brand",
    "disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * Single date field with typed segments and a calendar popover. Built on the
 * React Aria DatePicker and styled to match the Untitled UI Input.
 */
export const DatePicker = <T extends DateValue>({ label, hint, hideRequiredIndicator, className, ...props }: DatePickerProps<T>) => {
    return (
        <AriaDatePicker
            {...props}
            className={(state) => cx("group flex w-full flex-col items-start gap-1.5", typeof className === "function" ? className(state) : className)}
        >
            {({ isInvalid }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? false : props.isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <AriaGroup
                        className={({ isFocusWithin, isDisabled, isInvalid }) =>
                            cx(
                                "relative flex w-full items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
                                isFocusWithin && !isDisabled && "ring-2 ring-brand",
                                isDisabled && "cursor-not-allowed opacity-50",
                                isInvalid && "ring-error_subtle",
                                isInvalid && isFocusWithin && "ring-2 ring-error",
                            )
                        }
                    >
                        <AriaDateInput className="flex flex-1 px-3 py-2 text-md">
                            {(segment) => (
                                <AriaDateSegment
                                    segment={segment}
                                    className={({ isPlaceholder, isFocused }) =>
                                        cx(
                                            "rounded px-0.5 tabular-nums outline-hidden",
                                            segment.type === "literal" ? "text-placeholder" : "text-primary",
                                            isPlaceholder && "text-placeholder",
                                            isFocused && "bg-brand-solid text-white",
                                        )
                                    }
                                />
                            )}
                        </AriaDateInput>
                        <AriaButton aria-label="Open calendar" className={cx(navButtonStyles, "mr-0.5")}>
                            <CalendarIcon className="size-5" />
                        </AriaButton>
                    </AriaGroup>

                    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}

                    <AriaPopover
                        placement="bottom end"
                        offset={4}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "rounded-xl bg-primary shadow-lg ring-1 ring-secondary_alt outline-hidden",
                                isEntering && "duration-150 ease-out animate-in fade-in",
                                isExiting && "duration-100 ease-in animate-out fade-out",
                            )
                        }
                    >
                        <AriaDialog className="p-4 outline-hidden">
                            <AriaCalendar>
                                <header className="mb-3 flex items-center justify-between">
                                    <AriaButton slot="previous" className={navButtonStyles}>
                                        <ChevronLeft className="size-5" />
                                    </AriaButton>
                                    <AriaHeading className="text-sm font-semibold text-secondary" />
                                    <AriaButton slot="next" className={navButtonStyles}>
                                        <ChevronRight className="size-5" />
                                    </AriaButton>
                                </header>
                                <AriaCalendarGrid weekdayStyle="short" className="border-collapse">
                                    <AriaCalendarGridHeader>
                                        {(day) => (
                                            <AriaCalendarHeaderCell className="size-10 pb-1 text-sm font-medium text-secondary">{day.slice(0, 2)}</AriaCalendarHeaderCell>
                                        )}
                                    </AriaCalendarGridHeader>
                                    <AriaCalendarGridBody>
                                        {(date) => (
                                            <AriaCalendarCell
                                                date={date}
                                                className={({ isSelected, isFocusVisible, isDisabled, isUnavailable, isOutsideMonth, isHovered }) =>
                                                    cx(
                                                        "flex size-10 cursor-pointer items-center justify-center rounded-full text-sm text-secondary outline-hidden transition duration-100 ease-linear",
                                                        isHovered && "bg-primary_hover",
                                                        isFocusVisible && "ring-2 ring-brand",
                                                        isOutsideMonth && "invisible",
                                                        (isDisabled || isUnavailable) && "cursor-not-allowed text-disabled hover:bg-transparent",
                                                        isSelected && "bg-brand-solid font-medium text-white hover:bg-brand-solid_hover",
                                                    )
                                                }
                                            />
                                        )}
                                    </AriaCalendarGridBody>
                                </AriaCalendarGrid>
                            </AriaCalendar>
                        </AriaDialog>
                    </AriaPopover>
                </>
            )}
        </AriaDatePicker>
    );
};

DatePicker.displayName = "DatePicker";
