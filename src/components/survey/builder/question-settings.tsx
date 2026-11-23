import { TextArea } from "@/components/base/textarea/textarea";
import { OptionsEditor } from "../questions/question-editor";
import { canBeScored } from "../quiz-logic";
import type { RatingIcon, SurveyKind, SurveyQuestion, SurveyQuestionType } from "../survey-types";
import { QUESTION_TYPES } from "./question-catalog";
import { FieldGroup, NumberField, SelectField, SettingToggle, TextField } from "./settings-fields";

export interface QuestionSettingsProps {
    question: SurveyQuestion;
    onChange: (question: SurveyQuestion) => void;
    /** The builder checks what a type change would drop and asks first. */
    onTypeChange: (type: SurveyQuestionType) => void;
    /** Quizzes add a Scoring group: score this question, the right answer and an explanation. */
    kind?: SurveyKind;
}

const FILE_TYPES = [
    { id: "images", label: "Images (JPG, PNG)", types: ["image/jpeg", "image/png"] },
    { id: "pdf", label: "PDF", types: ["application/pdf"] },
];

/** The Settings tab: type, required, description, scoring (quizzes) and the options for this type. */
export const QuestionSettings = ({ question: q, onChange, onTypeChange, kind = "survey" }: QuestionSettingsProps) => {
    const set = (patch: Partial<SurveyQuestion>) => onChange({ ...q, ...patch } as SurveyQuestion);

    return (
        <div className="flex flex-col gap-6">
            <FieldGroup>
                <SelectField
                    label="Question type"
                    value={q.type}
                    options={QUESTION_TYPES.map((t) => ({ id: t.type, label: t.label }))}
                    onChange={onTypeChange}
                />
                {q.type !== "statement" && <SettingToggle label="Required" isSelected={q.required} onChange={(required) => set({ required })} />}
                <SettingToggle
                    label="Description"
                    hint="Helper text under the question."
                    isSelected={q.description !== undefined}
                    onChange={(on) => set({ description: on ? "" : undefined })}
                />
            </FieldGroup>

            {kind === "quiz" && q.type !== "statement" && <ScoringSettings question={q} onChange={onChange} />}

            {q.type === "multiple_choice" && (
                <FieldGroup title="Answers">
                    <SettingToggle
                        label="Allow more than one answer"
                        hint={q.multiple ? "Uses a Next button." : "Moves on after a tap."}
                        isSelected={!!q.multiple}
                        // Pick one can only have one right answer, so switching it off keeps the first.
                        onChange={(multiple) =>
                            set({ multiple, minPicks: undefined, maxPicks: undefined, ...(!multiple && q.correct && { correct: q.correct.slice(0, 1) }) })
                        }
                    />
                    {q.multiple && (
                        <div className="grid grid-cols-2 gap-3">
                            <NumberField
                                key={`${q.id}-min`}
                                label="Min picks"
                                min={1}
                                placeholder="None"
                                value={q.minPicks}
                                onChange={(minPicks) => set({ minPicks })}
                            />
                            <NumberField
                                key={`${q.id}-max`}
                                label="Max picks"
                                min={1}
                                placeholder="None"
                                value={q.maxPicks}
                                onChange={(maxPicks) => set({ maxPicks })}
                            />
                        </div>
                    )}
                    <SettingToggle
                        label="Randomize order"
                        hint="Each participant sees a different order."
                        isSelected={!!q.randomize}
                        onChange={(randomize) => set({ randomize })}
                    />
                    <SettingToggle label={`Add "Other" with text`} isSelected={!!q.allowOther} onChange={(allowOther) => set({ allowOther })} />
                </FieldGroup>
            )}

            {q.type === "dropdown" && (
                <FieldGroup title="Answers">
                    <TextField label="Placeholder" placeholder="Search or choose" value={q.placeholder} onChange={(placeholder) => set({ placeholder })} />
                    <p className="text-sm text-tertiary">Paste a list into an option on the canvas to add many at once.</p>
                </FieldGroup>
            )}

            {q.type === "ranking" && (
                <FieldGroup title="Answers">
                    <SettingToggle label="Randomize starting order" isSelected={!!q.randomize} onChange={(randomize) => set({ randomize })} />
                </FieldGroup>
            )}

            {q.type === "yes_no" && (
                <FieldGroup title="Labels">
                    <div className="grid grid-cols-2 gap-3">
                        <TextField label="Yes label" placeholder="Yes" value={q.yesLabel} onChange={(yesLabel) => set({ yesLabel: yesLabel || undefined })} />
                        <TextField label="No label" placeholder="No" value={q.noLabel} onChange={(noLabel) => set({ noLabel: noLabel || undefined })} />
                    </div>
                </FieldGroup>
            )}

            {q.type === "rating" && (
                <FieldGroup title="Scale">
                    <div className="grid grid-cols-2 gap-3">
                        <SelectField
                            label="Steps"
                            value={q.scale ?? 5}
                            options={[3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ id: n, label: String(n) }))}
                            onChange={(scale) => set({ scale })}
                        />
                        <SelectField<RatingIcon>
                            label="Icon"
                            value={q.icon ?? "star"}
                            options={[
                                { id: "star", label: "Stars" },
                                { id: "heart", label: "Hearts" },
                                { id: "thumb", label: "Thumbs" },
                            ]}
                            onChange={(icon) => set({ icon })}
                        />
                    </div>
                </FieldGroup>
            )}

            {(q.type === "opinion_scale" || q.type === "nps") && (
                <FieldGroup title="Scale">
                    {q.type === "opinion_scale" ? (
                        <SelectField
                            label="Scale"
                            value={`${q.min}-${q.max}`}
                            options={[
                                { id: "1-5", label: "1 to 5" },
                                { id: "1-7", label: "1 to 7" },
                                { id: "0-10", label: "0 to 10" },
                            ]}
                            onChange={(v) => {
                                const [min, max] = v.split("-").map(Number) as [0 | 1, 5 | 7 | 10];
                                set({ min, max });
                            }}
                        />
                    ) : (
                        <p className="text-sm text-tertiary">NPS is always 0 to 10, so scores compare across surveys and programs.</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField label="Left label" value={q.minLabel} onChange={(minLabel) => set({ minLabel })} />
                        <TextField label="Right label" value={q.maxLabel} onChange={(maxLabel) => set({ maxLabel })} />
                    </div>
                </FieldGroup>
            )}

            {q.type === "matrix" && (
                <>
                    <FieldGroup title="Rows">
                        <OptionsEditor label="Rows" addLabel="Add row" showLetters={false} options={q.rows} onChange={(rows) => set({ rows })} />
                    </FieldGroup>
                    <FieldGroup title="Columns">
                        <OptionsEditor label="Columns" addLabel="Add column" showLetters={false} options={q.columns} onChange={(columns) => set({ columns })} />
                    </FieldGroup>
                </>
            )}

            {(q.type === "short_text" || q.type === "long_text") && (
                <FieldGroup title="Answer">
                    <NumberField
                        key={`${q.id}-len`}
                        label="Character limit"
                        min={1}
                        placeholder="No limit"
                        value={q.maxLength}
                        onChange={(maxLength) => set({ maxLength })}
                    />
                    <TextField
                        label="Placeholder"
                        placeholder="Type your answer here"
                        value={q.placeholder}
                        onChange={(placeholder) => set({ placeholder: placeholder || undefined })}
                    />
                </FieldGroup>
            )}

            {q.type === "number" && (
                <FieldGroup title="Answer">
                    <div className="grid grid-cols-2 gap-3">
                        <NumberField key={`${q.id}-min`} label="Min" placeholder="None" value={q.min} onChange={(min) => set({ min })} />
                        <NumberField key={`${q.id}-max`} label="Max" placeholder="None" value={q.max} onChange={(max) => set({ max })} />
                    </div>
                    <TextField label="Unit" placeholder="e.g. acres" value={q.unit} onChange={(unit) => set({ unit: unit || undefined })} />
                </FieldGroup>
            )}

            {q.type === "date" && (
                <FieldGroup title="Answer">
                    <TextField
                        label="Earliest date"
                        placeholder="YYYY-MM-DD"
                        value={q.minDate}
                        onChange={(minDate) => set({ minDate: minDate || undefined })}
                    />
                    <TextField label="Latest date" placeholder="YYYY-MM-DD" value={q.maxDate} onChange={(maxDate) => set({ maxDate: maxDate || undefined })} />
                </FieldGroup>
            )}

            {q.type === "file_upload" && (
                <FieldGroup title="Files">
                    {FILE_TYPES.map((ft) => {
                        const on = ft.types.every((t) => q.acceptedTypes?.includes(t));
                        return (
                            <SettingToggle
                                key={ft.id}
                                label={ft.label}
                                isSelected={on}
                                onChange={(v) => {
                                    const rest = (q.acceptedTypes ?? []).filter((t) => !ft.types.includes(t));
                                    set({ acceptedTypes: v ? [...rest, ...ft.types] : rest });
                                }}
                            />
                        );
                    })}
                    <div className="grid grid-cols-2 gap-3">
                        <NumberField key={`${q.id}-size`} label="Max size (MB)" min={1} value={q.maxSizeMb} onChange={(maxSizeMb) => set({ maxSizeMb })} />
                        <NumberField key={`${q.id}-files`} label="Max files" min={1} value={q.maxFiles} onChange={(maxFiles) => set({ maxFiles })} />
                    </div>
                </FieldGroup>
            )}

            {q.type === "statement" && (
                <FieldGroup title="Button">
                    <TextField label="Button label" placeholder="Continue" value={q.buttonLabel} onChange={(buttonLabel) => set({ buttonLabel })} />
                </FieldGroup>
            )}
        </div>
    );
};

/**
 * Quiz scoring for one question: whether it counts, its right answer (on the canvas
 * for options, here for Yes / No) and the explanation shown when answers are revealed.
 */
const ScoringSettings = ({ question: q, onChange }: { question: SurveyQuestion; onChange: (question: SurveyQuestion) => void }) => {
    if (!canBeScored(q)) {
        return (
            <FieldGroup title="Scoring">
                <p className="text-sm text-tertiary">
                    Collected, not scored. Only multiple choice, dropdown and yes / no questions can have a right answer.
                </p>
            </FieldGroup>
        );
    }
    const scored = q.correct !== undefined;
    return (
        <FieldGroup title="Scoring">
            <SettingToggle
                label="Score this question"
                hint={scored ? "Counts toward the score." : "Collected, not scored. Useful for a confidence or opinion question."}
                isSelected={scored}
                onChange={(on) => onChange({ ...q, correct: on ? [] : undefined } as SurveyQuestion)}
            />
            {scored && q.type === "yes_no" && (
                <SelectField<string>
                    label="Correct answer"
                    value={q.correct?.[0] ?? "none"}
                    options={[
                        ...(q.correct?.length ? [] : [{ id: "none", label: "Choose the correct answer" }]),
                        { id: "yes", label: q.yesLabel || "Yes" },
                        { id: "no", label: q.noLabel || "No" },
                    ]}
                    onChange={(v) => onChange({ ...q, correct: v === "none" ? [] : [v] })}
                />
            )}
            {scored && q.type !== "yes_no" && (
                <p className="text-sm text-tertiary">
                    {q.type === "multiple_choice" && q.multiple
                        ? "Mark every correct option on the canvas. Participants need all of them, and no others."
                        : "Mark the correct option on the canvas."}
                </p>
            )}
            {scored && (
                <TextArea
                    label="Explanation"
                    rows={3}
                    placeholder="Why this is the right answer"
                    hint="Shown when answers are revealed, whether they got it right or not."
                    value={q.explanation ?? ""}
                    onChange={(explanation) => onChange({ ...q, explanation: explanation || undefined })}
                />
            )}
        </FieldGroup>
    );
};
