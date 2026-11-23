import { AlertTriangle, CheckCircle, Plus, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import type { LogicCondition, LogicOperator, LogicRule, LogicTarget, Survey, SurveyQuestion } from "../survey-types";
import { analyzeLogic, defaultTargetOf } from "./logic-analysis";
import { NumberField, SelectField } from "./settings-fields";

export interface LogicPanelProps {
    survey: Survey;
    question: SurveyQuestion;
    onChange: (question: SurveyQuestion) => void;
}

type ValueOption = { id: string | number; label: string };

/** The answers a rule can compare against for this question type, with labels for the chips. */
const valueOptionsFor = (q: SurveyQuestion): ValueOption[] => {
    switch (q.type) {
        case "multiple_choice":
        case "dropdown":
            return q.options.map((o, i) => ({ id: o.id, label: o.label || `Option ${i + 1}` }));
        case "yes_no":
            return [
                { id: "yes", label: q.yesLabel ?? "Yes" },
                { id: "no", label: q.noLabel ?? "No" },
            ];
        case "opinion_scale":
            return Array.from({ length: q.max - q.min + 1 }, (_, i) => {
                const n = q.min + i;
                const end = n === q.min ? q.minLabel : n === q.max ? q.maxLabel : undefined;
                return { id: n, label: end ? `${n} · ${end}` : String(n) };
            });
        case "nps":
            return Array.from({ length: 11 }, (_, n) => ({ id: n, label: String(n) }));
        case "rating":
            return Array.from({ length: q.scale ?? 5 }, (_, i) => ({ id: i + 1, label: String(i + 1) }));
        default:
            return [];
    }
};

const operatorsFor = (q: SurveyQuestion): { id: LogicOperator; label: string }[] => {
    const choice = [
        { id: "is_any_of" as const, label: "is any of" },
        { id: "is_none_of" as const, label: "is none of" },
    ];
    const presence = [
        { id: "answered" as const, label: "is answered" },
        { id: "not_answered" as const, label: "is skipped" },
    ];
    if (["multiple_choice", "dropdown", "yes_no", "opinion_scale", "nps", "rating"].includes(q.type)) return [...choice, ...(q.required ? [] : presence)];
    if (q.type === "number") return [{ id: "lt", label: "is less than" }, { id: "gt", label: "is more than" }, ...presence];
    return presence;
};

/**
 * The Logic tab, in plain sentences: "If answer is any of [1, 2] → go to [Q2]", plus
 * "All other answers go to". Below, a live check that every question can be reached
 * and that nothing loops back.
 */
export const LogicPanel = ({ survey, question: q, onChange }: LogicPanelProps) => {
    const index = survey.questions.findIndex((x) => x.id === q.id);
    const n = `Q${index + 1}`;
    const rules = q.logic ?? [];
    const operators = operatorsFor(q);
    const values = valueOptionsFor(q);
    const later = survey.questions.slice(index + 1);
    const targets: { id: LogicTarget; label: string }[] = [
        ...later.map((t) => ({ id: t.id, label: `Q${survey.questions.indexOf(t) + 1} · ${t.title || "Untitled question"}` })),
        { id: "end", label: "End of survey" },
    ];
    const report = analyzeLogic(survey);
    const qNumber = (id: string) => `Q${survey.questions.findIndex((x) => x.id === id) + 1}`;

    const setRules = (logic: LogicRule[]) => onChange({ ...q, logic: logic.length ? logic : undefined });
    const setRule = (i: number, rule: LogicRule) => setRules(rules.map((r, j) => (j === i ? rule : r)));
    const addRule = () => {
        const op = operators[0]?.id ?? "answered";
        setRules([
            ...rules,
            { when: { questionId: q.id, operator: op, values: op === "is_any_of" || op === "is_none_of" ? [] : undefined }, goTo: targets[0].id },
        ]);
    };

    if (q.type === "statement") {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm text-tertiary">Statements have no answer, so they always go to the same place.</p>
                <DefaultTarget question={q} survey={survey} targets={targets} onChange={onChange} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-tertiary">Send people to a different question based on their answer to {n}.</p>

            {rules.map((rule, i) => (
                <RuleCard
                    key={i}
                    index={i}
                    rule={rule}
                    operators={operators}
                    values={values}
                    targets={targets}
                    onChange={(r) => setRule(i, r)}
                    onRemove={() => setRules(rules.filter((_, j) => j !== i))}
                />
            ))}

            <Button color="secondary" size="sm" iconLeading={Plus} onClick={addRule} className="border-dashed">
                Add rule
            </Button>

            <hr className="border-secondary" />

            <DefaultTarget question={q} survey={survey} targets={targets} onChange={onChange} label="All other answers go to" />

            <div
                role="status"
                className={cx(
                    "flex gap-3 rounded-xl p-3 text-sm",
                    report.unreachable.length || report.loops.length ? "bg-warning-primary text-warning-primary" : "bg-secondary text-secondary",
                )}
            >
                {report.unreachable.length || report.loops.length ? (
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" aria-hidden="true" />
                ) : (
                    <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden="true" />
                )}
                <div className="flex flex-col gap-1">
                    {report.unreachable.length === 0 && report.loops.length === 0 && (
                        <p>
                            Every question can be reached.{" "}
                            {report.shortest === report.longest
                                ? `Everyone answers ${report.shortest} questions.`
                                : `People answer between ${report.shortest} and ${report.longest} questions, depending on their answers.`}
                        </p>
                    )}
                    {report.unreachable.map((id) => (
                        <p key={id}>{qNumber(id)} can't be reached. Point a rule or default at it, or delete it.</p>
                    ))}
                    {report.loops.map((l, i) => (
                        <p key={i}>
                            {qNumber(l.from)} sends people back to {qNumber(l.to)}, which makes a loop.
                        </p>
                    ))}
                </div>
            </div>

            <p className="text-xs text-tertiary">
                Rules can also end the survey early. Loops and unreachable questions are flagged here and on the review checklist before publish.
            </p>
        </div>
    );
};

const DefaultTarget = ({
    question,
    survey,
    targets,
    onChange,
    label = "Then go to",
}: {
    question: SurveyQuestion;
    survey: Survey;
    targets: { id: LogicTarget; label: string }[];
    onChange: (q: SurveyQuestion) => void;
    label?: string;
}) => (
    <SelectField
        label={label}
        value={defaultTargetOf(survey, question)}
        options={targets}
        onChange={(t) => {
            // Store nothing when it's simply the next question, so reordering keeps working.
            const next = survey.questions[survey.questions.indexOf(question) + 1]?.id ?? "end";
            onChange({ ...question, defaultTarget: t === next ? undefined : t });
        }}
    />
);

const RuleCard = ({
    index,
    rule,
    operators,
    values,
    targets,
    onChange,
    onRemove,
}: {
    index: number;
    rule: LogicRule;
    operators: { id: LogicOperator; label: string }[];
    values: ValueOption[];
    targets: { id: LogicTarget; label: string }[];
    onChange: (r: LogicRule) => void;
    onRemove: () => void;
}) => {
    const c = rule.when;
    const setWhen = (patch: Partial<LogicCondition>) => onChange({ ...rule, when: { ...c, ...patch } });
    const isList = c.operator === "is_any_of" || c.operator === "is_none_of";
    const chosen = c.values ?? [];
    const remaining = values.filter((v) => !chosen.includes(v.id));
    const labelOf = (id: string | number) => values.find((v) => v.id === id)?.label ?? String(id);

    return (
        <section aria-label={`Rule ${index + 1}`} className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-secondary ring-inset">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Rule {index + 1}</p>
                <button
                    type="button"
                    aria-label={`Remove rule ${index + 1}`}
                    onClick={onRemove}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
                >
                    <XClose className="size-4" />
                </button>
            </div>

            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3">
                <span className="text-sm font-semibold text-secondary">If answer</span>
                <SelectField
                    hideLabel
                    label="Condition"
                    value={c.operator}
                    options={operators}
                    onChange={(operator) =>
                        setWhen({
                            operator,
                            values: operator === "is_any_of" || operator === "is_none_of" ? chosen : undefined,
                            value: operator === "lt" || operator === "gt" ? (c.value ?? 0) : undefined,
                        })
                    }
                />

                {isList && (
                    <div className="col-start-2 flex flex-wrap gap-2">
                        {chosen.map((v) => (
                            <span
                                key={String(v)}
                                className="flex items-center gap-1 rounded-full bg-brand-primary_alt py-1 pr-1 pl-2.5 text-sm font-medium text-brand-secondary ring-1 ring-brand ring-inset"
                            >
                                {labelOf(v)}
                                <button
                                    type="button"
                                    aria-label={`Remove ${labelOf(v)}`}
                                    onClick={() => setWhen({ values: chosen.filter((x) => x !== v) })}
                                    className="flex size-5 cursor-pointer items-center justify-center rounded-full outline-focus-ring hover:bg-brand-secondary focus-visible:outline-2"
                                >
                                    <XClose className="size-3" />
                                </button>
                            </span>
                        ))}
                        {remaining.length > 0 && (
                            <Dropdown.Root>
                                <Button color="secondary" size="sm" iconLeading={Plus} className="rounded-full">
                                    value
                                </Button>
                                <Dropdown.Popover className="max-h-72 w-56">
                                    <Dropdown.Menu onAction={(key) => setWhen({ values: [...chosen, values.find((v) => String(v.id) === String(key))!.id] })}>
                                        {remaining.map((v) => (
                                            <Dropdown.Item key={String(v.id)} id={String(v.id)} label={v.label} />
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown.Root>
                        )}
                        {chosen.length === 0 && <span className="w-full text-xs text-warning-primary">Add at least one value.</span>}
                    </div>
                )}

                {(c.operator === "lt" || c.operator === "gt") && (
                    <div className="col-start-2">
                        <NumberField
                            label="Value"
                            value={typeof c.value === "number" ? c.value : undefined}
                            onChange={(value) => setWhen({ value: value ?? 0 })}
                        />
                    </div>
                )}

                <span className="text-sm font-semibold text-secondary">Go to</span>
                <SelectField hideLabel label="Go to" value={rule.goTo} options={targets} onChange={(goTo) => onChange({ ...rule, goTo })} />
            </div>
        </section>
    );
};
