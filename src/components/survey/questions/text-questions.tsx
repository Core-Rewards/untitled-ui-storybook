import { useState } from "react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { DatePicker } from "@/components/base/date-picker/date-picker";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { DateQuestion, NumberQuestion, TextQuestion } from "../survey-types";
import type { QuestionInputProps } from "./question-input-types";

const safeParseDate = (iso?: string) => {
    if (!iso) return undefined;
    try {
        return parseDate(iso);
    } catch {
        return undefined;
    }
};

// ─── Short and long text ─────────────────────────────────────────────────────

/** Short text continues on Enter. Long text takes new lines; Cmd/Ctrl + Enter continues. */
export const TextAnswerInput = ({ question, value, onChange, onCommit, isInvalid, labelId, messageId }: QuestionInputProps<TextQuestion, string>) => {
    const { copy } = useSurveyCopy();
    const remaining = question.maxLength !== undefined ? question.maxLength - (value?.length ?? 0) : undefined;
    const counter =
        remaining !== undefined ? (
            <span className={cx(remaining < 0 && "text-error-primary")} aria-live={remaining <= 20 ? "polite" : "off"}>
                {copy.charactersLeft(Math.max(0, remaining))}
            </span>
        ) : undefined;

    const common = {
        "aria-labelledby": labelId,
        "aria-describedby": messageId,
        placeholder: question.placeholder ?? copy.typeYourAnswer,
        value: value ?? "",
        onChange: (v: string) => onChange(v === "" ? undefined : v),
        maxLength: question.maxLength,
        isInvalid,
        hint: counter,
    };

    if (question.type === "short_text") {
        return (
            <div className="@xl/survey:max-w-120">
                <Input {...common} size="md" onKeyDown={(e) => e.key === "Enter" && onCommit?.(value)} />
            </div>
        );
    }

    return (
        <TextArea
            {...common}
            rows={5}
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onCommit?.(value);
            }}
        />
    );
};

// ─── Number ──────────────────────────────────────────────────────────────────

export const NumberAnswerInput = ({ question, value, onChange, onCommit, isInvalid, labelId, messageId }: QuestionInputProps<NumberQuestion, number>) => {
    const { copy, locale } = useSurveyCopy();
    // Keep what was typed, so "1." or "-" can be on the way to a valid number.
    const [draft, setDraft] = useState(value !== undefined ? String(value) : "");

    const parse = (text: string) => {
        const normalized = locale === "fr" ? text.replace(",", ".") : text;
        const n = Number(normalized.replace(/\s/g, ""));
        return text.trim() === "" || Number.isNaN(n) ? undefined : n;
    };

    const hint =
        question.min !== undefined || question.max !== undefined
            ? copy.numberBetween(question.min, question.max)
            : draft && parse(draft) === undefined
              ? copy.invalidNumber
              : undefined;

    return (
        <div className="flex items-start gap-3 @xl/survey:max-w-80">
            <Input
                aria-labelledby={labelId}
                aria-describedby={messageId}
                inputMode="decimal"
                className="flex-1"
                placeholder={question.placeholder ?? "0"}
                value={draft}
                onChange={(text) => {
                    setDraft(text);
                    onChange(parse(text));
                }}
                onKeyDown={(e) => e.key === "Enter" && onCommit?.(parse(draft))}
                isInvalid={isInvalid}
                hint={hint}
            />
            {question.unit && <span className="pt-2.5 text-md text-tertiary">{question.unit}</span>}
        </div>
    );
};

// ─── Date ────────────────────────────────────────────────────────────────────

export const DateAnswerInput = ({ question, value, onChange, isInvalid, labelId, messageId }: QuestionInputProps<DateQuestion, string>) => (
    <div className="@xl/survey:max-w-80">
        <DatePicker
            aria-labelledby={labelId}
            aria-describedby={messageId}
            value={safeParseDate(value) ?? null}
            minValue={safeParseDate(question.minDate)}
            maxValue={safeParseDate(question.maxDate)}
            onChange={(d: DateValue | null) => onChange(d ? d.toString() : undefined)}
            isInvalid={isInvalid}
        />
    </div>
);
