import type { FC } from "react";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { cx, sortCx } from "@/utils/cx";
import type { PointsSelection } from "./recognition-types";
import { formatPoints, pointsLabel, sanitizePointsInput } from "./recognition-utils";

const CUSTOM = "custom";

const styles = sortCx({
    chips: "flex flex-wrap gap-2",
    chip: {
        base: "cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-secondary shadow-xs ring-1 ring-primary outline-brand transition duration-100 ease-linear ring-inset",
        hover: "bg-primary_hover",
        selected: "bg-brand-primary_alt text-brand-secondary ring-2 ring-brand",
        focusVisible: "outline-2 outline-offset-2",
        disabled: "cursor-not-allowed opacity-50",
    },
    custom: "mt-3 max-w-60",
});

interface RecognitionPointsPickerProps {
    options: number[];
    selection: PointsSelection;
    onSelectionChange: (selection: PointsSelection) => void;
    /** Points the sender can still send. Larger presets are disabled. */
    available: number;
    allowCustom?: boolean;
    /** Validation message for the chosen amount. */
    error?: string | null;
    /** Guidance shown under the options, such as a value's suggested amount. */
    hint?: string;
    label?: string;
}

export const RecognitionPointsPicker: FC<RecognitionPointsPickerProps> = ({
    options,
    selection,
    onSelectionChange,
    available,
    allowCustom = true,
    error,
    hint,
    label = "Points",
}) => {
    const groupValue = selection === null ? null : selection.kind === "custom" ? CUSTOM : String(selection.points);
    const isCustom = selection?.kind === "custom";
    const hasNoBudget = available <= 0;

    return (
        <div>
            <AriaRadioGroup
                value={groupValue}
                onChange={(value) =>
                    onSelectionChange(value === CUSTOM ? { kind: "custom", input: isCustom ? selection.input : "" } : { kind: "preset", points: Number(value) })
                }
                orientation="horizontal"
                isRequired
                isDisabled={hasNoBudget}
                isInvalid={!isCustom && !!error}
                validationBehavior="aria"
                className="flex flex-col gap-1.5"
            >
                <Label isRequired>{label}</Label>
                <div className={styles.chips}>
                    {[...options.map((option) => ({ value: String(option), label: formatPoints(option), isDisabled: option > available })), ...(allowCustom ? [{ value: CUSTOM, label: "Custom", isDisabled: false }] : [])].map((option) => (
                        <AriaRadio
                            key={option.value}
                            value={option.value}
                            isDisabled={option.isDisabled}
                            className={({ isSelected, isHovered, isFocusVisible, isDisabled }) =>
                                cx(
                                    styles.chip.base,
                                    isHovered && !isSelected && styles.chip.hover,
                                    isSelected && styles.chip.selected,
                                    isFocusVisible && styles.chip.focusVisible,
                                    isDisabled && styles.chip.disabled,
                                )
                            }
                        >
                            {option.label}
                        </AriaRadio>
                    ))}
                </div>
                {hasNoBudget ? (
                    <HintText>You don’t have any points available to send right now.</HintText>
                ) : (
                    !isCustom && (error || hint) && <HintText isInvalid={!!error}>{error ?? hint}</HintText>
                )}
            </AriaRadioGroup>

            {isCustom && !hasNoBudget && (
                <div className={styles.custom}>
                    <Input
                        label="Custom amount"
                        placeholder="Enter points"
                        inputMode="numeric"
                        autoFocus={selection.input === ""}
                        value={selection.input ? formatPoints(Number(selection.input)) : ""}
                        onChange={(value) => onSelectionChange({ kind: "custom", input: sanitizePointsInput(value) })}
                        isInvalid={!!error}
                        validationBehavior="aria"
                        hint={error ?? hint ?? `Up to ${pointsLabel(available)}.`}
                    />
                </div>
            )}
        </div>
    );
};
