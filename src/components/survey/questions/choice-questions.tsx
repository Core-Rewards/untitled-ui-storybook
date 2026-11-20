import { useRef } from "react";
import { Input } from "@/components/base/input/input";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem } from "@/components/base/select/select-item";
import { useSurveyCopy } from "../survey-context";
import { OTHER_OPTION_ID } from "../survey-logic";
import type { ChoiceAnswer, DropdownQuestion, MultipleChoiceQuestion, YesNoQuestion } from "../survey-types";
import { ChoiceRow } from "./question-parts";
import { letterFor, useShortcutKeys } from "./question-keys";
import type { QuestionInputProps } from "./question-input-types";
import { useDisplayOptions } from "./use-display-options";

// ─── Multiple choice ─────────────────────────────────────────────────────────

export const MultipleChoiceInput = ({
    question,
    value,
    onChange,
    onCommit,
    shortcuts,
    labelId,
    messageId,
}: QuestionInputProps<MultipleChoiceQuestion, ChoiceAnswer>) => {
    const { copy } = useSurveyCopy();
    const options = useDisplayOptions(question.options, question.randomize);
    const allOptions = question.allowOther ? [...options, { id: OTHER_OPTION_ID, label: copy.otherLabel }] : options;
    const selected = value?.selected ?? [];
    const atMax = !!question.multiple && !!question.maxPicks && selected.length >= question.maxPicks;
    const otherRef = useRef<HTMLInputElement>(null);

    const toggle = (id: string) => {
        if (!question.multiple) {
            const next: ChoiceAnswer = {
                selected: [id],
                other: id === OTHER_OPTION_ID ? value?.other : undefined,
            };
            onChange(next);
            if (id === OTHER_OPTION_ID) requestAnimationFrame(() => otherRef.current?.focus());
            else onCommit?.(next);
            return;
        }
        const isOn = selected.includes(id);
        if (!isOn && atMax) return;
        const nextSelected = isOn ? selected.filter((s) => s !== id) : [...selected, id];
        onChange({
            selected: nextSelected,
            other: nextSelected.includes(OTHER_OPTION_ID) ? value?.other : undefined,
        });
        if (!isOn && id === OTHER_OPTION_ID) requestAnimationFrame(() => otherRef.current?.focus());
    };

    useShortcutKeys(!!shortcuts, (key) => {
        const index = key.toUpperCase().charCodeAt(0) - 65;
        if (key.length !== 1 || index < 0 || index >= allOptions.length) return false;
        toggle(allOptions[index].id);
        return true;
    });

    return (
        <div role="group" aria-labelledby={labelId} aria-describedby={messageId} className="flex flex-col gap-2 @xl/survey:max-w-120">
            {allOptions.map((option, i) => {
                const isSelected = selected.includes(option.id);
                return (
                    <ChoiceRow
                        key={option.id}
                        shortcut={letterFor(i)}
                        label={option.label}
                        isSelected={isSelected}
                        isDisabled={!isSelected && atMax}
                        onPress={() => toggle(option.id)}
                    >
                        {option.id === OTHER_OPTION_ID && isSelected && (
                            <div className="px-4 pb-3">
                                <Input
                                    ref={otherRef}
                                    aria-label={copy.otherLabel}
                                    placeholder={copy.otherPlaceholder}
                                    value={value?.other ?? ""}
                                    onChange={(other) => onChange({ selected, other })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !question.multiple) onCommit?.({ selected, other: value?.other });
                                    }}
                                />
                            </div>
                        )}
                    </ChoiceRow>
                );
            })}
        </div>
    );
};

// ─── Yes / No ────────────────────────────────────────────────────────────────

export const YesNoInput = ({ question, value, onChange, onCommit, shortcuts, labelId, messageId }: QuestionInputProps<YesNoQuestion, string>) => {
    const { copy } = useSurveyCopy();
    const options = [
        { id: "yes", label: question.yesLabel ?? copy.yes },
        { id: "no", label: question.noLabel ?? copy.no },
    ];

    const pick = (id: string) => {
        onChange(id);
        onCommit?.(id);
    };

    useShortcutKeys(!!shortcuts, (key) => {
        const k = key.toUpperCase();
        if (k === "A") pick("yes");
        else if (k === "B") pick("no");
        else return false;
        return true;
    });

    return (
        <div role="group" aria-labelledby={labelId} aria-describedby={messageId} className="flex flex-col gap-2 @xl/survey:max-w-120">
            {options.map((option, i) => (
                <ChoiceRow key={option.id} shortcut={letterFor(i)} label={option.label} isSelected={value === option.id} onPress={() => pick(option.id)} />
            ))}
        </div>
    );
};

// ─── Dropdown ────────────────────────────────────────────────────────────────

export const DropdownInput = ({ question, value, onChange, isInvalid, labelId, messageId }: QuestionInputProps<DropdownQuestion, string>) => {
    const { copy } = useSurveyCopy();
    return (
        <div className="@xl/survey:max-w-120">
            <ComboBox
                aria-labelledby={labelId}
                aria-describedby={messageId}
                size="lg"
                shortcut={false}
                placeholder={question.placeholder ?? copy.searchOptions}
                items={question.options.map((o) => ({ id: o.id, label: o.label }))}
                selectedKey={value ?? null}
                onSelectionChange={(key) => onChange(key === null ? undefined : String(key))}
                isInvalid={isInvalid}
            >
                {(item) => <SelectItem id={item.id} label={item.label} />}
            </ComboBox>
        </div>
    );
};
