import { Eye, EyeOff, Image01, Lock01, LockUnlocked01, Trash01, Zap } from "@untitledui/icons";
import { FileTrigger, Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { DEFAULT_QUIZ_SETTINGS, isQuiz, revealOf, scoredQuestions } from "../quiz-logic";
import { countAnswerable, estimateMinutes } from "../survey-logic";
import type { QuizAnswerReveal, QuizSettings, Survey, SurveyAnonymity, ThankYouDestination } from "../survey-types";
import { LANGUAGE_NAMES, otherLocale, secondLocaleOf, setSecondLocale } from "./builder-model";
import { ParticipantPreview } from "./participant-preview";
import { NumberField, SelectField, SettingToggle, TextField } from "./settings-fields";
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

const REVEAL_OPTIONS: { id: QuizAnswerReveal; title: string; body: string; icon: typeof Eye }[] = [
    { id: "at_end", title: "At the end", body: "On the results screen, after they submit. Back works as usual.", icon: Eye },
    {
        id: "each_question",
        title: "After each question",
        body: "They check each answer before moving on. Back is off, so an answer can't change once it's shown.",
        icon: Zap,
    },
    { id: "never", title: "Never, score only", body: "They see their score but not the answers. Use this if the same questions run again.", icon: EyeOff },
];

/**
 * Step 2, Settings (A6): anonymity, intro screen, thank-you screen and the dashboard card, with a live participant preview.
 * Quizzes add Scoring (pass mark and when answers are revealed) and are always identified.
 */
export const SettingsStep = ({ survey, onChange, onBack, onNext }: SettingsStepProps) => {
    const quiz = isQuiz(survey);
    const noun = quiz ? "quiz" : "survey";
    const locked = (survey.responseCount ?? 0) > 0;
    const quizSettings = survey.quiz ?? DEFAULT_QUIZ_SETTINGS;
    const setQuiz = (patch: Partial<QuizSettings>) => onChange({ ...survey, quiz: { ...quizSettings, ...patch } });
    const scored = scoredQuestions(survey).length;
    const needed = Math.ceil((quizSettings.passMark * scored) / 100);
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
                    quiz
                        ? "Quizzes are always identified: the score decides the reward, and results show who passed."
                        : locked
                          ? "Locked because people have already responded. Duplicate the survey to change it."
                          : "Can't be changed after the first response."
                }
            >
                <RadioGroup
                    aria-label="Responses"
                    value={quiz ? "identified" : survey.anonymity}
                    isDisabled={locked || quiz}
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

            {quiz && (
                <StepCard
                    title="Scoring"
                    description={
                        scored
                            ? `${scored} scored ${scored === 1 ? "question" : "questions"}. Questions without a right answer are collected but don't count.`
                            : "No scored questions yet. Turn on Score this question in the Questions step."
                    }
                >
                    <div className="grid items-end gap-3 sm:grid-cols-[12rem_1fr]">
                        <NumberField
                            label="Pass mark (%)"
                            min={0}
                            value={quizSettings.passMark}
                            onChange={(v) => setQuiz({ passMark: Math.min(100, v ?? 0) })}
                        />
                        <p className="pb-2.5 text-sm text-tertiary">
                            {scored ? `${needed} of ${scored} right to pass.` : "Percent of scored questions they need right."}
                        </p>
                    </div>
                    <RadioGroup
                        value={revealOf(quizSettings)}
                        onChange={(v) => setQuiz({ reveal: v as QuizAnswerReveal })}
                        className="flex flex-col gap-2"
                    >
                        <span className="text-sm font-medium text-secondary">Show the right answers</span>
                        <div className="grid gap-3 lg:grid-cols-3">
                            {REVEAL_OPTIONS.map((o) => (
                                <Radio
                                    key={o.id}
                                    value={o.id}
                                    className={({ isSelected, isFocusVisible }) =>
                                        cx(
                                            "relative flex cursor-pointer flex-col gap-2 rounded-xl p-4 pr-10 ring-1 ring-secondary outline-hidden ring-inset",
                                            isSelected && "bg-brand-primary_alt ring-2 ring-brand",
                                            isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
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
                        </div>
                    </RadioGroup>
                    <p className="text-sm text-tertiary">Quizzes can't be retaken. Explanations show wherever the answers do.</p>
                </StepCard>
            )}

            <StepCard
                title="Languages"

                description={`Written in ${LANGUAGE_NAMES[survey.locale]}. Participants see the language set on their profile.`}
            >
                <SettingToggle
                    label={`Also offer it in ${LANGUAGE_NAMES[otherLocale(survey.locale)]}`}

                    hint={
                        second
                            ? `Every string needs ${LANGUAGE_NAMES[second]} before you can publish. Use the ${second.toUpperCase()} switch at the top to translate.`
                            : `Off: ${LANGUAGE_NAMES[otherLocale(survey.locale)]}-speaking participants see the ${LANGUAGE_NAMES[survey.locale]} ${noun}. Any translations you've written are kept.`
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

            <StepCard
                title={quiz ? "Results screen" : "Thank-you screen"}
                description={
                    quiz ? "Shown after submit, under their score and the reward it earned." : "Shown after submit, with the reward already added."
                }
            >
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
                description={`The card on the participant dashboard that starts the ${noun}.`}
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
