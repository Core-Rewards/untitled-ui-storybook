import { useEffect, useRef, useState } from "react";
import { Heart, Star01, ThumbsUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { NpsQuestion, OpinionScaleQuestion, RatingIcon, RatingQuestion } from "../survey-types";
import { ScaleButton, ScaleLabels } from "./question-parts";
import { useShortcutKeys } from "./question-keys";
import type { QuestionInputProps } from "./question-input-types";

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

/**
 * Number keys for a scale. On a scale that reaches 10, pressing 1 waits briefly
 * for a 0 before picking 1, so "10" can be typed.
 */
const useNumberKeys = (enabled: boolean, min: number, max: number, onPick: (n: number) => void) => {
    const pending = useRef<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    useShortcutKeys(enabled, (key) => {
        if (!/^\d$/.test(key)) return false;
        const digit = Number(key);

        if (pending.current === 1 && digit === 0 && max >= 10) {
            clearTimeout(timer.current);
            pending.current = null;
            onPick(10);
            return true;
        }
        if (digit === 1 && max >= 10) {
            pending.current = 1;
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                pending.current = null;
                if (1 >= min) onPick(1);
            }, 500);
            return true;
        }
        if (digit >= min && digit <= max) {
            onPick(digit);
            return true;
        }
        return false;
    });
};

// ─── Opinion scale ───────────────────────────────────────────────────────────

export const OpinionScaleInput = ({ question, value, onChange, onCommit, shortcuts, labelId, messageId }: QuestionInputProps<OpinionScaleQuestion, number>) => {
    const values = range(question.min, question.max);
    const pick = (n: number) => {
        onChange(n);
        onCommit?.(n);
    };
    useNumberKeys(!!shortcuts, question.min, question.max, pick);

    const labelFor = (n: number) => (n === question.min ? question.minLabel : n === question.max ? question.maxLabel : undefined);
    // 0–10 scales wrap onto two rows on narrow screens, like NPS.
    const wraps = values.length > 7;

    return (
        <div className="flex flex-col gap-3">
            <div
                role="group"
                aria-labelledby={labelId}
                aria-describedby={messageId}
                className={cx("flex flex-wrap gap-2 @xl/survey:flex-nowrap", wraps && "*:basis-[calc((100%-2.5rem)/6)] @xl/survey:*:basis-0")}
            >
                {values.map((n) => (
                    <ScaleButton
                        key={n}
                        label={n}
                        ariaLabel={labelFor(n) ? `${n}, ${labelFor(n)}` : String(n)}
                        isSelected={value === n}
                        onPress={() => pick(n)}
                    />
                ))}
            </div>
            <ScaleLabels start={question.minLabel} end={question.maxLabel} />
        </div>
    );
};

// ─── NPS ─────────────────────────────────────────────────────────────────────

/** Fixed 0–10. Two rows (0–5, 6–10) on phones, one row of 11 when there's room. */
export const NpsInput = ({ question, value, onChange, onCommit, shortcuts, labelId, messageId }: QuestionInputProps<NpsQuestion, number>) => {
    const pick = (n: number) => {
        onChange(n);
        onCommit?.(n);
    };
    useNumberKeys(!!shortcuts, 0, 10, pick);

    const button = (n: number) => (
        <ScaleButton
            key={n}
            label={n}
            ariaLabel={n === 0 && question.minLabel ? `0, ${question.minLabel}` : n === 10 && question.maxLabel ? `10, ${question.maxLabel}` : String(n)}
            isSelected={value === n}
            onPress={() => pick(n)}
        />
    );

    return (
        <div className="flex flex-col gap-3">
            <div role="group" aria-labelledby={labelId} aria-describedby={messageId} className="flex flex-col gap-2 @xl/survey:flex-row">
                <div className="flex gap-2 @xl/survey:contents">{range(0, 5).map(button)}</div>
                <div className="flex gap-2 @xl/survey:contents">{range(6, 10).map(button)}</div>
            </div>
            <ScaleLabels start={question.minLabel ? `0 · ${question.minLabel}` : undefined} end={question.maxLabel ? `10 · ${question.maxLabel}` : undefined} />
        </div>
    );
};

// ─── Rating ──────────────────────────────────────────────────────────────────

const ratingIcons: Record<RatingIcon, typeof Star01> = {
    star: Star01,
    heart: Heart,
    thumb: ThumbsUp,
};

export const RatingInput = ({ question, value, onChange, onCommit, shortcuts, labelId, messageId }: QuestionInputProps<RatingQuestion, number>) => {
    const { copy } = useSurveyCopy();
    const scale = Math.min(10, Math.max(3, question.scale ?? 5));
    const Icon = ratingIcons[question.icon ?? "star"];
    const [hovered, setHovered] = useState<number | null>(null);
    const shown = hovered ?? value ?? 0;

    const pick = (n: number) => {
        onChange(n);
        onCommit?.(n);
    };
    useNumberKeys(!!shortcuts, 1, scale, pick);

    return (
        <div role="group" aria-labelledby={labelId} aria-describedby={messageId} className="flex flex-wrap gap-1" onPointerLeave={() => setHovered(null)}>
            {range(1, scale).map((n) => (
                <button
                    key={n}
                    type="button"
                    aria-pressed={value === n}
                    aria-label={copy.ratingLabel(n, scale)}
                    onClick={() => pick(n)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(n)}
                    className="flex size-12 cursor-pointer items-center justify-center rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-brand @xl/survey:size-14"
                >
                    <Icon
                        aria-hidden="true"
                        className={cx(
                            "size-8 transition duration-100 ease-linear @xl/survey:size-10",
                            n <= shown ? "fill-current text-fg-brand-primary" : "text-fg-quaternary",
                        )}
                    />
                </button>
            ))}
        </div>
    );
};
