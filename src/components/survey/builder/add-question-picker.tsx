import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { CornerDownLeft, SearchLg } from "@untitledui/icons";
import { Dialog, Popover } from "react-aria-components";
import { Badge } from "@/components/base/badges/badge";
import { cx } from "@/utils/cx";
import { SurveyQuestion } from "../questions/survey-question";
import { sampleQuestions } from "../survey-sample-data";
import type { SurveyQuestion as SurveyQuestionData, SurveyQuestionType } from "../survey-types";
import { QUESTION_BANK } from "./builder-sample-data";
import type { BankQuestion } from "./builder-sample-data";
import { QUESTION_TYPES, typeInfo } from "./question-catalog";

export interface AddQuestionPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    /** The button or insert line it opened from. */
    triggerRef: RefObject<Element | null>;
    onPickType: (type: SurveyQuestionType) => void;
    onPickBank: (item: BankQuestion) => void;
    bank?: BankQuestion[];
}

type Tab = "types" | "bank";

/**
 * The add-question popover (A3b): search, types grouped as Choice, Scales, Text and
 * data and Other, and a live preview with a "Best for" note. The Question bank tab
 * lists Core-written questions with French included. Arrows browse, Enter adds,
 * Esc closes.
 */
export const AddQuestionPicker = ({ isOpen, onOpenChange, triggerRef, onPickType, onPickBank, bank = QUESTION_BANK }: AddQuestionPickerProps) => (
    <Popover
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        triggerRef={triggerRef as RefObject<Element>}
        placement="right top"
        offset={12}
        className={({ isEntering, isExiting }) =>
            cx(
                "w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt outline-hidden",
                isEntering && "duration-150 ease-out animate-in fade-in zoom-in-95",
                isExiting && "duration-100 ease-in animate-out fade-out zoom-out-95",
            )
        }
    >
        <Dialog aria-label="Add a question" className="outline-hidden">
            <PickerBody onPickType={onPickType} onPickBank={onPickBank} bank={bank} />
        </Dialog>
    </Popover>
);

type Row = { kind: "type"; type: SurveyQuestionType } | { kind: "bank"; item: BankQuestion };

const PickerBody = ({ onPickType, onPickBank, bank }: Pick<AddQuestionPickerProps, "onPickType" | "onPickBank"> & { bank: BankQuestion[] }) => {
    const [tab, setTab] = useState<Tab>("types");
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();
    const optionId = (i: number) => `${listId}-opt-${i}`;

    useEffect(() => inputRef.current?.focus(), [tab]);

    const q = query.trim().toLowerCase();
    const rows: Row[] = useMemo(() => {
        if (tab === "types") {
            return QUESTION_TYPES.filter((t) => !q || `${t.label} ${t.group} ${t.keywords ?? ""}`.toLowerCase().includes(q)).map((t) => ({
                kind: "type" as const,
                type: t.type,
            }));
        }
        return bank
            .filter((b) => !q || `${b.question.title} ${typeInfo(b.question.type).label}`.toLowerCase().includes(q))
            .map((item) => ({ kind: "bank" as const, item }));
    }, [tab, q, bank]);

    const current = rows[Math.min(active, rows.length - 1)];
    const pick = (row?: Row) => {
        if (!row) return;
        if (row.kind === "type") onPickType(row.type);
        else onPickBank(row.item);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(rows.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            pick(current);
        }
    };

    useEffect(() => {
        document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const previewQuestion: SurveyQuestionData | undefined =
        current?.kind === "type" ? sampleQuestions[current.type] : current ? ({ ...current.item.question, id: "preview" } as SurveyQuestionData) : undefined;
    const info = current ? typeInfo(current.kind === "type" ? current.type : current.item.question.type) : undefined;

    let lastGroup = "";

    return (
        <div className="flex flex-col">
            <div role="tablist" aria-label="Add from" className="flex gap-4 border-b border-secondary px-4 pt-3">
                {(["types", "bank"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        onClick={() => {
                            setTab(t);
                            setActive(0);
                        }}
                        className={cx(
                            "-mb-px flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                            tab === t ? "border-brand text-brand-secondary" : "border-transparent text-quaternary hover:text-tertiary",
                        )}
                    >
                        {t === "types" ? "Question types" : "Question bank"}
                        {t === "bank" && (
                            <Badge size="sm" color={tab === t ? "brand" : "gray"}>
                                {bank.length}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            <div className="border-b border-secondary p-3">
                <label className="flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand">
                    <SearchLg className="size-4 text-fg-quaternary" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        role="combobox"
                        aria-expanded
                        aria-controls={listId}
                        aria-activedescendant={current ? optionId(Math.min(active, rows.length - 1)) : undefined}
                        aria-label={tab === "types" ? "Search question types" : "Search the question bank"}
                        placeholder={tab === "types" ? "Search question types" : "Search the question bank"}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        className="min-w-0 flex-1 bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder"
                    />
                </label>
            </div>

            <div className="grid h-96 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={tab === "types" ? "Question types" : "Question bank"}
                    className="overflow-y-auto border-secondary py-2 sm:border-r"
                >
                    {rows.length === 0 && <li className="px-4 py-8 text-center text-sm text-tertiary">Nothing matches "{query}".</li>}
                    {rows.map((row, i) => {
                        const t = typeInfo(row.kind === "type" ? row.type : row.item.question.type);
                        const header = row.kind === "type" && !q && t.group !== lastGroup ? t.group : null;
                        if (header) lastGroup = t.group;
                        const isActive = i === Math.min(active, rows.length - 1);
                        return (
                            <li key={row.kind === "type" ? row.type : row.item.id} role="presentation">
                                {header && <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-quaternary uppercase">{header}</p>}
                                <div
                                    id={optionId(i)}
                                    role="option"
                                    aria-selected={isActive}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => pick(row)}
                                    className={cx(
                                        "mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm",
                                        isActive ? "bg-brand-primary_alt text-brand-secondary" : "text-secondary",
                                    )}
                                >
                                    <t.icon className={cx("size-4 shrink-0", isActive ? "text-fg-brand-primary" : "text-fg-quaternary")} aria-hidden="true" />
                                    <span className="min-w-0 flex-1">
                                        {row.kind === "type" ? (
                                            <span className="font-medium">{t.label}</span>
                                        ) : (
                                            <span className="flex flex-col">
                                                <span className="font-medium">{row.item.question.title}</span>
                                                <span className="text-xs text-tertiary">{t.label} · EN and FR</span>
                                            </span>
                                        )}
                                    </span>
                                    {isActive && <CornerDownLeft className="size-4 shrink-0 text-fg-brand-primary" aria-hidden="true" />}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div aria-hidden="true" className="hidden flex-col gap-3 overflow-y-auto bg-secondary_subtle p-4 sm:flex">
                    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Preview</p>
                    {previewQuestion && (
                        <div inert className="pointer-events-none rounded-xl bg-primary p-4 ring-1 ring-secondary ring-inset">
                            <SurveyQuestion question={previewQuestion} value={undefined} onChange={() => {}} className="[&_h2]:!text-md [&>div]:!gap-1" />
                        </div>
                    )}
                    {info && (
                        <p className="text-sm text-tertiary">
                            <span className="font-semibold text-secondary">{info.label}. </span>
                            <span className="font-semibold text-secondary">Best for: </span>
                            {info.bestFor}
                            {current?.kind === "bank" && " French is already written."}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-secondary px-4 py-2.5 text-xs text-tertiary">
                <span>↑↓ to browse · ↵ to add · Esc to close</span>
                <span className="hidden sm:inline">
                    Tip: press <kbd className="rounded border border-secondary px-1 font-sans font-semibold">/</kbd> anywhere to add a question
                </span>
            </div>
        </div>
    );
};
