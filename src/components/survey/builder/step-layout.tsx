import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/** A form step: cards on the left, an optional sticky preview on the right, Back / Next underneath. */
export const StepLayout = ({
    children,
    aside,
    back,
    next,
}: {
    children: ReactNode;
    aside?: ReactNode;
    back?: { label: string; onPress: () => void };
    next?: { label: string; onPress: () => void };
}) => (
    <div className={cx("mx-auto grid w-full items-start gap-8 px-4 py-6 lg:px-8", aside ? "max-w-6xl lg:grid-cols-[minmax(0,1fr)_21rem]" : "max-w-3xl")}>
        <div className="flex min-w-0 flex-col gap-6">
            {children}
            {(back || next) && (
                <div className="flex items-center justify-between gap-3">
                    {back ? (
                        <Button color="secondary" size="md" iconLeading={ArrowLeft} onClick={back.onPress}>
                            {back.label}
                        </Button>
                    ) : (
                        <span />
                    )}
                    {next && (
                        <Button size="md" iconTrailing={ArrowRight} onClick={next.onPress}>
                            {next.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
        {aside && <div className="min-w-0 lg:sticky lg:top-6">{aside}</div>}
    </div>
);

/** A titled card section within a step. */
export const StepCard = ({ title, description, action, children }: { title: string; description?: ReactNode; action?: ReactNode; children?: ReactNode }) => (
    <section className="flex flex-col gap-5 rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:p-6">
        <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                {description && <div className="text-sm text-tertiary">{description}</div>}
            </div>
            {action}
        </div>
        {children}
    </section>
);
