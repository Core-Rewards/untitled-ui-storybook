import { useState } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { Toggle } from "@/components/base/toggle/toggle";

/** Label on the left, switch on the right, as in the wireframes' settings panel. */
export const SettingToggle = ({
    label,
    hint,
    isSelected,
    onChange,
}: {
    label: string;
    hint?: ReactNode;
    isSelected: boolean;
    onChange: (v: boolean) => void;
}) => (
    <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-secondary">{label}</span>
            {hint && <span className="text-sm text-tertiary">{hint}</span>}
        </div>
        <Toggle aria-label={label} size="sm" isSelected={isSelected} onChange={onChange} />
    </div>
);

/** A number input that allows an empty value while typing. */
export const NumberField = ({
    label,
    value,
    onChange,
    min,
    placeholder,
    hint,
}: {
    label: string;
    value?: number;
    onChange: (v: number | undefined) => void;
    min?: number;
    placeholder?: string;
    hint?: string;
}) => {
    const [draft, setDraft] = useState(value !== undefined ? String(value) : "");
    return (
        <Input
            label={label}
            size="sm"
            inputMode="numeric"
            placeholder={placeholder}
            hint={hint}
            value={draft}
            onChange={(t) => {
                setDraft(t);
                const n = Number(t);
                onChange(t.trim() === "" || Number.isNaN(n) ? undefined : min !== undefined ? Math.max(min, n) : n);
            }}
        />
    );
};

export const TextField = ({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) => (
    <Input label={label} size="sm" value={value ?? ""} placeholder={placeholder} onChange={onChange} />
);

export const SelectField = <T extends string | number>({
    label,
    value,
    options,
    onChange,
    hideLabel,
}: {
    label: string;
    value: T;
    options: { id: T; label: string }[];
    onChange: (v: T) => void;
    /** Keep the label for screen readers only, e.g. inside a sentence-style rule. */
    hideLabel?: boolean;
}) => (
    <Select
        label={hideLabel ? undefined : label}
        aria-label={hideLabel ? label : undefined}
        size="sm"
        selectedKey={String(value)}
        onSelectionChange={(key) => {
            const match = options.find((o) => String(o.id) === String(key));
            if (match) onChange(match.id);
        }}
        items={options.map((o) => ({ id: String(o.id), label: o.label }))}
    >
        {(item) => <SelectItem id={item.id} label={item.label} />}
    </Select>
);

export const FieldGroup = ({ title, children }: { title?: string; children: ReactNode }) => (
    <div className="flex flex-col gap-4">
        {title && <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{title}</p>}
        {children}
    </div>
);
