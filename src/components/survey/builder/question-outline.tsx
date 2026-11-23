import { Check, DotsGrid, GitBranch01, InfoCircle, Plus } from "@untitledui/icons";
import { Button as AriaButton, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import type { Key } from "react-aria-components";
import { cx } from "@/utils/cx";
import { estimateMinutes } from "../survey-logic";
import type { Survey } from "../survey-types";
import { questionSummary } from "./builder-model";
import { onlyIf } from "./logic-analysis";

/** "intro", "thankYou" or a question id. */
export type OutlineSelection = string;

export interface QuestionOutlineProps {
    survey: Survey;
    selectedId: OutlineSelection;
    onSelect: (id: OutlineSelection) => void;
    onReorder: (ids: string[]) => void;
    /** Insert a question at this index. `anchor` positions the type picker. */
    onInsert: (index: number, anchor: Element) => void;
}

const pinnedRow = (isSelected: boolean) =>
    cx(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-secondary outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
        isSelected ? "bg-brand-primary_alt ring-2 ring-brand ring-inset" : "hover:bg-primary_hover",
    );

/**
 * The builder's left pane: intro and thank-you pinned at the ends, numbered
 * questions in between with their type and logic. Drag (or keyboard drag) to
 * reorder; a "+" between questions and "Add question" at the bottom open the type
 * picker.
 */
export const QuestionOutline = ({ survey, selectedId, onSelect, onReorder, onInsert }: QuestionOutlineProps) => {
    const ids = survey.questions.map((q) => q.id);
    const answerable = survey.questions.filter((q) => q.type !== "statement").length;

    const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) => [...keys].map((k) => ({ "text/plain": String(k) })),
        onReorder: (e) => {
            const moving = [...e.keys].map(String);
            const rest = ids.filter((id) => !moving.includes(id));
            let at = rest.indexOf(String(e.target.key));
            if (e.target.dropPosition === "after") at += 1;
            rest.splice(at, 0, ...moving);
            onReorder(rest);
        },
    });

    return (
        <div className="flex flex-col gap-2">
            <p className="px-3 pb-1 text-xs font-semibold text-tertiary">
                {answerable} {answerable === 1 ? "question" : "questions"} · About {estimateMinutes(survey.questions)} min
            </p>

            <button type="button" onClick={() => onSelect("intro")} aria-pressed={selectedId === "intro"} className={pinnedRow(selectedId === "intro")}>
                <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md ring-1 ring-primary ring-inset">
                    <InfoCircle className="size-3.5 text-fg-quaternary" />
                </span>
                Intro screen
            </button>

            <GridList
                aria-label="Questions"
                items={survey.questions}
                // Rows show derived text (numbers, "Only if…"), so re-render them whenever the survey changes.
                dependencies={[survey]}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={ids.includes(selectedId) ? [selectedId] : []}
                onSelectionChange={(keys) => {
                    const [k] = [...(keys as Set<Key>)];
                    if (k !== undefined) onSelect(String(k));
                }}
                dragAndDropHooks={dragAndDropHooks}
                className="flex flex-col gap-1 outline-hidden"
            >
                {(q) => {
                    const i = survey.questions.indexOf(q);
                    const condition = onlyIf(survey, q);
                    return (
                        <GridListItem
                            id={q.id}
                            textValue={`Question ${i + 1}: ${q.title || "Untitled question"}`}
                            className={({ isSelected, isFocusVisible, isDropTarget, isDragging }) =>
                                cx(
                                    "group/q relative flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 outline-hidden transition duration-100 ease-linear",
                                    isSelected ? "bg-brand-primary_alt ring-2 ring-brand ring-inset" : "hover:bg-primary_hover",
                                    isFocusVisible && "ring-2 ring-focus-ring ring-inset",
                                    isDropTarget && "ring-2 ring-brand ring-inset",
                                    isDragging && "opacity-50",
                                    condition && "ml-4",
                                )
                            }
                        >
                            {({ isSelected }) => (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className={cx(
                                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                                            isSelected ? "bg-brand-solid text-white" : "bg-secondary text-secondary",
                                        )}
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className={cx("text-sm", q.title ? "font-medium text-primary" : "text-placeholder italic")}>
                                            {q.title || "Untitled question"}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-tertiary">
                                            {questionSummary(q)}
                                            {q.logic?.length ? (
                                                <>
                                                    {" · "}
                                                    <GitBranch01 className="size-3.5" aria-hidden="true" />
                                                    <span>Logic</span>
                                                </>
                                            ) : null}
                                        </span>
                                        {condition && <span className="text-xs text-brand-secondary">{condition}</span>}
                                    </span>
                                    <AriaButton
                                        slot="drag"
                                        aria-label={`Reorder question ${i + 1}`}
                                        className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-fg-quaternary opacity-0 outline-hidden group-hover/q:opacity-100 data-focus-visible:opacity-100 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring"
                                    >
                                        <DotsGrid className="size-4" />
                                    </AriaButton>
                                    {/* Insert line: appears on hover between this question and the next. */}
                                    <AriaButton
                                        aria-label={`Add a question after question ${i + 1}`}
                                        onPress={(e) => onInsert(i + 1, e.target as Element)}
                                        className="absolute -bottom-2.5 left-1/2 z-10 flex size-5 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-brand-solid text-white opacity-0 shadow-sm outline-hidden transition duration-100 group-hover/q:opacity-100 data-focus-visible:opacity-100 data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-focus-visible:ring-offset-2"
                                    >
                                        <Plus className="size-3.5" />
                                    </AriaButton>
                                </>
                            )}
                        </GridListItem>
                    );
                }}
            </GridList>

            <button
                type="button"
                onClick={() => onSelect("thankYou")}
                aria-pressed={selectedId === "thankYou"}
                className={pinnedRow(selectedId === "thankYou")}
            >
                <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md ring-1 ring-primary ring-inset">
                    <Check className="size-3.5 text-fg-quaternary" />
                </span>
                Thank-you screen
            </button>

            <button
                type="button"
                onClick={(e) => onInsert(survey.questions.length, e.currentTarget)}
                className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand text-sm font-semibold text-brand-secondary outline-focus-ring hover:bg-brand-primary_alt focus-visible:outline-2"
            >
                <Plus className="size-4" aria-hidden="true" />
                Add question
                <kbd className="ml-1 rounded border border-secondary px-1.5 font-sans text-xs font-medium text-tertiary">/</kbd>
            </button>
        </div>
    );
};
