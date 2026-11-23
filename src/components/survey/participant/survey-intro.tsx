import { Lock01, LockUnlocked01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useShortcutKeys } from "../questions/question-keys";
import { useSurveyCopy } from "../survey-context";
import { countAnswerable, estimateMinutes } from "../survey-logic";
import type { Survey } from "../survey-types";
import { RewardBadge } from "./reward-badge";
import { SurveyTakeover } from "./survey-takeover";

export interface SurveyIntroProps {
    survey: Survey;
    onStart: () => void;
    onClose?: () => void;
    /** Enter starts the survey. On by default. */
    shortcuts?: boolean;
}

/** Intro screen: reward, title, why it matters, time and question count, privacy line, Start. */
export const SurveyIntro = ({ survey, onStart, onClose, shortcuts = true }: SurveyIntroProps) => {
    const { copy } = useSurveyCopy();
    const { intro, reward, anonymity, questions } = survey;
    const anonymous = anonymity === "anonymous";
    const PrivacyIcon = anonymous ? Lock01 : LockUnlocked01;

    useShortcutKeys(shortcuts, (key) => {
        if (key !== "Enter") return false;
        onStart();
        return true;
    });

    const chips = [copy.minutes(estimateMinutes(questions)), copy.questions(countAnswerable(questions)), copy.savesAsYouGo];

    return (
        <SurveyTakeover
            onExit={onClose}
            exitKind="close"
            footer={
                <Button size="xl" className="w-full" onClick={onStart}>
                    {copy.start}
                </Button>
            }
        >
            <div
                className={cx(
                    "mx-auto flex w-full max-w-6xl flex-col gap-6 @3xl/takeover:flex-row @3xl/takeover:items-center @3xl/takeover:gap-16",
                    !intro.imageSrc && "max-w-2xl",
                )}
            >
                {intro.imageSrc && (
                    <img
                        src={intro.imageSrc}
                        alt={intro.imageAlt ?? ""}
                        className="aspect-[16/9] w-full rounded-2xl object-cover @3xl/takeover:order-2 @3xl/takeover:aspect-[9/8] @3xl/takeover:w-[45%]"
                    />
                )}

                <div className="flex flex-1 flex-col items-start gap-5">
                    {reward && <RewardBadge reward={reward} />}
                    <div className="flex flex-col gap-3">
                        <h1 className="text-display-sm font-semibold text-primary @3xl/takeover:text-display-md">{intro.title}</h1>
                        <p className="text-lg text-tertiary">{intro.body}</p>
                    </div>

                    <ul className="flex flex-wrap gap-2">
                        {chips.map((chip) => (
                            <li key={chip} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary">
                                {chip}
                            </li>
                        ))}
                    </ul>

                    <div className="flex w-full gap-3 rounded-xl p-4 ring-1 ring-secondary ring-inset @3xl/takeover:p-0 @3xl/takeover:ring-0">
                        <PrivacyIcon className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        <p className="text-sm text-tertiary">
                            <strong className="font-semibold text-secondary">{anonymous ? copy.anonymousTitle : copy.identifiedTitle}</strong>{" "}
                            {anonymous ? copy.anonymousBody : copy.identifiedBody}
                        </p>
                    </div>

                    <div className="hidden items-center gap-4 pt-2 @3xl/takeover:flex">
                        <Button size="xl" onClick={onStart} className="px-8">
                            {copy.start}
                        </Button>
                        <span className="hidden text-sm text-tertiary pointer-fine:inline">{copy.orPressEnter}</span>
                    </div>
                </div>
            </div>
        </SurveyTakeover>
    );
};
