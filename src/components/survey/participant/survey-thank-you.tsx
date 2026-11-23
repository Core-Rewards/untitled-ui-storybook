import { useEffect, useState } from "react";
import { Check } from "@untitledui/icons";
import { useCountUp } from "@/components/base/app-shell/use-count-up";
import { Button } from "@/components/base/buttons/button";
import { useSurveyCopy } from "../survey-context";
import type { SurveyReward, SurveyThankYou as SurveyThankYouSettings, ThankYouDestination } from "../survey-types";
import { rewardIcons } from "./reward-icons";
import { SurveyTakeover } from "./survey-takeover";

export interface SurveyThankYouProps {
    surveyTitle?: string;
    settings: SurveyThankYouSettings;
    /** The reward actually credited. Omit when the survey has none. */
    reward?: SurveyReward;
    onAction: (destination: ThankYouDestination, href?: string) => void;
}

/**
 * Thank-you with the reward already credited: a short check animation and the
 * amount counting up (both skipped for reduced motion). No new-balance line, per
 * the handoff.
 */
export const SurveyThankYou = ({ surveyTitle, settings, reward, onAction }: SurveyThankYouProps) => {
    const { copy, locale } = useSurveyCopy();
    // Start at 0 on the first frame, then count up to the amount.
    const [started, setStarted] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setStarted(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    const shown = useCountUp(started ? (reward?.amount ?? 0) : 0);

    const RewardIcon = reward ? rewardIcons[reward.type] : null;
    const { primaryAction, secondaryAction } = settings;

    const actions = (
        <div className="flex w-full flex-col items-stretch gap-3 @3xl/takeover:w-auto @3xl/takeover:flex-row @3xl/takeover:items-center">
            <Button size="xl" onClick={() => onAction(primaryAction.destination, primaryAction.href)}>
                {primaryAction.label}
            </Button>
            {secondaryAction && (
                <Button size="xl" color="tertiary" onClick={() => onAction(secondaryAction.destination, secondaryAction.href)}>
                    {secondaryAction.label}
                </Button>
            )}
        </div>
    );

    return (
        <SurveyTakeover surveyTitle={surveyTitle} progress={1} footer={actions}>
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 pt-12 text-center @3xl/takeover:flex-none @3xl/takeover:pt-0">
                <span className="flex size-24 items-center justify-center rounded-full bg-success-secondary animate-in duration-500 zoom-in-50 fade-in motion-reduce:animate-none">
                    <Check className="size-12 text-fg-success-primary" aria-hidden="true" />
                </span>

                <div className="flex flex-col gap-3">
                    <h1 className="text-display-sm font-semibold text-primary">{settings.title}</h1>
                    <p className="text-lg text-tertiary">{settings.body}</p>
                </div>

                {reward && RewardIcon && (
                    <div className="flex w-full flex-col items-center gap-1 rounded-2xl px-6 py-6 ring-1 ring-secondary ring-inset">
                        <p className="flex items-center gap-2 text-display-sm font-semibold text-success-primary">
                            <RewardIcon className="size-7" aria-hidden="true" />
                            {/* The live text says the final amount once; the count-up is visual only. */}
                            <span aria-hidden="true">{copy.rewardAdded({ ...reward, amount: shown })}</span>
                            <span className="sr-only">{copy.rewardAdded(reward)}</span>
                        </p>
                        <p className="text-md text-tertiary" lang={locale}>
                            {copy.rewardDestination(reward)}
                        </p>
                    </div>
                )}

                <div className="hidden pt-2 @3xl/takeover:block">{actions}</div>
            </div>
        </SurveyTakeover>
    );
};
