import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Copy06, File06, SearchLg } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { SurveyLocale } from "../survey-types";
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
    /** Pre-select a starting point, e.g. `template:tpl-program-satisfaction` from the list's empty state. */
    defaultSelection?: NewSurveySelection;
}

const parse = (selection: NewSurveySelection) => {
    const [kind, id] = selection.split(":");
    return { kind: kind as "blank" | "template" | "duplicate", id };
};

/**
 * New survey (A2), as a page in the admin shell. It merges the template library:
 * start blank, pick a Core Rewards template (searchable, by category, with a
 * question preview), or copy a survey this program has run. The right panel names
 * the survey and sets its base language; Create survey opens the builder.
 */
export const NewSurveyPage = ({ templates, surveys, onCreate, onCancel, defaultSelection }: NewSurveyPageProps) => {
    const ordered = useMemo(() => [...templates].sort((a, b) => Number(!!b.isStarter) - Number(!!a.isStarter)), [templates]);
    const [selection, setSelection] = useState<NewSurveySelection>(defaultSelection ?? (ordered[0] ? `template:${ordered[0].id}` : "blank"));
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [name, setName] = useState<string>();
    const [baseLocale, setBaseLocale] = useState<SurveyLocale>("en");
    /** Undefined until the admin chooses; until then it follows the starting point. */
    const [bilingualChoice, setBilingualChoice] = useState<boolean>();

    const categories = useMemo(() => ["All", ...Array.from(new Set(templates.map((t) => t.category)))], [templates]);
    const shownTemplates = ordered.filter(
        (t) =>
            (category === "All" || t.category === category) &&
            (!query.trim() || `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(query.trim().toLowerCase())),
    );
    const copyable = surveys.filter((s) => s.status !== "archived");

    const { kind, id } = parse(selection);
    const template = kind === "template" ? templates.find((t) => t.id === id) : undefined;
    const original = kind === "duplicate" ? surveys.find((s) => s.id === id) : undefined;
    // Suggest a name from the starting point until the admin types their own.
    const suggestedName = template?.title ?? (original ? `Copy of ${original.title}` : "");
    const shownName = name ?? suggestedName;
    // Follows the starting point (a template with French, or a bilingual survey) until the admin chooses.
    const startsBilingual = template ? template.hasFrench : original ? original.locales.length > 1 : false;
    const bilingual = bilingualChoice ?? startsBilingual;
    const otherName = baseLocale === "en" ? "French" : "English";
    const canCreate = shownName.trim().length > 0 && (kind === "blank" || !!template || !!original);

    const create = () => {
        if (!canCreate) return;
        onCreate({
            source: kind,
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
                            New survey
                        </li>
                    </ol>
                </nav>
                <div className="flex flex-col gap-1">
                    <h1 className="text-display-xs font-semibold text-primary">New survey</h1>
                    <p className="text-md text-tertiary">Start blank, from a Core Rewards template, or from a survey you've run before.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="flex min-w-0 flex-col gap-10">
                    {/* Blank */}
                    <Section title="Start blank">
                        <RadioGroup aria-label="Start blank" value={groupValue("blank")} onChange={setSelection}>
                            <OptionCard value="blank" className="flex-row items-center">
                                <FeaturedIcon icon={File06} color="gray" theme="modern" size="md" />
                                <span className="flex flex-1 flex-col">
                                    <span className="text-md font-semibold text-primary">Blank survey</span>
                                    <span className="text-sm text-tertiary">
                                        An empty survey with an intro and thank-you screen. Add questions in the builder.
                                    </span>
                                </span>
                            </OptionCard>
                        </RadioGroup>
                    </Section>

                    {/* Template library */}
                    <Section
                        title="Templates"
                        description="Written by Core Rewards and reused across programs. Most come with French already written."
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
                            title="Copy a survey you've run"
                            description="Copies the questions, logic, settings and translations. Responses aren't copied."
                        >
                            <RadioGroup
                                aria-label="Copy a survey"
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
                    aria-label="Survey details"
                    onSubmit={(e) => {
                        e.preventDefault();
                        create();
                    }}
                    className="flex flex-col gap-5 rounded-2xl border border-secondary bg-primary p-5 shadow-xs lg:sticky lg:top-8"
                >
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Starting from</p>
                        <SelectionSummary template={template} original={original} />
                    </div>

                    <hr className="border-secondary" />

                    <Input
                        label="Survey name"
                        isRequired
                        placeholder="e.g. 2026 Program Satisfaction"
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
                            You write the survey in this language.
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
                            Create survey
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
const SelectionSummary = ({ template, original }: { template?: SurveyTemplate; original?: SurveyListItem }) => {
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
                <span className="text-sm font-semibold text-primary">Blank survey</span>
                <span className="text-xs text-tertiary">Intro and thank-you screens, no questions yet</span>
            </div>
        </div>
    );
};
