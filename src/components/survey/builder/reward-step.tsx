import { useEffect, useRef, useState } from "react";
import { Equal, Plus, Trash01, XClose } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { rewardIcons } from "../participant/reward-icons";
import { DEFAULT_QUIZ_SETTINGS, isQuiz, maxQuizReward, quizSetupProblems, sortedTiers } from "../quiz-logic";
import { estimateMinutes } from "../survey-logic";
import type { QuizRewardRule, QuizSettings, QuizTier, Survey, SurveyReward, SurveyRewardType } from "../survey-types";
import { ParticipantPreview } from "./participant-preview";
import { NumberField } from "./settings-fields";
import { StepCard, StepLayout } from "./step-layout";

export interface RewardStepProps {
    survey: Survey;
    onChange: (survey: Survey) => void;
    programName: string;
    /** Reward types Core has turned on for this program. */
    enabledRewardTypes: SurveyRewardType[];
    /** Everyone in the program (every participant gets every survey in v1). */
    eligibleParticipants: number;
    onBack: () => void;
    onNext: () => void;
}

const TYPES: Record<SurveyRewardType, { title: string; body: string; unit: string; defaultAmount: number }> = {
    points: { title: "Points", body: "Added to their balance", unit: "points", defaultAmount: 500 },
    sweepstakes: { title: "Sweepstakes entry", body: "Into a drawing you choose", unit: "entries", defaultAmount: 1 },
    arcade_spins: { title: "Arcade spins", body: "Plays in the Rewards Arcade", unit: "spins", defaultAmount: 2 },
};

/** A rough guide by survey length, shown next to the amount. */
const suggestion = (type: SurveyRewardType, minutes: number) =>
    type === "points"
        ? `Suggested: ${minutes <= 2 ? "250 to 500" : "500 to 1,000"} for a ${minutes}-minute survey`
        : type === "sweepstakes"
          ? "Most programs give 1 entry"
          : "1 to 3 spins is typical";

const RULES: { id: QuizRewardRule; title: string; body: (passMark: number) => string }[] = [
    { id: "completion", title: "On completion", body: () => "Everyone who finishes, whatever their score." },
    { id: "pass", title: "On passing", body: (m) => `Only people who score ${m}% or more.` },
    { id: "tiered", title: "Tiered by score", body: () => "More for higher scores. Below the lowest tier earns nothing." },
];

/**
 * Step 3, Reward (A7): turn the reward on, pick a type the program has enabled, set
 * the amount, and see the maximum cost if everyone completes. The dashboard card,
 * intro and invite email all pull the reward from here. Quizzes also choose when the
 * reward is paid: on completion, on passing, or in tiers by score.
 */
export const RewardStep = ({ survey, onChange, programName, enabledRewardTypes, eligibleParticipants, onBack, onNext }: RewardStepProps) => {
    // Remember the last reward while it's switched off, so turning it back on restores it.
    const lastReward = useRef<SurveyReward>(
        survey.reward ?? { type: enabledRewardTypes[0] ?? "points", amount: TYPES[enabledRewardTypes[0] ?? "points"].defaultAmount },
    );
    useEffect(() => {
        if (survey.reward) lastReward.current = survey.reward;
    }, [survey.reward]);
    const reward = survey.reward;
    const minutes = estimateMinutes(survey.questions);
    const fmt = (n: number) => n.toLocaleString("en-US");
    const quiz = isQuiz(survey);
    const quizSettings = survey.quiz ?? DEFAULT_QUIZ_SETTINGS;
    const rule = quiz ? quizSettings.rewardRule : "completion";
    const tiered = quiz && rule === "tiered";
    const tierProblem = quiz ? quizSetupProblems(survey).tierProblem : undefined;
    const perPerson = quiz ? maxQuizReward(survey) : (reward?.amount ?? 0);

    /** Quiz settings change; tiered rewards keep `reward.amount` at the top tier so "Earn up to" stays right. */
    const setQuiz = (patch: Partial<QuizSettings>) => {
        const next = { ...quizSettings, ...patch };
        const top = next.rewardRule === "tiered" ? Math.max(0, ...(next.tiers ?? []).map((t) => t.amount)) : undefined;
        onChange({ ...survey, quiz: next, reward: reward && top !== undefined ? { ...reward, amount: top } : reward });
    };
    const setRule = (rewardRule: QuizRewardRule) => {
        if (rewardRule !== "tiered" || quizSettings.tiers?.length || !reward) return setQuiz({ rewardRule });
        // Start tiered with two sensible tiers: everything right, and the pass mark.
        const tiers: QuizTier[] = [{ minScore: 100, amount: reward.amount }];
        if (quizSettings.passMark < 100) tiers.push({ minScore: quizSettings.passMark, amount: Math.max(1, Math.round(reward.amount / 2)) });
        setQuiz({ rewardRule, tiers });
    };

    return (
        <StepLayout
            aside={
                <div className="flex flex-col gap-3">
                    <ParticipantPreview survey={survey} screens={["card", "intro"]} />
                    <p className="text-xs text-tertiary">The dashboard card, intro screen and invite email all pull the reward from this step.</p>
                </div>
            }
            back={{ label: "Back: Settings", onPress: onBack }}
            next={{ label: "Next: Schedule and publish", onPress: onNext }}
        >
            <StepCard
                title={quiz ? "Reward participants for this quiz" : "Reward participants who complete this survey"}
                description={
                    quiz
                        ? "Paid once per participant, the moment they submit, based on their score. Quizzes can't be retaken. Test answers from Preview are never paid."
                        : "Paid once per participant, the moment they submit. Partial responses are never rewarded. Test answers from Preview are never paid."
                }
                action={
                    <Toggle
                        aria-label="Reward participants"
                        size="md"
                        isSelected={!!reward}
                        onChange={(on) => onChange({ ...survey, reward: on ? lastReward.current : undefined })}
                    />
                }
            >
                {reward && (
                    <>
                        <RadioGroup
                            value={reward.type}
                            onChange={(t) => {
                                const type = t as SurveyRewardType;
                                onChange({ ...survey, reward: { type, amount: TYPES[type].defaultAmount } });
                            }}
                            className="flex flex-col gap-2"
                        >
                            <span className="text-sm font-medium text-secondary">Reward type (enabled for {programName})</span>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {(Object.keys(TYPES) as SurveyRewardType[]).map((t) => {
                                    const enabled = enabledRewardTypes.includes(t);
                                    const Icon = rewardIcons[t];
                                    return (
                                        <Radio
                                            key={t}
                                            value={t}
                                            isDisabled={!enabled}
                                            className={({ isSelected, isFocusVisible, isDisabled }) =>
                                                cx(
                                                    "relative flex cursor-pointer flex-col gap-1 rounded-xl p-4 pl-11 ring-1 ring-secondary outline-hidden ring-inset",
                                                    isSelected && "bg-brand-primary_alt ring-2 ring-brand",
                                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                                    isDisabled && "cursor-not-allowed bg-secondary_subtle",
                                                )
                                            }
                                        >
                                            {({ isSelected, isFocusVisible }) => (
                                                <>
                                                    <RadioButtonBase
                                                        isSelected={isSelected}
                                                        isFocusVisible={isFocusVisible}
                                                        isDisabled={!enabled}
                                                        className="absolute top-4 left-4"
                                                    />
                                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                                        <Icon className="size-4 text-fg-quaternary" aria-hidden="true" />
                                                        {TYPES[t].title}
                                                    </span>
                                                    <span className="text-sm text-tertiary">{enabled ? TYPES[t].body : "Not enabled for this program"}</span>
                                                </>
                                            )}
                                        </Radio>
                                    );
                                })}
                            </div>
                        </RadioGroup>

                        {quiz && (
                            <RadioGroup value={rule} onChange={(v) => setRule(v as QuizRewardRule)} className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-secondary">When they earn it</span>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {RULES.map((r) => (
                                        <Radio
                                            key={r.id}
                                            value={r.id}
                                            className={({ isSelected, isFocusVisible }) =>
                                                cx(
                                                    "relative flex cursor-pointer flex-col gap-1 rounded-xl p-4 pl-11 ring-1 ring-secondary outline-hidden ring-inset",
                                                    isSelected && "bg-brand-primary_alt ring-2 ring-brand",
                                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                                )
                                            }
                                        >
                                            {({ isSelected, isFocusVisible }) => (
                                                <>
                                                    <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} className="absolute top-4 left-4" />
                                                    <span className="text-sm font-semibold text-primary">{r.title}</span>
                                                    <span className="text-sm text-tertiary">{r.body(quizSettings.passMark)}</span>
                                                </>
                                            )}
                                        </Radio>
                                    ))}
                                </div>
                            </RadioGroup>
                        )}

                        {tiered ? (
                            <TierEditor unit={TYPES[reward.type].unit} tiers={quizSettings.tiers ?? []} onChange={(tiers) => setQuiz({ tiers })} />
                        ) : (
                            <div className="grid items-end gap-3 sm:grid-cols-[12rem_1fr]">
                                <NumberField
                                    key={reward.type}
                                    label={`${reward.type === "points" ? "Points" : reward.type === "sweepstakes" ? "Entries" : "Spins"} ${
                                        quiz && rule === "pass" ? "for passing" : "per completion"
                                    }`}
                                    min={0}
                                    value={reward.amount}
                                    onChange={(amount) => onChange({ ...survey, reward: { ...reward, amount: amount ?? 0 } })}
                                />
                                <p className="pb-2.5 text-sm text-tertiary">{suggestion(reward.type, minutes)}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-secondary px-5 py-4" aria-live="polite">
                            <Stat label="Eligible participants" value={fmt(eligibleParticipants)} />
                            <XClose className="size-4 text-fg-quaternary" aria-label="times" />
                            <Stat label={tiered ? "Top tier" : quiz && rule === "pass" ? "Per pass" : "Per completion"} value={fmt(perPerson)} />
                            <Equal className="size-4 text-fg-quaternary" aria-label="equals" />
                            <Stat
                                label={
                                    tiered
                                        ? "Maximum cost if everyone scores 100%"
                                        : quiz && rule === "pass"
                                          ? "Maximum cost if everyone passes"
                                          : "Maximum cost if everyone completes"
                                }
                                value={`${fmt(perPerson * eligibleParticipants)} ${TYPES[reward.type].unit}`}
                                strong
                            />
                        </div>
                        {tierProblem ? (
                            <p className="text-sm text-error-primary">{tierProblem}</p>
                        ) : (
                            !tiered && reward.amount <= 0 && <p className="text-sm text-error-primary">Set an amount above 0, or switch the reward off.</p>
                        )}
                    </>
                )}
                {!reward && (
                    <p className="text-sm text-tertiary">
                        No reward. Participants won't see a reward badge. Rewarded {quiz ? "quizzes" : "surveys"} usually get more responses.
                    </p>
                )}
            </StepCard>
        </StepLayout>
    );
};

const Stat = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-xs text-tertiary">{label}</span>
        <span className={cx("text-xl font-semibold", strong ? "text-primary" : "text-secondary")}>{value}</span>
    </div>
);

/**
 * Reward tiers for a tiered quiz: a minimum score and what it pays, one row each.
 * Rows sort best first once focus leaves the editor, so they don't jump while typing.
 */
const TierEditor = ({ tiers, unit, onChange }: { tiers: QuizTier[]; unit: string; onChange: (tiers: QuizTier[]) => void }) => {
    // Bumped after sorting so the number fields pick up their new values.
    const [version, setVersion] = useState(0);
    const sortIfNeeded = () => {
        const sorted = sortedTiers({ ...DEFAULT_QUIZ_SETTINGS, tiers });
        if (sorted.some((t, i) => t !== tiers[i])) {
            onChange(sorted);
            setVersion((v) => v + 1);
        }
    };
    const update = (i: number, patch: Partial<QuizTier>) => onChange(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)));

    return (
        <div
            role="group"
            aria-label="Reward tiers"
            className="flex flex-col gap-3"
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) sortIfNeeded();
            }}
        >
            <span className="text-sm font-medium text-secondary">Tiers</span>
            {tiers.map((t, i) => (
                <div key={`${version}-${i}`} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <NumberField label="Score at least (%)" min={0} value={t.minScore} onChange={(v) => update(i, { minScore: Math.min(100, v ?? 0) })} />
                    <NumberField label={`Earns (${unit})`} min={0} value={t.amount} onChange={(v) => update(i, { amount: v ?? 0 })} />
                    <Button
                        color="tertiary"
                        size="sm"
                        iconLeading={Trash01}
                        aria-label={`Remove tier ${i + 1}`}
                        isDisabled={tiers.length <= 1}
                        onClick={() => {
                            onChange(tiers.filter((_, j) => j !== i));
                            setVersion((v) => v + 1);
                        }}
                        className="mb-0.5"
                    />
                </div>
            ))}
            <Button
                color="link-color"
                size="sm"
                iconLeading={Plus}
                className="self-start"
                onClick={() => {
                    const lowest = Math.min(100, ...tiers.map((x) => x.minScore));
                    onChange([...tiers, { minScore: Math.max(0, lowest - 10), amount: Math.max(1, Math.round(Math.min(...tiers.map((x) => x.amount), 100) / 2)) }]);
                }}
            >
                Add tier
            </Button>
            <p className="text-sm text-tertiary">Each person gets the highest tier their score reaches.</p>
        </div>
    );
};
