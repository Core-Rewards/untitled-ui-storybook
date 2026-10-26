import { useEffect, useRef, useState } from "react";
import { Check, Copy01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";

// ── Styles ────────────────────────────────────────────────────────────────────

// Layout follows Untitled UI's cta-split-image-04: a light panel with copy on the left and a photo on the right.
const styles = sortCx({
    section: "bg-primary py-16 md:py-24",
    container: "mx-auto max-w-container px-4 md:px-8",
    panel: "flex flex-col overflow-hidden rounded-2xl bg-neutral-50 shadow-xl md:flex-row md:items-center md:rounded-3xl",
    body: "flex flex-1 flex-col px-6 pt-10 pb-12 lg:p-16",
    headline: "text-display-sm font-semibold text-black md:text-display-md",
    description: "mt-4 text-lg text-black md:mt-5 md:text-xl",
    cta: "mt-8 flex flex-col items-start gap-3 md:mt-12",
    ctaLabel: "text-md font-medium text-black",
    copyWrap: "relative",
    copyButton: "max-w-full [&_[data-text]]:truncate",
    copied: [
        "pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-primary-solid px-3 py-2 text-xs font-semibold text-white shadow-lg",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
    ].join(" "),
    copiedIcon: "size-3.5",
    image: "h-70 w-full object-cover md:h-100 md:w-95 lg:w-120",
});

// ── Clipboard ─────────────────────────────────────────────────────────────────

/** Copies text, falling back to a hidden textarea where the Clipboard API is blocked (e.g. some iframes). */
const copyText = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        textarea.remove();
        return ok;
    }
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface ConciergeCtaImage {
    src: string;
    alt: string;
}

export interface ConciergeCtaProps {
    headline: string;
    description: string;
    /** Text shown before the email, e.g. "Talk to a Rewards Concierge at". */
    ctaLabel: string;
    /** Concierge email. Clicking it copies the address to the clipboard. */
    email: string;
    image: ConciergeCtaImage;
    /** How long the "Copied" notification stays up, in milliseconds. */
    copiedDuration?: number;
    /** Called after the email is copied. */
    onCopy?: (email: string) => void;
    className?: string;
}

export const ConciergeCta = ({ headline, description, ctaLabel, email, image, copiedDuration = 2000, onCopy, className }: ConciergeCtaProps) => {
    const [copied, setCopied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timeout.current), []);

    const handleCopy = async () => {
        if (!(await copyText(email))) return;
        onCopy?.(email);
        setCopied(true);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setCopied(false), copiedDuration);
    };

    return (
        <section className={cx(styles.section, className)}>
            <div className={styles.container}>
                <div className={styles.panel}>
                    <div className={styles.body}>
                        <h2 className={styles.headline}>{headline}</h2>
                        <p className={styles.description}>{description}</p>

                        <div className={styles.cta}>
                            <p className={styles.ctaLabel}>{ctaLabel}</p>
                            <div className={styles.copyWrap}>
                                {copied && (
                                    <span className={styles.copied} aria-hidden="true">
                                        <Check className={styles.copiedIcon} />
                                        Copied
                                    </span>
                                )}
                                <Button
                                    size="xl"
                                    color="primary"
                                    iconTrailing={copied ? Check : Copy01}
                                    aria-label={`Copy ${email} to clipboard`}
                                    className={styles.copyButton}
                                    onClick={handleCopy}
                                >
                                    {email}
                                </Button>
                            </div>
                            <span aria-live="polite" className="sr-only">
                                {copied ? `${email} copied to clipboard` : ""}
                            </span>
                        </div>
                    </div>
                    <img src={image.src} alt={image.alt} className={styles.image} />
                </div>
            </div>
        </section>
    );
};
