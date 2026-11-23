import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Copy06, Eye, FlipBackward, Laptop01, Phone01, Plus, Trash01 } from "@untitledui/icons";
import { Heading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { ProgressSteps } from "@/components/base/progress-steps/progress-steps";
import type { ProgressStepStatus } from "@/components/base/progress-steps/progress-steps";
import { Toast } from "@/components/base/toast/toast";
import { cx } from "@/utils/cx";
import { statusBadge } from "../admin/admin-format";
import { SurveyPlayer } from "../participant/survey-player";
import { SurveyQuestion } from "../questions/survey-question";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import type { Survey, SurveyQuestion as SurveyQuestionData, SurveyQuestionType, SurveyRewardType } from "../survey-types";
import { AddQuestionPicker } from "./add-question-picker";
import type { BankQuestion } from "./builder-sample-data";
import {
    LANGUAGE_NAMES,
    changeQuestionType,
    createQuestion,
    extractStrings,
    newOptionId,
    newQuestionId,
    otherLocale,
    secondLocaleOf,
    setSecondLocale,
    translationProgress,
} from "./builder-model";
import type { SurveyStringEntry, Translations } from "./builder-model";
import { buildChecklist } from "./publish-checklist";
import type { ChecklistTarget } from "./publish-checklist";
import { RewardStep } from "./reward-step";
import { ScheduleStep } from "./schedule-step";
import { SettingsStep } from "./settings-step";
import { TranslationView } from "./translation-view";
import { LogicPanel } from "./logic-panel";
import { QuestionOutline } from "./question-outline";
import type { OutlineSelection } from "./question-outline";
import { QuestionSettings } from "./question-settings";

export type BuilderStep = "questions" | "settings" | "reward" | "schedule";

const STEPS: { id: BuilderStep; label: string }[] = [
    { id: "questions", label: "Questions" },
    { id: "settings", label: "Settings" },
    { id: "reward", label: "Reward" },
    { id: "schedule", label: "Schedule and publish" },
];

export interface SurveyBuilderProps {
    survey: Survey;
    translations: Translations;
    /** Autosave: every edit. */
    onChange?: (survey: Survey, translations: Translations) => void;
    /** Back to the survey list. */
    onExit: () => void;
    /** Called when the admin moves between steps. */
    onStepChange?: (step: BuilderStep) => void;
    /** AI first draft for missing second-language strings (French for English surveys). The result is marked for review. */
    onDraftTranslations?: (entries: SurveyStringEntry[]) => Promise<Translations>;
    /** Publish or schedule, after the review checklist passes. */
    onPublish?: (survey: Survey, translations: Translations) => void;
    programName?: string;
    /** Reward types Core has turned on for this program. */
    enabledRewardTypes?: SurveyRewardType[];
    /** Everyone in the program, for the reward's maximum cost. */
    eligibleParticipants?: number;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
    initialStep?: BuilderStep;
    /** Open on the side-by-side translation view (surveys with a second language only). */
    initialView?: "build" | "translate";
    /** For stories. */
    initialSelectedId?: OutlineSelection;
    initialPanelTab?: "settings" | "logic";
    initialFrame?: "desktop" | "mobile";
    initialPickerOpen?: boolean;
}

type Snapshot = { survey: Survey; translations: Translations; selectedId: OutlineSelection };

/** Copies a question with fresh ids so it can sit next to the original. */
const cloneQuestion = (q: SurveyQuestionData, id: string): SurveyQuestionData => {
    const copy = structuredClone(q) as SurveyQuestionData;
    copy.id = id;
    if ("options" in copy) copy.options = copy.options.map((o) => ({ ...o, id: newOptionId() }));
    if (copy.type === "matrix") {
        copy.rows = copy.rows.map((o) => ({ ...o, id: newOptionId() }));
        copy.columns = copy.columns.map((o) => ({ ...o, id: newOptionId() }));
    }
    copy.logic = undefined;
    copy.defaultTarget = undefined;
    return copy;
};

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/**
 * The survey builder (A3–A8), in the admin shell with the sidebar collapsed to a
 * rail. Step 1, Questions: the outline, a live canvas that renders the
 * participant's question with its text edited in place, and the settings panel
 * with Settings and Logic tabs. Surveys offered in a second language get an EN | FR
 * switch for the side-by-side translation view; others don't need one.
 * Steps 2 to 4 are Settings, Reward, and Schedule and publish with the review
 * checklist. Every edit autosaves and can be undone.
 */
export const SurveyBuilder = ({
    survey: initialSurvey,
    translations: initialTranslations,
    onChange,
    onExit,
    onStepChange,
    onDraftTranslations,
    onPublish,
    programName = "the program",
    enabledRewardTypes = ["points", "sweepstakes", "arcade_spins"],
    eligibleParticipants = 1240,
    now,
    initialStep = "questions",
    initialView = "build",
    initialSelectedId,
    initialPanelTab = "settings",
    initialFrame = "desktop",
    initialPickerOpen = false,
}: SurveyBuilderProps) => {
    const [survey, setSurvey] = useState(initialSurvey);
    const [translations, setTranslations] = useState(initialTranslations);
    const [selectedId, setSelectedId] = useState<OutlineSelection>(initialSelectedId ?? initialSurvey.questions[0]?.id ?? "intro");
    const [history, setHistory] = useState<Snapshot[]>([]);
    const [panelTab, setPanelTab] = useState(initialPanelTab);
    const [frame, setFrame] = useState(initialFrame);
    const [justAdded, setJustAdded] = useState<string | null>(null);
    const [toast, setToast] = useState<{ id: number; message: string; undo: boolean } | null>(null);
    const [picker, setPicker] = useState<{ open: boolean; index: number }>({ open: initialPickerOpen, index: initialSurvey.questions.length });
    const [pendingType, setPendingType] = useState<{ question: SurveyQuestionData; next: SurveyQuestionData; dropped: string[] } | null>(null);
    const [saved, setSaved] = useState<"saved" | "saving">("saved");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [step, setStep] = useState<BuilderStep>(initialStep);
    const [view, setView] = useState<"build" | "translate">(initialView);
    const [aiDrafts, setAiDrafts] = useState<Set<string>>(new Set());
    const [visited, setVisited] = useState<Set<BuilderStep>>(new Set([initialStep]));
    const pickerAnchor = useRef<Element | null>(null);
    const addButtonRef = useRef<HTMLDivElement>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const fr = translationProgress(survey, translations);
    // Not every survey is translated. The switch and the translation view only exist when a second language is on.
    const second = secondLocaleOf(survey);
    const translating = view === "translate" && !!second;
    const selectedQuestion = survey.questions.find((q) => q.id === selectedId);
    const selectedIndex = selectedQuestion ? survey.questions.indexOf(selectedQuestion) : -1;
    const answerable = survey.questions.filter((q) => q.type !== "statement").length;

    /** Apply an edit: remember the previous state for Undo, then autosave. */
    /** Groups rapid edits to the same question (typing) into one Undo step. */
    const lastEdit = useRef<{ key: string; at: number } | null>(null);

    const commit = useCallback(
        (next: Survey, nextTranslations: Translations = translations, nextSelected: OutlineSelection = selectedId, coalesceKey?: string) => {
            const now = Date.now();
            const grouped = !!coalesceKey && lastEdit.current?.key === coalesceKey && now - lastEdit.current.at < 1500;
            lastEdit.current = coalesceKey ? { key: coalesceKey, at: now } : null;
            if (!grouped) setHistory((h) => [...h.slice(-49), { survey, translations, selectedId }]);
            setSurvey(next);
            setTranslations(nextTranslations);
            setSelectedId(nextSelected);
            onChange?.(next, nextTranslations);
            setSaved("saving");
            clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => setSaved("saved"), 600);
        },
        [survey, translations, selectedId, onChange],
    );

    const undo = useCallback(() => {
        const prev = history.at(-1);
        if (!prev) return;
        setHistory((h) => h.slice(0, -1));
        lastEdit.current = null;
        setSurvey(prev.survey);
        setTranslations(prev.translations);
        setSelectedId(prev.selectedId);
        setJustAdded(null);
        onChange?.(prev.survey, prev.translations);
    }, [history, onChange]);

    useEffect(() => () => clearTimeout(saveTimer.current), []);

    // "/" opens the picker; Cmd/Ctrl+Z undoes, outside text fields.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isTyping(e.target) || previewOpen) return;
            if (e.key === "/" && !e.metaKey && !e.ctrlKey && step === "questions" && !translating) {
                e.preventDefault();
                pickerAnchor.current = addButtonRef.current;
                setPicker({ open: true, index: selectedIndex >= 0 ? selectedIndex + 1 : survey.questions.length });
            } else if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedIndex, survey.questions.length, undo, previewOpen, step, translating]);

    const updateQuestion = (q: SurveyQuestionData) =>
        commit({ ...survey, questions: survey.questions.map((x) => (x.id === q.id ? q : x)) }, translations, selectedId, q.id);

    const insert = (q: SurveyQuestionData, index: number, extra: Translations = {}) => {
        const questions = [...survey.questions.slice(0, index), q, ...survey.questions.slice(index)];
        commit({ ...survey, questions }, { ...translations, ...extra }, q.id);
        setJustAdded(q.id);
        setPanelTab("settings");
        setPicker((p) => ({ ...p, open: false }));
        setToast({ id: Date.now(), message: `Question ${index + 1} added`, undo: true });
    };

    const addType = (type: SurveyQuestionType) => insert(createQuestion(type, newQuestionId(survey), programName), picker.index);

    const addFromBank = (item: BankQuestion) => {
        const id = newQuestionId(survey);
        const q = { ...structuredClone(item.question), id } as SurveyQuestionData;
        const extra = Object.fromEntries(Object.entries(item.fr).map(([field, text]) => [`${id}.${field}`, text]));
        insert(q, picker.index, extra);
    };

    const remove = (q: SurveyQuestionData) => {
        const questions = survey.questions
            .filter((x) => x.id !== q.id)
            .map((x) => ({
                ...x,
                logic: x.logic?.filter((r) => r.goTo !== q.id && r.when.questionId !== q.id),
                defaultTarget: x.defaultTarget === q.id ? undefined : x.defaultTarget,
            }));
        const i = survey.questions.indexOf(q);
        commit({ ...survey, questions }, translations, questions[Math.max(0, i - 1)]?.id ?? "intro");
        setToast({ id: Date.now(), message: `Question ${i + 1} deleted`, undo: true });
    };

    const duplicate = (q: SurveyQuestionData) => {
        const i = survey.questions.indexOf(q);
        const copy = cloneQuestion(q, newQuestionId(survey));
        const questions = [...survey.questions.slice(0, i + 1), copy, ...survey.questions.slice(i + 1)];
        commit({ ...survey, questions }, translations, copy.id);
        setToast({ id: Date.now(), message: `Question ${i + 2} added as a copy`, undo: true });
    };

    const requestType = (q: SurveyQuestionData, type: SurveyQuestionType) => {
        const { question: next, dropped } = changeQuestionType(q, type, programName);
        if (dropped.length) setPendingType({ question: q, next: { ...next, logic: undefined }, dropped });
        else updateQuestion({ ...next, logic: q.logic });
    };

    const goTo = (next: BuilderStep, nextView: "build" | "translate" = "build") => {
        setStep(next);
        setView(nextView);
        setVisited((v) => new Set([...v, next]));
        onStepChange?.(next);
    };

    // Step indicator: current, needs attention (a visited step with a blocking checklist item), done, or not yet.
    const checklist = buildChecklist(survey, translations, eligibleParticipants, now);
    const stepOf: Record<ChecklistTarget, BuilderStep> = {
        questions: "questions",
        french: "questions",
        settings: "settings",
        reward: "reward",
        schedule: "schedule",
    };
    const stepStatus = (id: BuilderStep): ProgressStepStatus => {
        if (id === step) return "current";
        if (!visited.has(id)) return "upcoming";
        return checklist.some((i) => i.status === "error" && stepOf[i.fixIn] === id && (id !== "schedule" || visited.has("schedule"))) ? "error" : "complete";
    };
    const nextStep = STEPS[STEPS.findIndex((s) => s.id === step) + 1];

    return (
        <SurveyLocaleProvider locale={survey.locale}>
            <div className="flex h-full min-h-0 flex-col">
                {/* Page header: breadcrumb, title, status, save state, language, preview, next */}
                <header className="flex flex-col gap-4 border-b border-secondary bg-primary px-6 pt-5 pb-0 lg:pr-16">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <nav aria-label="Breadcrumb">
                                <ol className="flex items-center gap-2 text-sm">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={onExit}
                                            className="flex cursor-pointer items-center gap-1.5 rounded-sm font-medium text-tertiary outline-focus-ring hover:text-tertiary_hover focus-visible:outline-2"
                                        >
                                            <ArrowLeft className="size-4" aria-hidden="true" />
                                            Surveys
                                        </button>
                                    </li>
                                    <li aria-hidden="true" className="text-quaternary">
                                        /
                                    </li>
                                    <li aria-current="page" className="truncate font-semibold text-brand-secondary">
                                        {survey.title}
                                    </li>
                                </ol>
                            </nav>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-semibold text-primary">{survey.title}</h1>
                                <Badge color={statusBadge[survey.status].color} size="sm" dot>
                                    {statusBadge[survey.status].label}
                                </Badge>
                                <span role="status" className="text-sm text-tertiary">
                                    {saved === "saving" ? "Saving…" : "Saved just now"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button color="tertiary" size="md" iconLeading={FlipBackward} isDisabled={history.length === 0} onClick={undo}>
                                Undo
                            </Button>
                            {second ? (
                                <div role="group" aria-label="Language" className="flex overflow-hidden rounded-lg ring-1 ring-primary ring-inset">
                                    <button
                                        type="button"
                                        aria-pressed={!translating}
                                        aria-label={`${LANGUAGE_NAMES[survey.locale]} (base)`}
                                        onClick={() => setView("build")}
                                        className={cx(
                                            "cursor-pointer px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                            !translating ? "bg-primary-solid text-white" : "text-secondary hover:bg-primary_hover",
                                        )}
                                    >
                                        {survey.locale.toUpperCase()}
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={translating}
                                        onClick={() => setView("translate")}
                                        aria-label={`${LANGUAGE_NAMES[second]}: ${fr.done} of ${fr.total} strings translated`}
                                        className={cx(
                                            "cursor-pointer px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                            translating ? "bg-primary-solid text-white" : "text-secondary hover:bg-primary_hover",
                                        )}
                                    >
                                        {second.toUpperCase()}{" "}
                                        <span
                                            className={cx(
                                                "font-medium",
                                                translating ? "text-white/80" : fr.done < fr.total ? "text-warning-primary" : "text-tertiary",
                                            )}
                                        >
                                            {fr.done}/{fr.total}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    color="tertiary"
                                    size="md"
                                    iconLeading={Plus}
                                    aria-label={`Also offer this survey in ${LANGUAGE_NAMES[otherLocale(survey.locale)]}`}
                                    onClick={() => {
                                        commit(setSecondLocale(survey, true));
                                        setView("translate");
                                    }}
                                >
                                    {LANGUAGE_NAMES[otherLocale(survey.locale)]}
                                </Button>
                            )}
                            <Button color="secondary" size="md" iconLeading={Eye} onClick={() => setPreviewOpen(true)}>
                                Preview
                            </Button>
                            {nextStep && (
                                <Button size="md" iconTrailing={ArrowRight} onClick={() => goTo(nextStep.id)}>
                                    Next: {nextStep.label}
                                </Button>
                            )}
                        </div>
                    </div>

                    <ProgressSteps
                        aria-label="Survey setup"
                        steps={STEPS.map((s) => ({ id: s.id, label: s.label, status: stepStatus(s.id) }))}
                        onSelect={(id) => goTo(id as BuilderStep)}
                        className="pb-3"
                    />
                </header>

                {/* Step body: the three-pane Questions step, the French view, or a form step */}
                {step === "questions" && !translating ? (
                    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)_20rem] xl:grid-cols-[20rem_minmax(0,1fr)_22rem]">
                        <aside aria-label="Outline" className="min-h-0 overflow-y-auto border-secondary bg-primary p-4 lg:border-r">
                            {answerable > 10 && (
                                <p className="mb-3 rounded-lg bg-secondary px-3 py-2 text-xs text-tertiary">
                                    {answerable} questions. Surveys over 10 questions usually get fewer completions.
                                </p>
                            )}
                            <QuestionOutline
                                survey={survey}
                                selectedId={selectedId}
                                onSelect={(id) => {
                                    setSelectedId(id);
                                    setJustAdded(null);
                                }}
                                onReorder={(ids) => commit({ ...survey, questions: ids.map((id) => survey.questions.find((q) => q.id === id)!) })}
                                onInsert={(index, anchor) => {
                                    pickerAnchor.current = anchor;
                                    setPicker({ open: true, index });
                                }}
                            />
                            {/* Anchor for the "/" shortcut: the Add question button at the bottom of the outline. */}
                            <div ref={addButtonRef} aria-hidden="true" className="h-0" />
                        </aside>

                        <section
                            aria-label="Preview canvas"
                            className="flex min-h-0 flex-col items-center gap-4 overflow-y-auto bg-secondary_subtle px-4 py-5 lg:px-8"
                        >
                            <div role="group" aria-label="Canvas size" className="flex rounded-lg bg-primary p-1 ring-1 ring-secondary ring-inset">
                                {(["desktop", "mobile"] as const).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        aria-pressed={frame === f}
                                        onClick={() => setFrame(f)}
                                        className={cx(
                                            "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                            frame === f ? "bg-secondary text-primary shadow-xs" : "text-quaternary hover:text-tertiary",
                                        )}
                                    >
                                        {f === "desktop" ? (
                                            <Laptop01 className="size-4" aria-hidden="true" />
                                        ) : (
                                            <Phone01 className="size-4" aria-hidden="true" />
                                        )}
                                        {f === "desktop" ? "Desktop" : "Mobile"}
                                    </button>
                                ))}
                            </div>

                            <div
                                className={cx(
                                    "relative w-full overflow-hidden rounded-2xl bg-primary shadow-sm ring-1 ring-secondary",
                                    frame === "desktop" ? "max-w-3xl px-14 pt-14 pb-12" : "max-w-[390px] px-6 pt-10 pb-8",
                                )}
                            >
                                {selectedQuestion && (
                                    <>
                                        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-quaternary">
                                            <div
                                                className="h-full bg-brand-solid"
                                                style={{ width: `${(selectedIndex / Math.max(1, survey.questions.length)) * 100}%` }}
                                            />
                                        </div>
                                        <SurveyQuestion
                                            key={selectedQuestion.id}
                                            question={selectedQuestion}
                                            number={survey.questions.slice(0, selectedIndex + 1).filter((q) => q.type !== "statement").length}
                                            value={undefined}
                                            onChange={() => {}}
                                            editor={{ onChange: updateQuestion, autoFocus: justAdded === selectedQuestion.id }}
                                        />
                                    </>
                                )}
                                {!selectedQuestion && <ScreenPreview survey={survey} which={selectedId === "intro" ? "intro" : "thankYou"} />}
                            </div>
                            {selectedQuestion && (
                                <p className="text-center text-sm text-tertiary">
                                    Click any text in the preview to edit it in place. Dashed underlines mark editable text.
                                </p>
                            )}
                        </section>

                        <aside aria-label="Question settings" className="flex min-h-0 flex-col border-secondary bg-primary lg:border-l">
                            {selectedQuestion ? (
                                <>
                                    <div role="tablist" aria-label="Question panel" className="flex gap-5 border-b border-secondary px-5 pt-4">
                                        {(["settings", "logic"] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                role="tab"
                                                aria-selected={panelTab === t}
                                                onClick={() => setPanelTab(t)}
                                                className={cx(
                                                    "-mb-px flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                                    panelTab === t
                                                        ? "border-brand text-brand-secondary"
                                                        : "border-transparent text-quaternary hover:text-tertiary",
                                                )}
                                            >
                                                {t === "settings" ? "Settings" : "Logic"}
                                                {t === "logic" && !!selectedQuestion.logic?.length && (
                                                    <Badge size="sm" color={panelTab === t ? "brand" : "gray"}>
                                                        {selectedQuestion.logic.length}
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-5">
                                        {panelTab === "settings" ? (
                                            <QuestionSettings
                                                question={selectedQuestion}
                                                onChange={updateQuestion}
                                                onTypeChange={(type) => requestType(selectedQuestion, type)}
                                            />
                                        ) : (
                                            <LogicPanel survey={survey} question={selectedQuestion} onChange={updateQuestion} />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                                        <Button color="secondary" size="md" iconLeading={Copy06} onClick={() => duplicate(selectedQuestion)}>
                                            Duplicate
                                        </Button>
                                        <Button color="secondary-destructive" size="md" iconLeading={Trash01} onClick={() => remove(selectedQuestion)}>
                                            Delete
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 p-5">
                                    <p className="text-sm font-semibold text-primary">{selectedId === "intro" ? "Intro screen" : "Thank-you screen"}</p>
                                    <p className="text-sm text-tertiary">
                                        {selectedId === "intro"
                                            ? "The intro's title, text and image are set in step 2, Settings. Time and question count are calculated for you."
                                            : "The thank-you message and where its button goes are set in step 2, Settings. The reward comes from step 3."}
                                    </p>
                                    <Button color="secondary" size="sm" onClick={() => goTo("settings")} className="self-start">
                                        Go to Settings
                                    </Button>
                                </div>
                            )}
                        </aside>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto bg-secondary_subtle">
                        {translating && second ? (
                            <TranslationView
                                locale={second}
                                survey={survey}
                                translations={translations}
                                aiDrafts={aiDrafts}
                                onChange={(key, text) => {
                                    commit(survey, { ...translations, [key]: text }, selectedId, `fr:${key}`);
                                    setAiDrafts((d) => {
                                        const n = new Set(d);
                                        n.delete(key);
                                        return n;
                                    });
                                }}
                                onApprove={(key) =>
                                    setAiDrafts((d) => {
                                        const n = new Set(d);
                                        n.delete(key);
                                        return n;
                                    })
                                }
                                onDraftMissing={async () => {
                                    const missing = extractStrings(survey).filter((s) => !translations[s.key]?.trim());
                                    if (!missing.length || !onDraftTranslations) return;
                                    const drafted = await onDraftTranslations(missing);
                                    commit(survey, { ...translations, ...drafted });
                                    setAiDrafts((d) => new Set([...d, ...Object.keys(drafted)]));
                                    setToast({
                                        id: Date.now(),
                                        message: `${Object.keys(drafted).length} ${LANGUAGE_NAMES[second]} strings drafted. Review them before publishing.`,
                                        undo: true,
                                    });
                                }}
                            />
                        ) : step === "settings" ? (
                            <SettingsStep
                                survey={survey}
                                onChange={(s) => commit(s, translations, selectedId, "settings")}
                                onBack={() => goTo("questions")}
                                onNext={() => goTo("reward")}
                            />
                        ) : step === "reward" ? (
                            <RewardStep
                                survey={survey}
                                onChange={(s) => commit(s, translations, selectedId, "reward")}
                                programName={programName}
                                enabledRewardTypes={enabledRewardTypes}
                                eligibleParticipants={eligibleParticipants}
                                onBack={() => goTo("settings")}
                                onNext={() => goTo("schedule")}
                            />
                        ) : (
                            <ScheduleStep
                                survey={survey}
                                translations={translations}
                                onChange={(s) => commit(s, translations, selectedId, "schedule")}
                                programName={programName}
                                eligibleParticipants={eligibleParticipants}
                                unreviewedDrafts={[...aiDrafts].filter((k) => translations[k]?.trim()).length}
                                now={now}
                                onFix={(target) => (target === "french" ? goTo("questions", "translate") : goTo(target))}
                                onBack={() => goTo("reward")}
                                onPublish={(status) => {
                                    const published = { ...survey, status };
                                    commit(published);
                                    // Publishing isn't something Undo should reverse quietly.
                                    setHistory([]);
                                    onPublish?.(published, translations);
                                    setToast({
                                        id: Date.now(),
                                        message: status === "live" ? `${survey.title} is live.` : `${survey.title} is scheduled.`,
                                        undo: false,
                                    });
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            <AddQuestionPicker
                isOpen={picker.open}
                onOpenChange={(open) => setPicker((p) => ({ ...p, open }))}
                triggerRef={pickerAnchor}
                onPickType={addType}
                onPickBank={addFromBank}
            />

            {toast && (
                <Toast
                    id={toast.id}
                    message={toast.message}
                    action={toast.undo ? { label: "Undo", onPress: undo } : undefined}
                    onDismiss={() => setToast(null)}
                />
            )}

            <TypeChangeDialog
                pending={pendingType}
                onCancel={() => setPendingType(null)}
                onConfirm={() => {
                    if (pendingType) updateQuestion(pendingType.next);
                    setPendingType(null);
                }}
            />

            <PreviewOverlay isOpen={previewOpen} onClose={() => setPreviewOpen(false)} survey={survey} />
        </SurveyLocaleProvider>
    );
};

/** Intro or thank-you, as a simple read-only preview on the canvas. */
const ScreenPreview = ({ survey, which }: { survey: Survey; which: "intro" | "thankYou" }) => (
    <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-brand-secondary">{which === "intro" ? "Intro screen" : "Thank-you screen"}</p>
        <h2 className="text-display-xs font-semibold text-primary">{which === "intro" ? survey.intro.title : survey.thankYou.title}</h2>
        <p className="text-lg text-tertiary">{which === "intro" ? survey.intro.body : survey.thankYou.body}</p>
    </div>
);

const TypeChangeDialog = ({
    pending,
    onCancel,
    onConfirm,
}: {
    pending: { question: SurveyQuestionData; next: SurveyQuestionData; dropped: string[] } | null;
    onCancel: () => void;
    onConfirm: () => void;
}) => (
    <ModalOverlay isOpen={!!pending} onOpenChange={(open) => !open && onCancel()} isDismissable>
        <Modal className="max-w-md">
            <Dialog aria-label="Change question type" role="alertdialog">
                <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl">
                    <Heading slot="title" className="text-lg font-semibold text-primary">
                        Change question type?
                    </Heading>
                    <p className="text-sm text-tertiary">
                        The new type can't keep {pending?.dropped.join(" and ")}. The question text and Required setting stay. You can undo this.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button color="secondary" size="md" onClick={onCancel}>
                            Keep current type
                        </Button>
                        <Button color="primary-destructive" size="md" onClick={onConfirm}>
                            Change type
                        </Button>
                    </div>
                </div>
            </Dialog>
        </Modal>
    </ModalOverlay>
);

/** Preview: the real participant flow in a desktop or phone frame. Test answers are never saved or paid. */
const PreviewOverlay = ({ isOpen, onClose, survey }: { isOpen: boolean; onClose: () => void; survey: Survey }) => {
    const [frame, setFrame] = useState<"desktop" | "mobile">("mobile");
    const now = new Date();
    const testable: Survey = {
        ...survey,
        status: "live",
        opensAt: new Date(now.getTime() - 86_400_000).toISOString(),
        closesAt: new Date(now.getTime() + 86_400_000 * 14).toISOString(),
    };
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable className="p-0 sm:p-4">
            <Modal className="h-full max-w-none">
                <Dialog aria-label="Preview survey" className="h-full">
                    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-secondary_subtle shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-primary">Preview</span>
                                <Badge color="warning" size="sm">
                                    Test mode: answers aren't saved or paid
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <div role="group" aria-label="Preview size" className="flex rounded-lg bg-primary p-1 ring-1 ring-secondary ring-inset">
                                    {(["mobile", "desktop"] as const).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            aria-pressed={frame === f}
                                            onClick={() => setFrame(f)}
                                            className={cx(
                                                "cursor-pointer rounded-md px-3 py-1 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                                frame === f ? "bg-secondary text-primary" : "text-quaternary",
                                            )}
                                        >
                                            {f === "desktop" ? "Desktop" : "Mobile"}
                                        </button>
                                    ))}
                                </div>
                                <Button color="secondary" size="sm" onClick={onClose}>
                                    Close preview
                                </Button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 justify-center overflow-hidden p-4">
                            <div
                                className={cx(
                                    "h-full overflow-y-auto rounded-2xl bg-primary shadow-sm ring-1 ring-secondary [&_.min-h-dvh]:min-h-full",
                                    frame === "mobile" ? "w-[390px]" : "w-full max-w-6xl",
                                )}
                            >
                                <SurveyPlayer
                                    key={frame}
                                    survey={testable}
                                    response={{ surveyId: survey.id, status: "not_started", locale: survey.locale, answers: {}, history: [], isTest: true }}
                                    onSubmit={async () => ({ reward: survey.reward })}
                                    onExit={onClose}
                                    onNavigate={onClose}
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
