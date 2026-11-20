import { useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, DotsGrid } from "@untitledui/icons";
import { Button as AriaButton, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import type { Key } from "react-aria-components";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { RankingQuestion } from "../survey-types";
import { useDisplayOptions } from "./use-display-options";
import type { QuestionInputProps } from "./question-input-types";

const move = (ids: string[], from: number, to: number) => {
    const next = [...ids];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

/**
 * Drag to rank (pointer, touch or keyboard drag via React Aria), plus up/down
 * buttons on every row. The order shown counts as the answer once the participant
 * continues, so untouched lists still submit.
 */
export const RankingInput = ({ question, value, onChange, labelId, messageId }: QuestionInputProps<RankingQuestion, string[]>) => {
    const { copy } = useSurveyCopy();
    const initial = useDisplayOptions(question.options, question.randomize);
    const order = value && value.length === question.options.length ? value : initial.map((o) => o.id);
    const labelOf = (id: string) => question.options.find((o) => o.id === id)?.label ?? id;

    // Record the starting order so "Next" without changes still answers the question.
    useEffect(() => {
        if (!value) onChange(initial.map((o) => o.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) => [...keys].map((key) => ({ "text/plain": labelOf(String(key)) })),
        onReorder: (e) => {
            const moving = [...e.keys].map(String);
            const rest = order.filter((id) => !moving.includes(id));
            let index = rest.indexOf(String(e.target.key));
            if (e.target.dropPosition === "after") index += 1;
            rest.splice(index, 0, ...moving);
            onChange(rest);
        },
    });

    const shift = (id: string, delta: number) => {
        const from = order.indexOf(id);
        const to = from + delta;
        if (to < 0 || to >= order.length) return;
        onChange(move(order, from, to));
    };

    return (
        <div className="flex flex-col gap-3 @xl/survey:max-w-120">
            <p className="text-sm text-tertiary">{copy.rankHint}</p>
            <GridList
                aria-labelledby={labelId}
                aria-describedby={messageId}
                items={order.map((id) => ({ id }))}
                dragAndDropHooks={dragAndDropHooks}
                className="flex flex-col gap-2 outline-hidden"
            >
                {(item: { id: Key }) => {
                    const id = String(item.id);
                    const index = order.indexOf(id);
                    return (
                        <GridListItem
                            id={id}
                            textValue={labelOf(id)}
                            className={({ isDragging, isDropTarget, isFocusVisible }) =>
                                cx(
                                    "flex min-h-12 items-center gap-3 rounded-xl bg-primary py-2 pr-2 pl-3 ring-1 ring-primary outline-hidden ring-inset",
                                    isDragging && "opacity-50",
                                    isDropTarget && "ring-2 ring-brand",
                                    isFocusVisible && "ring-2 ring-brand",
                                )
                            }
                        >
                            <AriaButton
                                slot="drag"
                                aria-label={labelOf(id)}
                                className="cursor-grab rounded-md p-1 text-fg-quaternary outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <DotsGrid className="size-5" aria-hidden="true" />
                            </AriaButton>
                            <span
                                aria-hidden="true"
                                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary"
                            >
                                {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 text-md font-medium text-primary">{labelOf(id)}</span>
                            <div className="flex gap-1">
                                <RankButton label={copy.moveUp(labelOf(id))} disabled={index === 0} onPress={() => shift(id, -1)}>
                                    <ChevronUp className="size-5" aria-hidden="true" />
                                </RankButton>
                                <RankButton label={copy.moveDown(labelOf(id))} disabled={index === order.length - 1} onPress={() => shift(id, 1)}>
                                    <ChevronDown className="size-5" aria-hidden="true" />
                                </RankButton>
                            </div>
                        </GridListItem>
                    );
                }}
            </GridList>
        </div>
    );
};

const RankButton = ({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) => (
    <AriaButton
        aria-label={label}
        isDisabled={disabled}
        onPress={onPress}
        className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-hidden hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:ring-2 focus-visible:ring-brand data-disabled:cursor-not-allowed data-disabled:opacity-30"
    >
        {children}
    </AriaButton>
);
