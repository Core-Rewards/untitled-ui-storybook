import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ClipboardCheck, Copy06, File06, GraduationHat01, SearchLg } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { SurveyKind, SurveyLocale } from "../survey-types";
import { SettingToggle } from "../builder/settings-fields";
import { formatDateRange, statusBadge } from "./admin-format";
import type { NewSurveyRequest, SurveyListItem, SurveyTemplate } from "./admin-types";

/** "blank", "template:<id>" or "duplicate:<id>". */
export type NewSurveySelection = string;

export interface NewSurveyPageProps {
    /** The Core-managed template library. Starters show first. */
    templates: SurveyTemplate[];
    /** This program's surveys, for "Copy a survey you've run". */
    surveys: SurveyListItem[];
    onCreate: (request: NewSurveyRequest) => void;
    /** Back to the survey list. */
    onCancel: () => void;
    /** Pre-select a starting point, e.g. `template:tpl-program-satisfaction` from the list's empty state. Its kind wins over `defaultKind`. */
    defaultSelection?: NewSurveySelection;
    /** Survey (default) or quiz. */
    defaultKind?: SurveyKind;
}

const KINDS: { id: SurveyKind; title: string; body: string; icon: typeof File06 }[] = [
    { id: "survey", title: "Survey", body: "Collect opinions and feedback. There are no wrong answers.", icon: ClipboardCheck },
    {
        id: "quiz",
        title: "Quiz",
        body: "Test what people know. Questions have right answers, and each person gets a score and one try.",
        icon: GraduationHat01,
    },
];

const kindOf = (item?: { kind?: SurveyKind }) => item?.kind ?? "survey";

const parse = (selection: NewSurveySelection) => {
    const [kind, id] = selection.split(":");
    return { kind: kind as "blank" | "template" | "duplicate", id };
};

/**
 * New survey (A2), as a page in the admin shell. It merges the template library:
 * choose a survey or a quiz, then start blank, pick a Core Rewards template
 * (searchable, by category, with a question preview), or copy one this program has
 * run. Templates and copies follow the kind. The right panel names it and sets its
 * base language; Create opens the builder.
 */
export const NewSurveyPage = ({ templates, surveys, onCreate, onCancel, defaultSelection, defaultKind }: NewSurveyPageProps) => {
    const [kind, setKind] = useState<SurveyKind>(() => {
        if (defaultSelection) {
            const start = parse(defaultSelection);
            const item = start.kind === "template" ? templates.find((t) => t.id === start.id) : surveys.find((s) => s.id === start.id);
            if (item) return kindOf(item);
        }
        return defaultKind ?? "survey";
    });
    const noun = kind === "quiz" ? "quiz" : "survey";
    const Noun = kind === "quiz" ? "Quiz" : "Survey";
    const ordered = useMemo(
        () => templates.filter((t) => kindOf(t) === kind).sort((a, b) => Number(!!b.isStarter) - Number(!!a.isStarter)),
        [templates, kind],
    );
    const [selection, setSelection] = useState<NewSurveySelection>(defaultSelection ?? (ordered[0] ? `template:${ordered[0].id}` : "blank"));
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [name, setName] = useState<string>();
    const [baseLocale, setBaseLocale] = useState<SurveyLocale>("en");
    /** Undefined until the admin chooses; until then it follows the starting point. */
    const [bilingualChoice, setBilingualChoice] = useState<boolean>();

    const categories = useMemo(() => ["All", ...Array.from(new Set(ordered.map((t) => t.category)))], [ordered]);
    const shownTemplates = ordered.filter(
        (t) =>
            (category === "All" || t.category === category) &&
            (!query.trim() || `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(query.trim().toLowerCase())),
    );
    const copyable = surveys.filter((s) => s.status !== "archived" && kindOf(s) === kind);

    const { kind: source, id } = parse(selection);
    const template = source === "template" ? ordered.find((t) => t.id === id) : undefined;
    const original = source === "duplicate" ? copyable.find((s) => s.id === id) : undefined;
    // Suggest a name from the starting point until the admin types their own.
    const suggestedName = template?.title ?? (original ? `Copy of ${original.title}` : "");
    const shownName = name ?? suggestedName;
    // Follows the starting point (a template with French, or a bilingual survey) until the admin chooses.
    const startsBilingual = template ? template.hasFrench : original ? original.locales.length > 1 : false;
    const bilingual = bilingualChoice ?? startsBilingual;
    const otherName = baseLocale === "en" ? "French" : "English";
    const canCreate = shownName.trim().length > 0 && (source === "blank" || !!template || !!original);

    /** Switching kind keeps the name and languages, and moves the selection to that kind's first template (or blank). */
    const changeKind = (next: SurveyKind) => {
        if (next === kind) return;
        setKind(next);
        setCategory("All");
        const first = templates.filter((t) => kindOf(t) === next).sort((a, b) => Number(!!b.isStarter) - Number(!!a.isStarter))[0];
        setSelection(first ? `template:${first.id}` : "blank");
    };

    const create = () => {
        if (!canCreate) return;
        onCreate({
            kind,
            source,
            templateId: template?.id,
            duplicateOfId: original?.id,
            name: shownName.trim(),
            baseLocale,
            bilingual,
        });
    };

    const groupValue = (prefix: string) => (selection.startsWith(prefix) ? selection : null);

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
                <nav aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2 text-sm">
                        <li>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex cursor-pointer items-center gap-1.5 rounded-sm font-medium text-tertiary outline-focus-ring hover:text-tertiary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                Surveys
                            </button>
                        </li>
                        <li aria-hidden="true" className="text-quaternary">
                            /
                        </li>
                        <li aria-current="page" className="font-semibold text-brand-secondary">
                            New {noun}
                        </li>
                    </ol>
                </nav>
                <div className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-semibold text-primary">New {noun}</h1>
                    <p className="text-md text-tertiary">Start blank, from a Core Rewards template, or from a {noun} you've run before.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="flex min-w-0 flex-col gap-10">
                    {/* Kind: fixed once created */}
                    <Section title="What are you making?" description="You can't switch between a survey and a quiz later.">
                        <RadioGroup
                            aria-label="Survey or quiz"
                            value={kind}
                            onChange={(v) => changeKind(v as SurveyKind)}
                            className="grid gap-3 sm:grid-cols-2"
                        >
                            {KINDS.map((k) => (
                                <OptionCard key={k.id} value={k.id} className="flex-row items-center">
                                    <FeaturedIcon icon={k.icon} color={kind === k.id ? "brand" : "gray"} theme="modern" size="md" />
                                    <span className="flex flex-1 flex-col">
                                        <span className="text-md font-semibold text-primary">{k.title}</span>
                                        <span className="text-sm text-tertiary">{k.body}</span>
                                    </span>
                                </OptionCard>
                            ))}
                        </RadioGroup>
                    </Section>

                    {/* Blank */}
                    <Section title="Start blank">
                        <RadioGroup aria-label="Start blank" value={groupValue("blank")} onChange={setSelection}>
                            <OptionCard value="blank" className="flex-row items-center">
                                <FeaturedIcon icon={File06} color="gray" theme="modern" size="md" />
                                <span className="flex flex-1 flex-col">
                                    <span className="text-md font-semibold text-primary">Blank {noun}</span>
                                    <span className="text-sm text-tertiary">
                                        {kind === "quiz"
                                            ? "An empty quiz with an intro and results screen. Add questions and mark the right answers in the builder."
                                            : "An empty survey with an intro and thank-you screen. Add questions in the builder."}
                                    </span>
                                </span>
                            </OptionCard>
                        </RadioGroup>
                    </Section>

                    {/* Template library */}
                    <Section
                        title="Templates"
                        description={
                            kind === "quiz"
                                ? "Written by Core Rewards. Swap in your own products; the right answers are marked for you to check."
                                : "Written by Core Rewards and reused across programs. Most come with French already written."
                        }
                        actions={
                            <Input
                                aria-label="Search templates"
                                placeholder="Search templates"
                                icon={SearchLg}
                                size="sm"
                                value={query}
                                onChange={setQuery}
                                className="sm:w-64"
                            />
                        }
                    >
                        <div role="group" aria-label="Template category" className="flex flex-wrap gap-2">
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    aria-pressed={category === c}
                                    onClick={() => setCategory(c)}
                                    className={cx(
                                        "cursor-pointer rounded-full px-3 py-1 text-sm font-medium ring-1 outline-focus-ring transition duration-100 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                                        category === c
                                            ? "bg-brand-primary_alt text-brand-secondary ring-brand"
                                            : "bg-primary text-secondary ring-primary hover:bg-primary_hover",
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {shownTemplates.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-secondary px-6 py-10 text-center text-sm text-tertiary">
                                No templates match your search.
                            </p>
                        ) : (
                            <RadioGroup aria-label="Templates" value={groupValue("template:")} onChange={setSelection} className="grid gap-3 xl:grid-cols-2">
                                {shownTemplates.map((t) => (
                                    <OptionCard key={t.id} value={`template:${t.id}`}>
                                        <FeaturedIcon icon={t.icon} color="gray" theme="modern" size="md" />
                                        <span className="flex flex-col gap-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="text-md font-semibold text-primary">{t.title}</span>
                                                {t.isStarter && (
                                                    <Badge color="brand" size="sm">
                                                        Starter
                                                    </Badge>
                                                )}
                                            </span>
                                            <span className="text-sm text-tertiary">{t.description}</span>
                                        </span>
                                        <span className="mt-auto text-xs text-tertiary">
                                            {t.category} · {t.questionCount} questions · About {t.minutes} min · {t.hasFrench ? "EN and FR" : "EN only"}
                                        </span>
                                    </OptionCard>
                                ))}
                            </RadioGroup>
                        )}
                    </Section>

                    {/* Duplicate */}
                    {copyable.length > 0 && (
                        <Section
                            title={`Copy a ${noun} you've run`}
                            description={
                                kind === "quiz"
                                    ? "Copies the questions, right answers, logic, settings and translations. Responses and scores aren't copied."
                                    : "Copies the questions, logic, settings and translations. Responses aren't copied."
                            }
                        >
                            <RadioGroup
                                aria-label={`Copy a ${noun}`}
                                value={groupValue("duplicate:")}
                                onChange={setSelection}
                                className="flex flex-col divide-y divide-secondary overflow-hidden rounded-xl ring-1 ring-secondary ring-inset"
                            >
                                {copyable.map((s) => (
                                    <Radio
                                        key={s.id}
                                        value={`duplicate:${s.id}`}
                                        className={({ isSelected, isFocusVisible }) =>
                                            cx(
                                                "flex cursor-pointer items-center gap-4 px-4 py-3 outline-hidden transition duration-100 ease-linear",
                                                isSelected ? "bg-brand-primary_alt" : "hover:bg-primary_hover",
                                                isFocusVisible && "ring-2 ring-focus-ring ring-inset",
                                            )
                                        }
                                    >
                                        {({ isSelected, isFocusVisible }) => (
                                            <>
                                                <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} />
                                                <Copy06 className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                <span className="flex min-w-0 flex-1 flex-col">
                                                    <span className="truncate text-sm font-semibold text-primary">{s.title}</span>
                                                    <span className="text-sm text-tertiary">
                                                        {s.questionCount} questions
                                                        {s.opensAt && s.closesAt ? ` · ${formatDateRange(s.opensAt, s.closesAt, s.timezone)}` : ""}
                                                        {" · "}
                                                        {s.locales.map((l) => l.toUpperCase()).join(" · ")}
                                                    </span>
                                                </span>
                                                <Badge color={statusBadge[s.status].color} size="sm" dot>
                                                    {statusBadge[s.status].label}
                                                </Badge>
                                            </>
                                        )}
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </Section>
                    )}
                </div>

                {/* Details panel */}
                <form
                    aria-label={`${Noun} details`}
                    onSubmit={(e) => {
                        e.preventDefault();
                        create();
                    }}
                    className="flex flex-col gap-5 rounded-2xl border border-secondary bg-primary p-5 shadow-xs lg:sticky lg:top-8"
                >
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Starting from</p>
                        <SelectionSummary template={template} original={original} noun={noun} />
                    </div>

                    <hr className="border-secondary" />

                    <Input
                        label={`${Noun} name`}
                        isRequired
                        placeholder={kind === "quiz" ? "e.g. 2027 Fungicide Lineup Quiz" : "e.g. 2026 Program Satisfaction"}
                        value={shownName}
                        onChange={setName}
                        hint="Participants see this on the dashboard card and in the invite email."
                    />

                    <RadioGroup
                        value={baseLocale}
                        onChange={(v) => setBaseLocale(v as SurveyLocale)}
                        className="flex flex-col gap-2"
                        aria-describedby="base-language-hint"
                    >
                        <span className="text-sm font-medium text-secondary">Base language</span>
                        <div className="flex gap-6">
                            {(["en", "fr"] as const).map((l) => (
                                <Radio key={l} value={l} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-secondary outline-hidden">
                                    {({ isSelected, isFocusVisible }) => (
                                        <>
                                            <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} />
                                            {l === "en" ? "English" : "French"}
                                        </>
                                    )}
                                </Radio>
                            ))}
                        </div>
                        <span id="base-language-hint" className="text-sm text-tertiary">
                            You write the {noun} in this language.
                        </span>
                    </RadioGroup>

                    <SettingToggle
                        label={`Also offer it in ${otherName}`}
                        hint={
                            bilingual
                                ? `You'll translate it in the builder. It can't be published until every string has ${otherName}.`
                                : "You can add it later in Settings."
                        }
                        isSelected={bilingual}
                        onChange={setBilingualChoice}
                    />

                    <div className="flex flex-col gap-2">
                        <Button type="submit" size="lg" isDisabled={!canCreate}>
                            Create {noun}
                        </Button>
                        <Button color="tertiary" size="lg" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Section = ({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) => (
    <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                {description && <p className="text-sm text-tertiary">{description}</p>}
            </div>
            {actions}
        </div>
        {children}
    </section>
);

/** A selectable card: the whole card is the radio, with the indicator top-right. */
const OptionCard = ({ value, className, children }: { value: string; className?: string; children: ReactNode }) => (
    <Radio
        value={value}
        className={({ isSelected, isFocusVisible }) =>
            cx(
                "relative flex h-full cursor-pointer flex-col gap-3 rounded-xl bg-primary p-4 pr-12 ring-1 ring-secondary outline-hidden transition duration-100 ease-linear ring-inset",
                isSelected ? "bg-brand-primary_alt ring-2 ring-brand" : "hover:bg-primary_hover",
                isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                className,
            )
        }
    >
        {({ isSelected, isFocusVisible }) => (
            <>
                {children}
                <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} className="absolute top-4 right-4" />
            </>
        )}
    </Radio>
);

/** What the chosen starting point contains: a template's questions, the survey being copied, or a blank survey. */
const SelectionSummary = ({ template, original, noun }: { template?: SurveyTemplate; original?: SurveyListItem; noun: "survey" | "quiz" }) => {
    if (template) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <FeaturedIcon icon={template.icon} color="brand" theme="light" size="sm" />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">{template.title}</span>
                        <span className="text-xs text-tertiary">
                            {template.questionCount} questions · About {template.minutes} min · {template.hasFrench ? "EN and FR" : "EN only"}
                        </span>
                    </div>
                </div>
                <ol className="flex flex-col gap-2">
                    {template.questions.map((q, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                            <span className="w-4 shrink-0 text-right font-medium text-quaternary">{i + 1}</span>
                            <span className="flex flex-col">
                                <span className="text-secondary">{q.title}</span>
                                <span className="text-xs text-tertiary">{q.type}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        );
    }
    if (original) {
        return (
            <div className="flex items-center gap-3">
                <FeaturedIcon icon={Copy06} color="brand" theme="light" size="sm" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">{original.title}</span>
                    <span className="text-xs text-tertiary">
                        {original.questionCount} questions · {original.locales.map((l) => l.toUpperCase()).join(" and ")} · responses not copied
                    </span>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3">
            <FeaturedIcon icon={File06} color="brand" theme="light" size="sm" />
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">Blank {noun}</span>
                <span className="text-xs text-tertiary">{noun === "quiz" ? "Intro and results screens" : "Intro and thank-you screens"}, no questions yet</span>
            </div>
        </div>
    );
};
