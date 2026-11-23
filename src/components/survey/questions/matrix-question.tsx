import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { MatrixQuestion } from "../survey-types";
import { ChoiceRow, ScaleButton } from "./question-parts";
import { AUTO_ADVANCE_MS, letterFor } from "./question-keys";
import type { QuestionInputProps } from "./question-input-types";

/**
 * Rate several items on one scale. Wide layouts show a grid; narrow layouts show one
 * row at a time and move to the next row after each pick. The whole matrix counts
 * as a single question in "3 of 5".
 */
export const MatrixInput = ({ question, value, onChange, labelId, messageId }: QuestionInputProps<MatrixQuestion, Record<string, string>>) => {
    const { copy } = useSurveyCopy();
    const answers = value ?? {};
    const firstOpen = question.rows.findIndex((r) => !answers[r.id]);
    const [rowIndex, setRowIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const pick = (rowId: string, columnId: string, stepOn: boolean) => {
        const next = { ...answers, [rowId]: columnId };
        onChange(next);
        if (stepOn) {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                const nextOpen = question.rows.findIndex((r) => !next[r.id]);
                if (nextOpen !== -1) setRowIndex(nextOpen);
            }, AUTO_ADVANCE_MS);
        }
    };

    const row = question.rows[rowIndex];

    return (
        <div aria-describedby={messageId}>
            {/* Wide: grid */}
            <table className="hidden w-full border-separate border-spacing-y-2 @xl/survey:table" aria-labelledby={labelId}>
                <thead>
                    <tr>
                        <td />
                        {question.columns.map((c) => (
                            <th key={c.id} scope="col" className="px-1 pb-1 text-center text-sm font-medium text-tertiary">
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {question.rows.map((r) => (
                        <tr key={r.id}>
                            <th scope="row" className="pr-4 text-left text-md font-medium text-primary">
                                {r.label}
                            </th>
                            {question.columns.map((c) => (
                                <td key={c.id} className="px-1">
                                    <ScaleButton
                                        label={<span className="sr-only">{c.label}</span>}
                                        ariaLabel={`${r.label}: ${c.label}`}
                                        isSelected={answers[r.id] === c.id}
                                        onPress={() => pick(r.id, c.id, false)}
                                        className="h-11 w-full @xl/survey:h-11"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Narrow: one row at a time */}
            <div className="flex flex-col gap-3 @xl/survey:hidden">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-semibold text-primary" id={`${labelId}-row`}>
                        {row.label}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 text-sm text-tertiary">
                        <StepButton label={copy.previousQuestion} disabled={rowIndex === 0} onPress={() => setRowIndex((i) => i - 1)}>
                            <ChevronLeft className="size-5" aria-hidden="true" />
                        </StepButton>
                        <span aria-live="polite">{copy.rowPosition(rowIndex + 1, question.rows.length)}</span>
                        <StepButton label={copy.nextQuestion} disabled={rowIndex === question.rows.length - 1} onPress={() => setRowIndex((i) => i + 1)}>
                            <ChevronRight className="size-5" aria-hidden="true" />
                        </StepButton>
                    </div>
                </div>
                <div role="group" aria-labelledby={`${labelId} ${labelId}-row`} className="flex flex-col gap-2">
                    {question.columns.map((c, i) => (
                        <ChoiceRow
                            key={c.id}
                            shortcut={letterFor(i)}
                            label={c.label}
                            isSelected={answers[row.id] === c.id}
                            onPress={() => pick(row.id, c.id, true)}
                        />
                    ))}
                </div>
                <div className="flex justify-center gap-1.5" aria-hidden="true">
                    {question.rows.map((r, i) => (
                        <span
                            key={r.id}
                            className={cx("size-2 rounded-full", i === rowIndex ? "bg-brand-solid" : answers[r.id] ? "bg-fg-quaternary" : "bg-quaternary")}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const StepButton = ({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) => (
    <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onPress}
        className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-hidden hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-30"
    >
        {children}
    </button>
);
