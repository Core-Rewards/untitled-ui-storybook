import type { FC } from "react";
import { Award01, Mail01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badge";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import type { RecognitionParticipant, RecognitionValue } from "./recognition-types";
import { firstName, pointsLabel } from "./recognition-utils";

const styles = sortCx({
    root: "flex flex-col gap-3",
    header: "flex items-center justify-between gap-3",
    heading: "text-sm font-semibold text-tertiary",
    email: "flex items-center gap-1.5 text-sm text-tertiary",
    card: "overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs",
    image: "aspect-video w-full bg-secondary object-cover",
    panel: "flex aspect-video items-center justify-center bg-utility-brand-50 dark:bg-utility-brand-50/40",
    body: "flex flex-col gap-3 p-5",
    greeting: "text-lg font-semibold text-primary",
    points: "text-display-xs font-semibold text-primary",
    message: {
        base: "text-md whitespace-pre-line break-words",
        filled: "text-secondary",
        empty: "text-quaternary",
    },
    from: "text-sm text-tertiary",
});

interface RecognitionPreviewProps {
    senderName: string;
    recipient: RecognitionParticipant | null;
    value: RecognitionValue | null;
    /** Omit for recognition without points. */
    points?: number | null;
    message: string;
    /** Shows whether the recipient will be emailed. Omit to hide the email status. */
    sendEmail?: boolean;
    heading?: string;
    className?: string;
}

/** What the recipient will receive, updated as the form is filled in. */
export const RecognitionPreview: FC<RecognitionPreviewProps> = ({
    senderName,
    recipient,
    value,
    points,
    message,
    sendEmail,
    heading = "Preview",
    className,
}) => {
    const ValueIcon = value?.icon ?? Award01;

    return (
        <section className={cx(styles.root, className)} aria-label="Recognition preview">
            <div className={styles.header}>
                <h3 className={styles.heading}>{heading}</h3>
                {sendEmail !== undefined && (
                    <span className={styles.email}>
                        <Mail01 className="size-4" aria-hidden="true" />
                        {sendEmail ? "Email on" : "Email off"}
                    </span>
                )}
            </div>

            <div className={styles.card}>
                {value?.image ? (
                    <img src={value.image.src} alt={value.image.alt} className={styles.image} />
                ) : (
                    <div className={styles.panel} aria-hidden="true">
                        <FeaturedIcon icon={ValueIcon} color="brand" theme="light" size="xl" />
                    </div>
                )}

                <div className={styles.body}>
                    <p className={styles.greeting}>{recipient ? `Congratulations, ${firstName(recipient.name)}!` : "Congratulations!"}</p>

                    {value && (
                        <Badge color="brand" type="pill-color" size="md" className="self-start">
                            <ValueIcon className="size-3" aria-hidden="true" />
                            {value.name}
                        </Badge>
                    )}

                    {points ? <p className={styles.points}>{pointsLabel(points)}</p> : null}

                    <p className={cx(styles.message.base, message.trim() ? styles.message.filled : styles.message.empty)}>
                        {message.trim() || "Your message will appear here."}
                    </p>

                    <p className={styles.from}>From {senderName}</p>
                </div>
            </div>
        </section>
    );
};
