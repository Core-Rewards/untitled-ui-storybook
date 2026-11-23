import { useState } from "react";
import { cx } from "@/utils/cx";
import { SurveyDashboardCard } from "../participant/survey-dashboard-card";
import { SurveyIntro } from "../participant/survey-intro";
import { SurveyThankYou } from "../participant/survey-thank-you";
import type { Survey } from "../survey-types";
import { asLivePreview } from "./builder-model";

export type PreviewScreen = "card" | "intro" | "thankYou";

const LABELS: Record<PreviewScreen, string> = { card: "Dashboard card", intro: "Intro", thankYou: "Thank-you" };

/**
 * "What participants see": the real participant components in a phone-sized frame,
 * so settings and reward changes show exactly as participants get them.
 */
export const ParticipantPreview = ({
    survey,
    screens = ["card", "intro", "thankYou"],
    defaultScreen,
}: {
    survey: Survey;
    screens?: PreviewScreen[];
    defaultScreen?: PreviewScreen;
}) => {
    const [screen, setScreen] = useState<PreviewScreen>(defaultScreen ?? screens[0]);
    const live = asLivePreview(survey);

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-secondary">What participants see</p>
            {screens.length > 1 && (
                <div role="group" aria-label="Preview screen" className="flex self-start rounded-lg bg-primary p-1 ring-1 ring-secondary ring-inset">
                    {screens.map((s) => (
                        <button
                            key={s}
                            type="button"
                            aria-pressed={screen === s}
                            onClick={() => setScreen(s)}
                            className={cx(
                                "cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold outline-focus-ring focus-visible:outline-2",
                                screen === s ? "bg-secondary text-primary shadow-xs" : "text-quaternary hover:text-tertiary",
                            )}
                        >
                            {LABELS[s]}
                        </button>
                    ))}
                </div>
            )}
            <div inert className="pointer-events-none select-none">
                {screen === "card" ? (
                    <div className="max-w-sm">
                        <SurveyDashboardCard survey={live} onOpen={() => {}} />
                    </div>
                ) : (
                    <div className="h-[34rem] w-[20rem] overflow-hidden rounded-2xl bg-primary shadow-sm ring-1 ring-secondary [&_.min-h-dvh]:min-h-full [&_.sticky]:static">
                        <div className="h-full overflow-y-auto">
                            {screen === "intro" ? (
                                <SurveyIntro survey={live} onStart={() => {}} shortcuts={false} />
                            ) : (
                                <SurveyThankYou surveyTitle={live.title} settings={live.thankYou} reward={live.reward} onAction={() => {}} />
                            )}
                        </div>
                    </div>
                )}
            </div>
            {!survey.card.enabled && screen === "card" && (
                <p className="text-xs text-tertiary">The dashboard card is off, so participants only find this survey from the invite email.</p>
            )}
        </div>
    );
};
