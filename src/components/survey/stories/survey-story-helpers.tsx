import { useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { SurveyQuestion } from "../questions/survey-question";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { useSurveyCopy } from "../survey-context";
import { getAnswerError } from "../survey-logic";
import type { AnswerValue, SurveyLocale, SurveyQuestion as SurveyQuestionType } from "../survey-types";

/** A fixed "today" for stories, so open/close dates never drift. */
export const STORY_NOW = new Date("2026-11-20T12:00:00-05:00");

export type FrameSize = "phone" | "desktop";

/** Width the question gets. Layout follows this width, not the window. */
export const Frame = ({ size, label, children }: { size: FrameSize; label?: string; children: ReactNode }) => (
    <figure className="flex max-w-full flex-col gap-2">
        {label && <figcaption className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</figcaption>}
        <div className={cx("rounded-2xl bg-primary ring-1 ring-secondary", size === "phone" ? "w-[390px] px-6 py-8" : "w-[880px] max-w-full px-16 py-14")}>
            {children}
        </div>
    </figure>
);

interface PlaygroundProps {
    question: SurveyQuestionType;
    size?: FrameSize | "both";
    locale?: SurveyLocale;
    initialValue?: AnswerValue;
    /** Show the inline message as if the participant tried to continue. */
    showValidation?: boolean;
    shortcuts?: boolean;
}

const PlaygroundInner = ({ question, size, initialValue, showValidation, shortcuts }: Omit<PlaygroundProps, "locale">) => {
    const { copy } = useSurveyCopy();
    const [value, setValue] = useState<AnswerValue | undefined>(initialValue);
    const [committed, setCommitted] = useState<string>();
    const [tried, setTried] = useState(!!showValidation);
    const message = tried ? getAnswerError(question, value, copy) : undefined;

    const render = (s: FrameSize, withShortcuts: boolean) => (
        <Frame size={s} label={size === "both" ? (s === "phone" ? "Phone · 390px" : "Desktop") : undefined}>
            <SurveyQuestion
                question={question}
                number={3}
                value={value}
                onChange={(v) => {
                    setValue(v);
                    setTried(false);
                }}
                onCommit={(v) => {
                    setTried(true);
                    setCommitted(JSON.stringify(v));
                }}
                message={message}
                shortcuts={withShortcuts}
            />
        </Frame>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className={cx("flex gap-8", size === "both" ? "flex-wrap items-start" : "flex-col")}>
                {(size === "phone" || size === "both") && render("phone", false)}
                {(size === "desktop" || size === "both") && render("desktop", !!shortcuts)}
            </div>
            <dl className="grid max-w-[880px] grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl bg-secondary px-4 py-3 font-mono text-xs text-secondary">
                <dt className="text-quaternary">value</dt>
                <dd className="break-all">{value === undefined ? "undefined" : JSON.stringify(value)}</dd>
                <dt className="text-quaternary">committed</dt>
                <dd className="break-all">{committed ?? "—"}</dd>
            </dl>
        </div>
    );
};

/** Renders one question with live state and shows its value, for the Questions stories. */
export const QuestionPlayground = ({ locale = "en", size = "both", shortcuts = true, ...props }: PlaygroundProps) => (
    <SurveyLocaleProvider locale={locale}>
        <PlaygroundInner key={`${props.question.id}-${locale}`} size={size} shortcuts={shortcuts} {...props} />
    </SurveyLocaleProvider>
);
