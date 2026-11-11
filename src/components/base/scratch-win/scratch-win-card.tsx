import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx, sortCx } from "@/utils/cx";

// ── Styles ────────────────────────────────────────────────────────────────────

// Panel shell matches ConciergeCta and SupplierShowcase: a light card with copy on the left and art on the right.
const styles = sortCx({
    panel: "flex flex-col overflow-hidden rounded-2xl border border-secondary bg-neutral-50 shadow-xs md:flex-row md:items-stretch",
    body: "flex flex-1 flex-col justify-center px-6 pt-10 pb-10 lg:p-16",
    eyebrow: "text-sm font-semibold text-brand-secondary md:text-md",
    headline: "mt-3 text-display-sm font-semibold text-black md:text-display-md",
    description: "mt-4 text-lg text-black md:mt-5 md:text-xl",
    form: "mt-8 flex flex-col gap-3 sm:flex-row sm:items-start",
    status: "mt-4 flex items-start gap-2 text-sm font-medium motion-safe:animate-[quiz-rise-in_0.35s_ease-out]",
    media: "flex shrink-0 items-end justify-center px-6 pt-2 md:w-2/5 md:pt-8 md:pr-10 md:pl-0",
    image: "max-h-64 w-auto object-contain md:max-h-96",
});

// ── Component ─────────────────────────────────────────────────────────────────

export interface ScratchWinResult {
    type: "success" | "error";
    /** Shown under the code field, e.g. `You won 500 points!`. */
    message: string;
}

export interface ScratchWinCardProps {
    eyebrow?: string;
    headline: string;
    description?: string;
    /** Rules or details page. Adds a `Learn more` link under the description. */
    learnMoreHref?: string;
    image: { src: string; alt: string };
    /** Called with the trimmed code when the participant submits it. */
    onSubmitCode?: (code: string) => void;
    /** Shows the submit button as busy while the code is being checked. */
    isSubmitting?: boolean;
    /** Outcome of the last code. Cleared from view as soon as the participant edits the field. */
    result?: ScratchWinResult | null;
    placeholder?: string;
    submitLabel?: string;
    className?: string;
}

/**
 * Home page card for scratch-off promotions: the participant types the code
 * revealed on their card and submits it to see what they won.
 */
export const ScratchWinCard = ({
    eyebrow,
    headline,
    description,
    learnMoreHref,
    image,
    onSubmitCode,
    isSubmitting = false,
    result,
    placeholder = "Enter code here",
    submitLabel = "Submit code",
    className,
}: ScratchWinCardProps) => {
    const [code, setCode] = useState("");
    // The result belongs to the code that was submitted, so hide it once the field changes.
    const [resultFor, setResultFor] = useState<string | null>(null);
    const shownResult = result && resultFor === code ? result : null;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) return;
        setResultFor(code);
        onSubmitCode?.(trimmed);
    };

    return (
        <section className={cx(styles.panel, className)}>
            <div className={styles.body}>
                {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                <h2 className={styles.headline}>{headline}</h2>
                {description && <p className={styles.description}>{description}</p>}
                {learnMoreHref && (
                    <div className="mt-4">
                        <Button color="link-color" size="lg" href={learnMoreHref} iconLeading={InfoCircle}>
                            Learn more
                        </Button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        aria-label="Scratch-off code"
                        size="md"
                        placeholder={placeholder}
                        value={code}
                        onChange={setCode}
                        isInvalid={shownResult?.type === "error"}
                        isDisabled={isSubmitting}
                        autoComplete="off"
                        className="w-full sm:max-w-xs"
                    />
                    <Button type="submit" color="primary" size="lg" isLoading={isSubmitting} isDisabled={!code.trim()} className="shrink-0">
                        {submitLabel}
                    </Button>
                </form>

                <div aria-live="polite">
                    {shownResult && (
                        <p className={cx(styles.status, shownResult.type === "success" ? "text-success-primary" : "text-error-primary")}>
                            {shownResult.type === "success" ? (
                                <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            ) : (
                                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            )}
                            {shownResult.message}
                        </p>
                    )}
                </div>
            </div>

            <div className={styles.media}>
                <img src={image.src} alt={image.alt} className={styles.image} />
            </div>
        </section>
    );
};
