import { type FC, type FormEvent, useState } from "react";
import { AlertCircle, CheckCircle, CoinsStacked01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import { RecognitionMessageField } from "./recognition-message-field";
import { RecognitionPointsPicker } from "./recognition-points-picker";
import { RecognitionPreview } from "./recognition-preview";
import { RecognitionRecipientPicker } from "./recognition-recipient-picker";
import type { ManagerRecognitionProps, PointsSelection, RecognitionParticipant, RecognitionSubmission, RecognitionValue } from "./recognition-types";
import { RecognitionValuePicker } from "./recognition-value-picker";
import { DEFAULT_POINT_OPTIONS, firstName, formatPoints, pointsLabel, resolvePoints, selectionForSuggestedPoints, validatePoints } from "./recognition-utils";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    root: "@container",
    layout: "grid grid-cols-1 gap-8 @4xl:grid-cols-[minmax(0,1fr)_22rem] @4xl:items-start",
    panel: "@container rounded-2xl border border-secondary bg-primary p-5 shadow-xs @xl:p-8",
    header: "flex flex-col gap-4 border-b border-secondary pb-6 @xl:flex-row @xl:items-start @xl:justify-between",
    title: "text-lg font-semibold text-primary",
    description: "mt-1 text-sm text-tertiary",
    budget: "flex shrink-0 items-center gap-3 rounded-xl bg-secondary px-4 py-3",
    budgetLabel: "text-sm font-medium text-tertiary",
    budgetValue: "text-display-xs font-semibold text-primary",
    budgetPeriod: "text-xs text-tertiary",
    form: "flex flex-col gap-6 pt-6",
    error: "flex items-start gap-3 rounded-xl bg-error-primary p-4 text-sm text-error-primary ring-1 ring-error_subtle ring-inset",
    footer: "flex flex-col gap-4 border-t border-secondary pt-6 @xl:flex-row @xl:items-center @xl:justify-between",
    success: "flex flex-col items-center gap-4 py-10 text-center",
    successTitle: "text-lg font-semibold text-primary",
    successText: "max-w-sm text-sm text-tertiary",
    preview: "@4xl:sticky @4xl:top-6",
});

type SentState = { submission: RecognitionSubmission; balanceAfter: number };

// ── Component ─────────────────────────────────────────────────────────────────

export const ManagerRecognition: FC<ManagerRecognitionProps> = ({
    senderName,
    budget,
    values,
    participants,
    onSearchParticipants,
    defaultRecipient,
    pointOptions = DEFAULT_POINT_OPTIONS,
    allowCustomPoints = true,
    minPoints = 1,
    maxPoints,
    messageMaxLength = 500,
    onSend,
    title = "Recognize an associate",
    description = "Send points and a note to thank someone for living our values.",
    className,
}) => {
    const [recipient, setRecipient] = useState<RecognitionParticipant | null>(defaultRecipient ?? null);
    const [value, setValue] = useState<RecognitionValue | null>(null);
    const [pointsSelection, setPointsSelection] = useState<PointsSelection>(null);
    const [message, setMessage] = useState("");
    const [sendEmail, setSendEmail] = useState(true);
    const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
    const [sent, setSent] = useState<SentState | null>(null);
    // Remounts the recipient picker on reset, since it keeps its own search text.
    const [formKey, setFormKey] = useState(0);

    const points = resolvePoints(pointsSelection);
    const pointsError = validatePoints(points, { available: budget.available, min: minPoints, max: maxPoints });
    const canSend = recipient !== null && value !== null && points !== null && !pointsError && message.trim() !== "" && status !== "sending";

    const handleValueChange = (nextValue: RecognitionValue) => {
        setValue(nextValue);
        if (nextValue.points !== undefined) {
            setPointsSelection(selectionForSuggestedPoints(nextValue.points, pointOptions, budget.available, allowCustomPoints));
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canSend) return;

        const submission: RecognitionSubmission = { recipient, value, points, message: message.trim(), sendEmail };

        setStatus("sending");
        try {
            await onSend(submission);
            setSent({ submission, balanceAfter: budget.available - points });
            setStatus("idle");
        } catch {
            setStatus("error");
        }
    };

    const reset = () => {
        setRecipient(null);
        setValue(null);
        setPointsSelection(null);
        setMessage("");
        setSendEmail(true);
        setStatus("idle");
        setSent(null);
        setFormKey((key) => key + 1);
    };

    const recipientFirstName = recipient ? firstName(recipient.name) : undefined;
    const preview = sent?.submission ?? { recipient, value, points, message, sendEmail };

    return (
        <div className={cx(styles.root, className)}>
            <div className={styles.layout}>
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <div>
                            <h2 className={styles.title}>{title}</h2>
                            {description && <p className={styles.description}>{description}</p>}
                        </div>
                        <div className={styles.budget}>
                            <FeaturedIcon icon={CoinsStacked01} color="brand" theme="light" size="md" />
                            <div>
                                <p className={styles.budgetLabel}>Points available</p>
                                <p className={styles.budgetValue}>{formatPoints(sent?.balanceAfter ?? budget.available)}</p>
                                {budget.periodLabel && <p className={styles.budgetPeriod}>{budget.periodLabel}</p>}
                            </div>
                        </div>
                    </div>

                    {sent ? (
                        <div className={styles.success} role="status">
                            <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                            <div>
                                <h2 className={styles.successTitle}>
                                    {pointsLabel(sent.submission.points)} sent to {sent.submission.recipient.name}
                                </h2>
                                <p className={cx(styles.successText, "mt-1")}>
                                    {sent.submission.sendEmail
                                        ? `We emailed ${firstName(sent.submission.recipient.name)} your message.`
                                        : "No email was sent."}{" "}
                                    Your remaining balance is {pointsLabel(sent.balanceAfter)}.
                                </p>
                            </div>
                            <Button color="secondary" size="md" onClick={reset}>
                                Recognize someone else
                            </Button>
                        </div>
                    ) : (
                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            <RecognitionRecipientPicker
                                key={formKey}
                                participants={participants}
                                onSearch={onSearchParticipants}
                                selected={recipient}
                                onChange={setRecipient}
                            />

                            <RecognitionValuePicker values={values} selectedId={value?.id ?? null} onChange={handleValueChange} />

                            <RecognitionPointsPicker
                                options={pointOptions}
                                selection={pointsSelection}
                                onSelectionChange={setPointsSelection}
                                available={budget.available}
                                allowCustom={allowCustomPoints}
                                error={pointsError}
                                hint={value?.points !== undefined ? `Suggested for ${value.name}: ${pointsLabel(value.points)}.` : undefined}
                            />

                            <RecognitionMessageField value={message} onChange={setMessage} maxLength={messageMaxLength} recipientFirstName={recipientFirstName} />

                            {status === "error" && (
                                <div className={styles.error} role="alert">
                                    <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                                    <p>We couldn’t send your recognition. Your entries are saved, so please try again.</p>
                                </div>
                            )}

                            <div className={styles.footer}>
                                <Toggle
                                    label={recipientFirstName ? `Email ${recipientFirstName} about this recognition` : "Email the recipient"}
                                    hint="Includes your message and the points awarded."
                                    isSelected={sendEmail}
                                    onChange={setSendEmail}
                                />
                                <Button type="submit" color="primary" size="lg" isDisabled={!canSend} isLoading={status === "sending"} showTextWhileLoading>
                                    {points && !pointsError ? `Send ${pointsLabel(points)}` : "Send points"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <RecognitionPreview
                    className={styles.preview}
                    senderName={senderName}
                    recipient={preview.recipient}
                    value={preview.value}
                    points={preview.points}
                    message={preview.message}
                    sendEmail={preview.sendEmail}
                    heading={sent ? "Sent" : "Preview"}
                />
            </div>
        </div>
    );
};
