import { Image01, Lock01, LockUnlocked01, Trash01 } from "@untitledui/icons";
import { FileTrigger, Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { countAnswerable, estimateMinutes } from "../survey-logic";
import type { Survey, SurveyAnonymity, ThankYouDestination } from "../survey-types";
import { LANGUAGE_NAMES, otherLocale, secondLocaleOf, setSecondLocale } from "./builder-model";
import { ParticipantPreview } from "./participant-preview";
import { SelectField, SettingToggle, TextField } from "./settings-fields";
import { StepCard, StepLayout } from "./step-layout";

export interface SettingsStepProps {
    survey: Survey;
    onChange: (survey: Survey) => void;
    onBack: () => void;
    onNext: () => void;
}

const DESTINATIONS: { id: ThankYouDestination; label: string }[] = [
    { id: "rewards", label: "Rewards catalog" },
    { id: "dashboard", label: "Dashboard" },
    { id: "link", label: "A link" },
];

/** Step 2, Settings (A6): anonymity, intro screen, thank-you screen and the dashboard card, with a live participant preview. */
export const SettingsStep = ({ survey, onChange, onBack, onNext }: SettingsStepProps) => {
    const locked = (survey.responseCount ?? 0) > 0;
    const second = secondLocaleOf(survey);
    const { intro, thankYou, card } = survey;
    const setIntro = (patch: Partial<Survey["intro"]>) => onChange({ ...survey, intro: { ...intro, ...patch } });
    const setThanks = (patch: Partial<Survey["thankYou"]>) => onChange({ ...survey, thankYou: { ...thankYou, ...patch } });
    const setCard = (patch: Partial<Survey["card"]>) => onChange({ ...survey, card: { ...card, ...patch } });

    return (
        <StepLayout
            aside={<ParticipantPreview survey={survey} />}
            back={{ label: "Back: Questions", onPress: onBack }}
            next={{ label: "Next: Reward", onPress: onNext }}
        >
            <StepCard
                title="Responses"
                description={
                    locked ? "Locked because people have already responded. Duplicate the survey to change it." : "Can't be changed after the first response."
                }
            >
                <RadioGroup
                    aria-label="Responses"
                    value={survey.anonymity}
                    isDisabled={locked}
                    onChange={(v) => onChange({ ...survey, anonymity: v as SurveyAnonymity })}
                    className="grid gap-3 sm:grid-cols-2"
                >
                    {(
                        [
                            {
                                id: "anonymous",
                                title: "Anonymous",
                                body: "Results never show who answered. We only record who finished, to pay the reward.",
                                icon: Lock01,
                            },
                            { id: "identified", title: "Identified", body: "Results show who gave each answer, so you can follow up.", icon: LockUnlocked01 },
                        ] as const
                    ).map((o) => (
                        <Radio
                            key={o.id}
                            value={o.id}
                            className={({ isSelected, isFocusVisible, isDisabled }) =>
                                cx(
                                    "relative flex cursor-pointer gap-3 rounded-xl p-4 pr-10 ring-1 ring-secondary outline-hidden ring-inset",
                                    isSelected && "bg-brand-primary_alt ring-2 ring-brand",
                                    isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                                    isDisabled && "cursor-not-allowed opacity-60",
                                )
                            }
                        >
                            {({ isSelected, isFocusVisible }) => (
                                <>
                                    <FeaturedIcon icon={o.icon} color={isSelected ? "brand" : "gray"} theme="modern" size="sm" />
                                    <span className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-primary">{o.title}</span>
                                        <span className="text-sm text-tertiary">{o.body}</span>
                                    </span>
                                    <RadioButtonBase isSelected={isSelected} isFocusVisible={isFocusVisible} className="absolute top-4 right-4" />
                                </>
                            )}
                        </Radio>
                    ))}
                </RadioGroup>
            </StepCard>

            <StepCard
                title="Languages"

                description={`Written in ${LANGUAGE_NAMES[survey.locale]}. Participants see the language set on their profile.`}
            >
                <SettingToggle
                    label={`Also offer it in ${LANGUAGE_NAMES[otherLocale(survey.locale)]}`}

                    hint={
                        second
                            ? `Every string needs ${LANGUAGE_NAMES[second]} before you can publish. Use the ${second.toUpperCase()} switch at the top to translate.`
                            : `Off: ${LANGUAGE_NAMES[otherLocale(survey.locale)]}-speaking participants see the ${LANGUAGE_NAMES[survey.locale]} survey. Any translations you've written are kept.`
                    }

                    isSelected={!!second}

                    onChange={(on) => onChange(setSecondLocale(survey, on))}
                />
            </StepCard>

            <StepCard
                title="Intro screen"
                description={`Shows "About ${estimateMinutes(survey.questions)} min" and "${countAnswerable(survey.questions)} questions", worked out from your questions, plus the privacy line for your Responses setting.`}
            >
                <TextField label="Title" value={intro.title} onChange={(title) => setIntro({ title })} />
                <TextArea
                    label="Why we're asking"
                    rows={3}
                    value={intro.body}
                    onChange={(body) => setIntro({ body })}
                    hint="One or two sentences. Say what you'll do with the answers."
                />
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-secondary">Image (optional)</span>
                    {intro.imageSrc ? (
                        <div className="flex items-center gap-3">
                            <img src={intro.imageSrc} alt="" className="h-16 w-28 rounded-lg object-cover ring-1 ring-secondary" />
                            <Button color="secondary" size="sm" iconLeading={Trash01} onClick={() => setIntro({ imageSrc: undefined, imageAlt: undefined })}>
                                Remove
                            </Button>
                        </div>
                    ) : (
                        <FileTrigger
                            acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
                            onSelect={(files) => files?.[0] && setIntro({ imageSrc: URL.createObjectURL(files[0]), imageAlt: "" })}
                        >
                            <Button color="secondary" size="sm" iconLeading={Image01} className="self-start">
                                Add image
                            </Button>
                        </FileTrigger>
                    )}
                    {intro.imageSrc && (
                        <TextField
                            label="Image description"
                            placeholder="Leave empty if it's decorative"
                            value={intro.imageAlt}
                            onChange={(imageAlt) => setIntro({ imageAlt })}
                        />
                    )}
                </div>
            </StepCard>

            <StepCard title="Thank-you screen" description="Shown after submit, with the reward already added.">
                <TextField label="Title" value={thankYou.title} onChange={(title) => setThanks({ title })} />
                <TextArea label="Message" rows={2} value={thankYou.body} onChange={(body) => setThanks({ body })} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                        label="Button goes to"
                        value={thankYou.primaryAction.destination}
                        options={DESTINATIONS}
                        onChange={(destination) =>
                            setThanks({
                                primaryAction: {
                                    ...thankYou.primaryAction,
                                    destination,
                                    label:
                                        destination === "rewards"
                                            ? "Browse rewards"
                                            : destination === "dashboard"
                                              ? "Back to dashboard"
                                              : thankYou.primaryAction.label,
                                },
                            })
                        }
                    />
                    <TextField
                        label="Button label"
                        value={thankYou.primaryAction.label}
                        onChange={(label) => setThanks({ primaryAction: { ...thankYou.primaryAction, label } })}
                    />
                </div>
                {thankYou.primaryAction.destination === "link" && (
                    <TextField
                        label="Link"
                        placeholder="https://"
                        value={thankYou.primaryAction.href}
                        onChange={(href) => setThanks({ primaryAction: { ...thankYou.primaryAction, href } })}
                    />
                )}
                <SettingToggle
                    label="Also show “Back to dashboard”"
                    isSelected={!!thankYou.secondaryAction}
                    onChange={(on) => setThanks({ secondaryAction: on ? { label: "Back to dashboard", destination: "dashboard" } : undefined })}
                />
            </StepCard>

            <StepCard
                title="Dashboard card"
                description="The card on the participant dashboard that starts the survey."
                action={<SettingToggle label="Show card" isSelected={card.enabled} onChange={(enabled) => setCard({ enabled })} />}
            >
                {card.enabled && (
                    <>
                        <TextField label="Headline" value={card.headline} onChange={(headline) => setCard({ headline })} />
                        <TextField label="Text" value={card.body} onChange={(body) => setCard({ body })} />
                    </>
                )}
            </StepCard>
        </StepLayout>
    );
};
