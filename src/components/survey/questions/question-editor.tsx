import { useEffect, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { QuestionOption } from "../survey-types";
import { letterFor } from "./question-keys";

/*
 * Inline editing for the builder canvas: the question looks as participants see it,
 * and its text is edited in place. Dashed underlines mark editable text.
 */

let seq = 0;
const newId = () => `opt-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const autoSize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
};

interface EditableTextProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Accessible name, e.g. "Question 3 text". */
    label: string;
    className?: string;
    autoFocus?: boolean;
    /** Enter moves on instead of adding a new line. */
    singleLine?: boolean;
    onEnter?: () => void;
}

/** Text that looks like the participant view but is editable, with a dashed underline. */
export const EditableText = ({ value, onChange, placeholder, label, className, autoFocus, singleLine, onEnter }: EditableTextProps) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => autoSize(ref.current), [value]);
    useEffect(() => {
        if (autoFocus) ref.current?.focus();
    }, [autoFocus]);

    return (
        <textarea
            ref={ref}
            rows={1}
            aria-label={label}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && (singleLine || onEnter)) {
                    e.preventDefault();
                    onEnter?.();
                }
            }}
            className={cx(
                "block w-full resize-none overflow-hidden border-b border-dashed border-primary bg-transparent pb-1 outline-hidden placeholder:text-placeholder",
                "hover:border-fg-quaternary focus:border-solid focus:border-brand",
                className,
            )}
        />
    );
};

interface OptionsEditorProps {
    options: QuestionOption[];
    onChange: (options: QuestionOption[]) => void;
    /** Accessible name of the list, e.g. "Answer options". */
    label: string;
    /** Focus the first empty option on mount (a just-added question). */
    autoFocusFirstEmpty?: boolean;
    /** Show letter keys like the participant view. */
    showLetters?: boolean;
    addLabel?: string;
}

/**
 * Answer options as editable rows. Enter adds the next option, Backspace on an empty
 * option removes it, and pasting several lines splits them into options.
 */
export const OptionsEditor = ({ options, onChange, label, autoFocusFirstEmpty, showLetters = true, addLabel = "Add option" }: OptionsEditorProps) => {
    const refs = useRef(new Map<string, HTMLInputElement>());
    const focusId = useRef<string | null>(null);

    useEffect(() => {
        if (autoFocusFirstEmpty) {
            const first = options.find((o) => !o.label);
            if (first) refs.current.get(first.id)?.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (focusId.current) {
            refs.current.get(focusId.current)?.focus();
            focusId.current = null;
        }
    });

    const update = (id: string, labelText: string) => onChange(options.map((o) => (o.id === id ? { ...o, label: labelText } : o)));

    const insertAfter = (index: number, labels: string[] = [""]) => {
        const added = labels.map((l) => ({ id: newId(), label: l }));
        const next = [...options.slice(0, index + 1), ...added, ...options.slice(index + 1)];
        focusId.current = added.at(-1)!.id;
        onChange(next);
    };

    const remove = (index: number) => {
        if (options.length <= 1) return;
        const next = options.filter((_, i) => i !== index);
        focusId.current = next[Math.max(0, index - 1)].id;
        onChange(next);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            insertAfter(index);
        } else if (e.key === "Backspace" && !options[index].label && options.length > 1) {
            e.preventDefault();
            remove(index);
        }
    };

    return (
        <div role="group" aria-label={label} className="flex flex-col gap-2 @xl/survey:max-w-120">
            {options.map((o, i) => (
                <div
                    key={o.id}
                    className="group/option flex min-h-12 items-center gap-3 rounded-xl bg-primary px-4 py-2 ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand"
                >
                    {showLetters && (
                        <span
                            aria-hidden="true"
                            className="flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-tertiary ring-1 ring-primary ring-inset"
                        >
                            {letterFor(i)}
                        </span>
                    )}
                    <input
                        ref={(el) => {
                            if (el) refs.current.set(o.id, el);
                            else refs.current.delete(o.id);
                        }}
                        aria-label={`Option ${i + 1}`}
                        value={o.label}
                        placeholder={`Option ${i + 1}`}
                        onChange={(e) => update(o.id, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        onPaste={(e) => {
                            const lines = e.clipboardData
                                .getData("text")
                                .split(/\r?\n/)
                                .map((l) => l.trim())
                                .filter(Boolean);
                            if (lines.length < 2) return;
                            e.preventDefault();
                            const [first, ...rest] = lines;
                            const withFirst = options.map((x) => (x.id === o.id ? { ...x, label: (x.label + first).trim() } : x));
                            const added = rest.map((l) => ({ id: newId(), label: l }));
                            focusId.current = added.at(-1)!.id;
                            onChange([...withFirst.slice(0, i + 1), ...added, ...withFirst.slice(i + 1)]);
                        }}
                        className="min-w-0 flex-1 bg-transparent text-md font-medium text-primary outline-hidden placeholder:font-normal placeholder:text-placeholder"
                    />
                    <button
                        type="button"
                        aria-label={`Remove option ${i + 1}`}
                        disabled={options.length <= 1}
                        onClick={() => remove(i)}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-quaternary opacity-0 outline-focus-ring group-focus-within/option:opacity-100 group-hover/option:opacity-100 hover:bg-primary_hover focus-visible:opacity-100 focus-visible:outline-2 disabled:hidden"
                    >
                        <XClose className="size-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => insertAfter(options.length - 1)}
                className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary px-4 text-sm font-semibold text-brand-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
            >
                <Plus className="size-4" aria-hidden="true" />
                {addLabel}
            </button>
        </div>
    );
};
