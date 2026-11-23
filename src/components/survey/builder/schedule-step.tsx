import { useState } from "react";
import { Time, parseAbsolute, toCalendarDate, toCalendarDateTime, toZoned } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, Send01 } from "@untitledui/icons";
import { Heading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { DatePicker } from "@/components/base/date-picker/date-picker";
import { cx } from "@/utils/cx";
import { isQuiz, maxQuizReward } from "../quiz-logic";
import type { Survey } from "../survey-types";
import { LANGUAGE_NAMES, secondLocaleOf } from "./builder-model";
import type { Translations } from "./builder-model";
import { buildChecklist, canPublish } from "./publish-checklist";
import type { ChecklistTarget } from "./publish-checklist";
import { SelectField, SettingToggle } from "./settings-fields";
import { StepCard, StepLayout } from "./step-layout";

export interface ScheduleStepProps {
    survey: Survey;
    translations: Translations;
    onChange: (survey: Survey) => void;
    programName: string;
    eligibleParticipants: number;
    /** AI-drafted French strings not yet reviewed (a warning, not a blocker). */
    unreviewedDrafts?: number;
    /** Open the step (or French view) that fixes a checklist item. */
    onFix: (target: ChecklistTarget) => void;
    onBack: () => void;
    /** Publish now, or schedule when the open date is in the future. */
    onPublish: (status: "live" | "scheduled") => void;
    /** Defaults to now. Set in stories so dates never drift. */
    now?: Date;
}

const TIMEZONES = [
    { id: "America/Toronto", label: "Eastern (Toronto, New York)" },
    { id: "America/Winnipeg", label: "Central (Winnipeg, Chicago)" },
    { id: "America/Edmonton", label: "Mountain (Edmonton, Denver)" },
    { id: "America/Vancouver", label: "Pacific (Vancouver, Los Angeles)" },
    { id: "America/Halifax", label: "Atlantic (Halifax)" },
];

const TIMES = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 ? 30 : 0;
    const label = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2026, 0, 1, h, m));
    return { id: `${String(h).padStart(2, "0")}:${m ? "30" : "00"}`, label };
});

/** Split an ISO date-time into a calendar date and "HH:mm" in the survey's timezone. */
const split = (iso: string, tz: string) => {
    try {
        const z = parseAbsolute(iso, tz);
        const time = `${String(z.hour).padStart(2, "0")}:${z.minute < 30 ? "00" : "30"}`;
        return { date: toCalendarDate(z), time };
    } catch {
        return { date: null, time: "09:00" };
    }
};

const join = (date: CalendarDate, time: string, tz: string) => {
    const [h, m] = time.split(":").map(Number);
    return toZoned(toCalendarDateTime(date, new Time(h, m)), tz).toAbsoluteString();
};

const fmtDay = (iso: string, tz: string) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz }).format(new Date(iso));

/**
 * Step 4, Schedule and publish (A8): open and close dates in the program's timezone,
 * the invite and reminder emails, and a review checklist whose problems link to the
 * step that fixes them. Publish (or Schedule, for a future open date) confirms what
 * happens next.
 */
export const ScheduleStep = ({
    survey,
    translations,
    onChange,
    programName,
    eligibleParticipants,
    unreviewedDrafts = 0,
    onFix,
    onBack,
    onPublish,
    now = new Date(),
}: ScheduleStepProps) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const tz = survey.timezone;
    const opens = split(survey.opensAt, tz);
    const closes = split(survey.closesAt, tz);
    const emails = survey.emails ?? { inviteAtOpen: true, reminder: false, reminderDaysBeforeClose: 3 };
    const setEmails = (patch: Partial<typeof emails>) => onChange({ ...survey, emails: { ...emails, ...patch } });

    const checklist = buildChecklist(survey, translations, eligibleParticipants, now, unreviewedDrafts);
    const quiz = isQuiz(survey);
    const noun = quiz ? "quiz" : "survey";
    const unitOf = (type: NonNullable<Survey["reward"]>["type"]) => (type === "points" ? "points" : type === "sweepstakes" ? "sweepstakes entries" : "arcade spins");
    const inviteSubject = !survey.reward
        ? quiz
            ? `${survey.title}: test what you know`
            : `${survey.title}: 2 minutes of feedback`
        : quiz
          ? `${survey.quiz?.rewardRule === "pass" ? "Pass to earn" : survey.quiz?.rewardRule === "tiered" ? "Earn up to" : "Earn"} ${maxQuizReward(survey).toLocaleString("en-US")} ${unitOf(survey.reward.type)}: ${survey.title}`
          : `Earn ${survey.reward.amount.toLocaleString("en-US")} ${unitOf(survey.reward.type)} for 2 minutes of feedback`;
    const ready = canPublish(checklist);
    const blocking = checklist.filter((i) => i.status === "error").length;
    const scheduled = new Date(survey.opensAt).getTime() > now.getTime();
    const reminderAt = new Date(new Date(survey.closesAt).getTime() - emails.reminderDaysBeforeClose * 86_400_000).toISOString();
    const second = secondLocaleOf(survey);
    const fixLabel: Record<ChecklistTarget, string> = {
        questions: "Questions",
        french: second ? LANGUAGE_NAMES[second] : "Translation",
        settings: "Settings",
        reward: "Reward",
        schedule: "Dates",
    };

    return (
        <StepLayout back={{ label: "Back: Reward", onPress: onBack }}>
            <StepCard
                title="When it runs"
                description={`Everyone in ${programName} can take it while it's open. Anyone who started before it closes has 24 hours to finish.`}
            >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <DatePicker label="Opens" value={opens.date} onChange={(d) => d && onChange({ ...survey, opensAt: join(d, opens.time, tz) })} />
                    <SelectField
                        label="Time"
                        value={opens.time}
                        options={TIMES}
                        onChange={(time) => opens.date && onChange({ ...survey, opensAt: join(opens.date, time, tz) })}
                    />
                    <DatePicker
                        label="Closes"
                        value={closes.date}
                        minValue={opens.date ?? undefined}
                        onChange={(d) => d && onChange({ ...survey, closesAt: join(d, closes.time, tz) })}
                    />
                    <SelectField
                        label="Time"
                        value={closes.time}
                        options={TIMES}
                        onChange={(time) => closes.date && onChange({ ...survey, closesAt: join(closes.date, time, tz) })}
                    />
                </div>
                <SelectField
                    label="Time zone"
                    value={tz}
                    options={TIMEZONES}
                    onChange={(timezone) =>
                        // Keep the same wall-clock times in the new zone.
                        onChange({
                            ...survey,
                            timezone,
                            opensAt: opens.date ? join(opens.date, opens.time, timezone) : survey.opensAt,
                            closesAt: closes.date ? join(closes.date, closes.time, timezone) : survey.closesAt,
                        })
                    }
                />
            </StepCard>

            <StepCard title="Emails" description={`Sent in each participant's language, with a button that opens the ${noun} after sign-in.`}>
                <SettingToggle
                    label="Invite email when it opens"
                    hint={`Subject: “${inviteSubject}”`}
                    isSelected={emails.inviteAtOpen}
                    onChange={(inviteAtOpen) => setEmails({ inviteAtOpen })}
                />
                <SettingToggle
                    label="Reminder for people who haven't finished"
                    hint="Resumes where they left off."
                    isSelected={emails.reminder}
                    onChange={(reminder) => setEmails({ reminder })}
                />
                {emails.reminder && (
                    <div className="max-w-xs">
                        <SelectField
                            label="Send the reminder"
                            value={emails.reminderDaysBeforeClose}
                            options={[1, 2, 3, 5, 7].map((d) => ({
                                id: d,
                                label: `${d} ${d === 1 ? "day" : "days"} before close (${fmtDay(new Date(new Date(survey.closesAt).getTime() - d * 86_400_000).toISOString(), tz)})`,
                            }))}
                            onChange={(reminderDaysBeforeClose) => setEmails({ reminderDaysBeforeClose })}
                        />
                    </div>
                )}
            </StepCard>

            <StepCard
                title="Review before publishing"
                description={ready ? "Everything's ready." : `Fix ${blocking} ${blocking === 1 ? "item" : "items"} to publish.`}
            >
                <ul className="flex flex-col divide-y divide-secondary overflow-hidden rounded-xl ring-1 ring-secondary ring-inset">
                    {checklist.map((item) => {
                        const Icon = item.status === "ok" ? CheckCircle : item.status === "warning" ? AlertTriangle : AlertCircle;
                        return (
                            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                                <Icon
                                    aria-hidden="true"
                                    className={cx(
                                        "mt-0.5 size-5 shrink-0",
                                        item.status === "ok"
                                            ? "text-fg-success-primary"
                                            : item.status === "warning"
                                              ? "text-fg-warning-primary"
                                              : "text-fg-error-primary",
                                    )}
                                />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">
                                        {item.label}
                                        <span className="sr-only">
                                            {item.status === "ok" ? " (ready)" : item.status === "warning" ? " (warning)" : " (must fix)"}
                                        </span>
                                    </span>
                                    <span className="text-sm text-tertiary">{item.detail}</span>
                                </div>
                                {item.status !== "ok" && (
                                    <Button color="link-color" size="sm" iconTrailing={ArrowRight} onClick={() => onFix(item.fixIn)} className="shrink-0">
                                        Fix in {fixLabel[item.fixIn]}
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
                {survey.status === "live" || survey.status === "scheduled" ? (
                    <p role="status" className="flex items-center gap-2 rounded-xl bg-success-primary px-4 py-3 text-sm font-semibold text-success-primary">
                        <CheckCircle className="size-5 shrink-0" aria-hidden="true" />
                        {survey.status === "live"
                            ? `Live. Closes ${fmtDay(survey.closesAt, tz)}. Wording fixes are fine; changing questions that have responses is logged.`
                            : `Scheduled. Opens ${fmtDay(survey.opensAt, tz)}. You can still edit anything until then.`}
                    </p>
                ) : (
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end">
                        {!ready && <span className="text-sm text-tertiary">Publishing unlocks when every red item is fixed.</span>}
                        <Button size="lg" iconLeading={Send01} isDisabled={!ready} onClick={() => setConfirmOpen(true)}>
                            {scheduled ? `Schedule for ${fmtDay(survey.opensAt, tz)}` : "Publish now"}
                        </Button>
                    </div>
                )}
            </StepCard>

            <ModalOverlay isOpen={confirmOpen} onOpenChange={setConfirmOpen} isDismissable>
                <Modal className="max-w-lg">
                    <Dialog aria-label={`${scheduled ? "Schedule" : "Publish"} ${noun}`}>
                        <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {scheduled ? `Schedule ${survey.title}?` : `Publish ${survey.title}?`}
                            </Heading>
                            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-tertiary">
                                <li>
                                    {scheduled ? `It opens ${fmtDay(survey.opensAt, tz)}` : "It goes live now"} for all{" "}
                                    {eligibleParticipants.toLocaleString("en-US")} participants
                                    {survey.card.enabled ? ", with a card on their dashboard" : ""}.
                                </li>
                                {emails.inviteAtOpen && <li>The invite email goes out {scheduled ? "when it opens" : "now"}.</li>}
                                {emails.reminder && <li>A reminder goes out {fmtDay(reminderAt, tz)} to anyone who hasn't finished.</li>}
                                <li>It closes {fmtDay(survey.closesAt, tz)}.</li>
                                {quiz ? (
                                    <li>Scores and answers are linked to accounts. Each participant gets one try.</li>
                                ) : (
                                    <li>
                                        {survey.anonymity === "anonymous" ? "Answers are anonymous" : "Answers are linked to accounts"}. This locks after the first
                                        response.
                                    </li>
                                )}
                            </ul>
                            <div className="flex justify-end gap-3">
                                <Button color="secondary" size="md" onClick={() => setConfirmOpen(false)}>
                                    Not yet
                                </Button>
                                <Button
                                    size="md"
                                    onClick={() => {
                                        setConfirmOpen(false);
                                        onPublish(scheduled ? "scheduled" : "live");
                                    }}
                                >
                                    {scheduled ? "Schedule" : "Publish"}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </StepLayout>
    );
};
