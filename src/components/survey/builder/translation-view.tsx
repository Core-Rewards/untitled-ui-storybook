import { useLayoutEffect, useRef, useState } from "react";
import { Check, Stars02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkboxes/checkbox";
import { cx } from "@/utils/cx";
import type { Survey, SurveyLocale } from "../survey-types";
import { LANGUAGE_NAMES, NATIVE_NAMES, extractStrings } from "./builder-model";
import type { SurveyStringEntry, Translations } from "./builder-model";

export interface TranslationViewProps {
    survey: Survey;
    /** The language being translated into, e.g. French for an English survey. */
    locale: SurveyLocale;
    translations: Translations;
    /** Keys filled by AI that a person hasn't edited or approved yet. */
    aiDrafts: Set<string>;
    onChange: (key: string, text: string) => void;
    /** Mark an AI draft as reviewed without editing it. */
    onApprove: (key: string) => void;
    /** Fill every missing string with an AI draft for review. */
    onDraftMissing: () => Promise<void> | void;
}

/**
 * The side-by-side translation view (A5), for surveys offered in a second language:
 * every participant-facing string, the base language on the left and a field for
 * the second language on the right, with progress and missing strings highlighted.
 * The survey can't be published until every string is translated. AI
 * drafts are marked Review until a person edits or approves them.
 */
export const TranslationView = ({ survey, locale, translations, aiDrafts, onChange, onApprove, onDraftMissing }: TranslationViewProps) => {
    const name = LANGUAGE_NAMES[locale];
    const [missingOnly, setMissingOnly] = useState(false);
    const [drafting, setDrafting] = useState(false);
    const strings = extractStrings(survey);
    const done = strings.filter((s) => translations[s.key]?.trim()).length;
    const missing = strings.length - done;
    const shown = missingOnly ? strings.filter((s) => !translations[s.key]?.trim() || aiDrafts.has(s.key)) : strings;

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 lg:px-8">
            <section className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                    <h2 className="text-md font-semibold text-primary">
                        {name} version · {done} of {strings.length} strings done
                    </h2>
                    <div
                        role="progressbar"
                        aria-label={`${name} strings translated`}
                        aria-valuemin={0}
                        aria-valuemax={strings.length}
                        aria-valuenow={done}
                        className="h-2 w-full max-w-80 overflow-hidden rounded-full bg-quaternary"
                    >
                        <div className="h-full rounded-full bg-brand-solid" style={{ width: `${(done / Math.max(1, strings.length)) * 100}%` }} />
                    </div>
                    <p className="text-sm text-tertiary">
                        {missing
                            ? `The survey can't be published until every ${name} string is filled in.`
                            : `Every string has ${name}. Review any AI drafts before publishing.`}
                        {aiDrafts.size > 0 && ` ${aiDrafts.size} AI ${aiDrafts.size === 1 ? "draft needs" : "drafts need"} review.`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Checkbox isSelected={missingOnly} onChange={setMissingOnly}>
                        Show missing and unreviewed only
                    </Checkbox>
                    <Button
                        color="secondary"
                        size="md"
                        iconLeading={Stars02}
                        isDisabled={missing === 0}
                        isLoading={drafting}
                        showTextWhileLoading
                        onClick={async () => {
                            setDrafting(true);
                            await onDraftMissing();
                            setDrafting(false);
                        }}
                    >
                        Draft missing with AI
                    </Button>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs">
                <div className="hidden grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] gap-6 border-b border-secondary bg-secondary_subtle px-5 py-3 text-xs font-semibold text-tertiary md:grid">
                    <span>Where</span>
                    <span>{LANGUAGE_NAMES[survey.locale]} (base)</span>
                    <span>{NATIVE_NAMES[locale]}</span>
                </div>
                {shown.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-tertiary">Nothing missing. Every string has a reviewed {name} version.</p>
                ) : (
                    <ul className="divide-y divide-secondary">
                        {shown.map((entry) => (
                            <TranslationRow
                                key={entry.key}
                                entry={entry}
                                locale={locale}
                                value={translations[entry.key] ?? ""}
                                isAiDraft={aiDrafts.has(entry.key) && !!translations[entry.key]?.trim()}
                                onChange={(t) => onChange(entry.key, t)}
                                onApprove={() => onApprove(entry.key)}
                            />
                        ))}
                    </ul>
                )}
            </section>

            <p className="text-sm text-tertiary">
                AI drafts are marked Review until a person edits or approves them. Participants see the language set on their profile.
            </p>
        </div>
    );
};

const TranslationRow = ({
    entry,
    locale,
    value,
    isAiDraft,
    onChange,
    onApprove,
}: {
    entry: SurveyStringEntry;
    locale: SurveyLocale;
    value: string;
    isAiDraft: boolean;
    onChange: (t: string) => void;
    onApprove: () => void;
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const isMissing = !value.trim();
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.max(48, el.scrollHeight)}px`;
    }, [value]);

    return (
        <li className="grid gap-2 px-5 py-4 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
            <span className="pt-3 text-xs font-semibold text-tertiary">{entry.where}</span>
            <p className="rounded-lg bg-secondary px-3.5 py-3 text-md text-secondary">{entry.text}</p>
            <div className="flex flex-col gap-2">
                <textarea
                    ref={ref}
                    rows={1}
                    lang={locale}
                    aria-label={`${LANGUAGE_NAMES[locale]} for ${entry.where}`}
                    placeholder="Needs translation"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cx(
                        "w-full resize-none rounded-lg px-3.5 py-3 text-md text-primary shadow-xs ring-1 outline-hidden ring-inset placeholder:text-warning-primary focus:ring-2 focus:ring-brand",
                        isMissing ? "bg-warning-primary ring-fg-warning-secondary" : isAiDraft ? "bg-brand-primary_alt ring-brand" : "bg-primary ring-primary",
                    )}
                />
                {isAiDraft && (
                    <div className="flex items-center gap-2">
                        <Badge color="brand" size="sm">
                            <Stars02 className="size-3" aria-hidden="true" /> AI draft · Review
                        </Badge>
                        <button
                            type="button"
                            onClick={onApprove}
                            className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-brand-secondary outline-focus-ring hover:bg-brand-primary_alt focus-visible:outline-2"
                        >
                            <Check className="size-4" aria-hidden="true" />
                            Approve
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
};
