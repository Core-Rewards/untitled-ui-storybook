import type { FC } from "react";
import { useState } from "react";
import { FieldError, Form, Input, Label, TextField } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { CheckoutAddress } from "./checkout-types";

export type AddressFormValues = Omit<CheckoutAddress, "id">;

interface AddressFormProps {
    /** Pre-fill fields when editing an existing address. */
    initialValues?: Partial<AddressFormValues>;
    /** Called when the user submits valid form data. */
    onSave: (values: AddressFormValues) => void;
    /** Called when the user cancels. Omit to hide the Cancel button (e.g. when there are no saved addresses). */
    onCancel?: () => void;
}

const inputClass = cx(
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-primary outline-none",
    "placeholder:text-fg-disabled",
    "transition-colors duration-100",
    "hover:border-gray-400 focus:border-brand-solid",
);

const labelClass = "mb-1.5 block text-sm font-medium text-secondary";

export const AddressForm: FC<AddressFormProps> = ({ initialValues = {}, onSave, onCancel }) => {
    const [values, setValues] = useState<AddressFormValues>({
        name: initialValues.name ?? "",
        street: initialValues.street ?? "",
        city: initialValues.city ?? "",
        state: initialValues.state ?? "",
        zip: initialValues.zip ?? "",
        country: initialValues.country ?? "",
    });

    const set = (field: keyof AddressFormValues) => (val: string) =>
        setValues((prev) => ({ ...prev, [field]: val }));

    return (
        <Form
            validationBehavior="aria"
            onSubmit={(e) => {
                e.preventDefault();
                onSave(values);
            }}
            className="space-y-4"
        >
            <TextField isRequired value={values.name} onChange={set("name")}>
                <Label className={labelClass}>Full name</Label>
                <Input className={inputClass} placeholder="Jane Smith" autoComplete="name" />
                <FieldError className="mt-1 text-xs text-error-primary" />
            </TextField>

            <TextField isRequired value={values.street} onChange={set("street")}>
                <Label className={labelClass}>Street address</Label>
                <Input className={inputClass} placeholder="123 Main St" autoComplete="street-address" />
                <FieldError className="mt-1 text-xs text-error-primary" />
            </TextField>

            <div className="grid grid-cols-2 gap-4">
                <TextField isRequired value={values.city} onChange={set("city")}>
                    <Label className={labelClass}>City</Label>
                    <Input className={inputClass} placeholder="Springfield" autoComplete="address-level2" />
                    <FieldError className="mt-1 text-xs text-error-primary" />
                </TextField>

                <TextField isRequired value={values.state} onChange={set("state")}>
                    <Label className={labelClass}>State / Province</Label>
                    <Input className={inputClass} placeholder="IL" autoComplete="address-level1" />
                    <FieldError className="mt-1 text-xs text-error-primary" />
                </TextField>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <TextField isRequired value={values.zip} onChange={set("zip")}>
                    <Label className={labelClass}>ZIP / Postal code</Label>
                    <Input className={inputClass} placeholder="62701" autoComplete="postal-code" />
                    <FieldError className="mt-1 text-xs text-error-primary" />
                </TextField>

                <TextField isRequired value={values.country} onChange={set("country")}>
                    <Label className={labelClass}>Country</Label>
                    <Input className={inputClass} placeholder="United States" autoComplete="country-name" />
                    <FieldError className="mt-1 text-xs text-error-primary" />
                </TextField>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button color="secondary" size="md" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button color="primary" size="md" type="submit">
                    Save address
                </Button>
            </div>
        </Form>
    );
};
