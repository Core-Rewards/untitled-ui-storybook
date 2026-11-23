import { useEffect, useRef } from "react";
import { Equal, XClose } from "@untitledui/icons";
import { Radio, RadioGroup } from "react-aria-components";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { rewardIcons } from "../participant/reward-icons";
import { estimateMinutes } from "../survey-logic";
import type { Survey, SurveyReward, SurveyRewardType } from "../survey-types";
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

/**
 * Step 3, Reward (A7): turn the reward on, pick a type the program has enabled, set
 * the amount, and see the maximum cost if everyone completes. The dashboard card,
 * intro and invite email all pull the reward from here.
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
                title="Reward participants who complete this survey"
                description="Paid once per participant, the moment they submit. Partial responses are never rewarded. Test answers from Preview are never paid."
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

                        <div className="grid items-end gap-3 sm:grid-cols-[12rem_1fr]">
                            <NumberField
                                key={reward.type}
                                label={
                                    reward.type === "points"
                                        ? "Points per completion"
                                        : reward.type === "sweepstakes"
                                          ? "Entries per completion"
                                          : "Spins per completion"
                                }
                                min={0}
                                value={reward.amount}
                                onChange={(amount) => onChange({ ...survey, reward: { ...reward, amount: amount ?? 0 } })}
                            />
                            <p className="pb-2.5 text-sm text-tertiary">{suggestion(reward.type, minutes)}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-secondary px-5 py-4" aria-live="polite">
                            <Stat label="Eligible participants" value={fmt(eligibleParticipants)} />
                            <XClose className="size-4 text-fg-quaternary" aria-label="times" />
                            <Stat label="Per completion" value={fmt(reward.amount)} />
                            <Equal className="size-4 text-fg-quaternary" aria-label="equals" />
                            <Stat
                                label="Maximum cost if everyone completes"
                                value={`${fmt(reward.amount * eligibleParticipants)} ${TYPES[reward.type].unit}`}
                                strong
                            />
                        </div>
                        {reward.amount <= 0 && <p className="text-sm text-error-primary">Set an amount above 0, or switch the reward off.</p>}
                    </>
                )}
                {!reward && (
                    <p className="text-sm text-tertiary">No reward. Participants won't see a reward badge. Rewarded surveys usually get more responses.</p>
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
