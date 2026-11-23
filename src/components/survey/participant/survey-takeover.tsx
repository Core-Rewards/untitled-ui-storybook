import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, XClose } from "@untitledui/icons";
import { useProgramBrand } from "@/components/themes/program-brands";
import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";

export interface SurveyTakeoverProps {
    /** Survey name, shown in the wide header. */
    surveyTitle?: string;
    /** 0 to 1. Omit to hide the bar. */
    progress?: number;
    /** "3 of 5". Omit on intro and thank-you. */
    position?: { current: number; total: number };
    /** Shows the back arrow (narrow) when set. */
    onBack?: () => void;
    /** Close (×) on narrow, "Save and exit" or "Close" on wide. */
    onExit?: () => void;
    /** "close" before the participant has started; "save" once they have answers. */
    exitKind?: "close" | "save";
    /** Up/down arrows, bottom-right on wide layouts. */
    arrows?: { onUp?: () => void; onDown?: () => void };
    /** Pinned to the bottom on narrow layouts, within thumb reach. */
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * The focused, full-page survey layout. It renders without the participant site's
 * sidebar and header so nothing competes with the question. Layout follows its own
 * width (container queries), so it also works inside a phone frame.
 */
export const SurveyTakeover = ({
    surveyTitle,
    progress,
    position,
    onBack,
    onExit,
    exitKind = "save",
    arrows,
    footer,
    children,
    className,
}: SurveyTakeoverProps) => {
    const { copy } = useSurveyCopy();
    const brand = useProgramBrand();
    const exitLabel = exitKind === "save" ? copy.saveAndExit : copy.close;

    return (
        <div className={cx("@container/takeover relative flex min-h-dvh w-full flex-col bg-primary", className)}>
            {progress !== undefined && (
                <div
                    role="progressbar"
                    aria-label={copy.progressLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    className="absolute inset-x-0 top-0 h-1 bg-quaternary"
                >
                    <div
                        className="h-full bg-brand-solid transition-[width] duration-300 ease-out motion-reduce:transition-none"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            )}

            {/* Narrow header: back · 3 of 5 · close */}
            <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-3 pt-4 pb-2 @3xl/takeover:hidden">
                <div>
                    {onBack && (
                        <IconButton label={copy.back} onPress={onBack}>
                            <ArrowLeft className="size-5" />
                        </IconButton>
                    )}
                </div>
                <p className="text-center text-sm text-tertiary">{position && copy.position(position.current, position.total)}</p>
                <div>
                    {onExit && (
                        <IconButton label={exitLabel} onPress={onExit}>
                            <XClose className="size-5" />
                        </IconButton>
                    )}
                </div>
            </header>

            {/* Wide header: logo + survey name · 4 of 5 · Save and exit */}
            <header className="hidden items-center justify-between gap-6 px-10 pt-6 pb-4 @3xl/takeover:flex">
                <div className="flex min-w-0 items-center gap-3">
                    {brand.logoSrc ? (
                        <img src={brand.logoSrc} alt={brand.name} className="h-8 w-auto" />
                    ) : (
                        <span aria-hidden="true" className="size-8 shrink-0 rounded-lg bg-quaternary" />
                    )}
                    <span className="truncate text-sm font-semibold text-primary">{surveyTitle ?? (brand.logoSrc ? undefined : brand.name)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                    {position && <span className="text-sm text-tertiary">{copy.position(position.current, position.total)}</span>}
                    {onExit && (
                        <button
                            type="button"
                            onClick={onExit}
                            className="cursor-pointer rounded-sm text-sm font-semibold text-secondary underline underline-offset-4 outline-hidden hover:text-secondary_hover focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            {exitLabel}
                        </button>
                    )}
                </div>
            </header>

            <main className="flex flex-1 flex-col px-6 pt-4 pb-6 @3xl/takeover:px-10 @3xl/takeover:pt-[12vh] @3xl/takeover:pb-24">{children}</main>

            {footer && <div className="sticky bottom-0 border-t border-secondary bg-primary px-6 pt-4 pb-6 @3xl/takeover:hidden">{footer}</div>}

            {arrows && (
                <div className="fixed right-10 bottom-8 hidden gap-2 @3xl/takeover:flex">
                    <ArrowButton label={copy.previousQuestion} onPress={arrows.onUp}>
                        <ArrowUp className="size-5" />
                    </ArrowButton>
                    <ArrowButton label={copy.nextQuestion} onPress={arrows.onDown}>
                        <ArrowDown className="size-5" />
                    </ArrowButton>
                </div>
            )}
        </div>
    );
};

const IconButton = ({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onPress}
        className="flex size-11 cursor-pointer items-center justify-center rounded-full text-fg-secondary outline-hidden *:pointer-events-none hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand"
    >
        {children}
    </button>
);

const ArrowButton = ({ label, onPress, children }: { label: string; onPress?: () => void; children: ReactNode }) => (
    <button
        type="button"
        aria-label={label}
        disabled={!onPress}
        onClick={onPress}
        className="flex size-11 cursor-pointer items-center justify-center rounded-lg bg-secondary text-fg-secondary outline-hidden hover:bg-secondary_hover focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
        {children}
    </button>
);
