import type { FC } from "react";
import { Star01 } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { Badge } from "@/components/base/badges/badge";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import type { RecognitionValue } from "./recognition-types";
import { formatPoints } from "./recognition-utils";

const styles = sortCx({
    grid: "grid grid-cols-1 gap-3 @xl:grid-cols-2",
    card: {
        base: "relative flex cursor-pointer items-start gap-3 rounded-xl bg-primary p-4 ring-1 ring-secondary outline-brand transition duration-100 ease-linear ring-inset",
        hover: "bg-primary_hover",
        selected: "bg-brand-primary_alt ring-2 ring-brand",
        focusVisible: "outline-2 outline-offset-2",
    },
    text: "flex min-w-0 flex-1 flex-col gap-0.5 pr-6",
    name: "text-sm font-semibold text-primary",
    description: "text-sm text-tertiary",
    points: "mt-2 self-start",
    indicator: {
        base: "absolute top-4 right-4 flex size-4 items-center justify-center rounded-full ring-1 ring-primary ring-inset",
        selected: "bg-brand-solid ring-transparent",
    },
    indicatorDot: "size-1.5 rounded-full bg-fg-white",
    // Sized to confirm the choice without pushing the rest of the form down.
    image: "mt-3 h-40 w-auto max-w-full rounded-xl object-contain ring-1 ring-secondary",
});

interface RecognitionValuePickerProps {
    values: RecognitionValue[];
    selectedId: string | null;
    onChange: (value: RecognitionValue) => void;
    /** `cards` shows every value as a selectable card. `select` lists them in a dropdown. Defaults to `cards`. */
    variant?: "cards" | "select";
    /** Shows the selected value's image under the picker. Defaults to `true`. */
    showImage?: boolean;
    /** Extra classes for that image, such as hiding it when a layout shows the image elsewhere. */
    imageClassName?: string;
    label?: string;
}

export const RecognitionValuePicker: FC<RecognitionValuePickerProps> = ({
    values,
    selectedId,
    onChange,
    variant = "cards",
    showImage = true,
    imageClassName,
    label = "Reason for recognition",
}) => {
    const selected = values.find((value) => value.id === selectedId);
    const handleChange = (id: unknown) => {
        const value = values.find((item) => item.id === id);
        if (value) onChange(value);
    };

    const image = showImage && selected?.image && <img src={selected.image.src} alt={selected.image.alt} className={cx(styles.image, imageClassName)} />;

    if (variant === "select") {
        return (
            <div>
                <Select
                    label={label}
                    placeholder="Select a reason"
                    isRequired
                    validationBehavior="aria"
                    items={values.map((value) => ({
                        id: value.id,
                        label: value.name,
                        icon: value.icon ?? Star01,
                        supportingText: value.points !== undefined ? `${formatPoints(value.points)} pts` : undefined,
                    }))}
                    selectedKey={selectedId}
                    onSelectionChange={handleChange}
                    hint={selected?.description}
                >
                    {(item) => <SelectItem id={item.id} label={item.label} icon={item.icon} supportingText={item.supportingText} />}
                </Select>
                {image}
            </div>
        );
    }

    return (
        <div>
            <AriaRadioGroup
                value={selectedId}
                onChange={handleChange}
                isRequired
                validationBehavior="aria"
                className="flex flex-col gap-1.5"
            >
                <Label isRequired>{label}</Label>
                <div className={styles.grid}>
                    {values.map((value) => (
                        <AriaRadio
                            key={value.id}
                            value={value.id}
                            className={({ isSelected, isHovered, isFocusVisible }) =>
                                cx(
                                    styles.card.base,
                                    isHovered && !isSelected && styles.card.hover,
                                    isSelected && styles.card.selected,
                                    isFocusVisible && styles.card.focusVisible,
                                )
                            }
                        >
                            {({ isSelected }) => (
                                <>
                                    <FeaturedIcon icon={value.icon ?? Star01} color="brand" theme="light" size="md" />
                                    <span className={styles.text}>
                                        <span className={styles.name}>{value.name}</span>
                                        {value.description && <span className={styles.description}>{value.description}</span>}
                                        {value.points !== undefined && (
                                            <Badge color="brand" type="pill-color" size="sm" className={styles.points}>
                                                {formatPoints(value.points)} pts
                                            </Badge>
                                        )}
                                    </span>
                                    <span className={cx(styles.indicator.base, isSelected && styles.indicator.selected)} aria-hidden="true">
                                        {isSelected && <span className={styles.indicatorDot} />}
                                    </span>
                                </>
                            )}
                        </AriaRadio>
                    ))}
                </div>
            </AriaRadioGroup>

            {image}
        </div>
    );
};
