import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";
import { SupplierSphere } from "./supplier-sphere";
import type { Supplier } from "./supplier-types";

// ── Styles ────────────────────────────────────────────────────────────────────

// Card shell matches ConciergeCta and ContentCard. From md up the sphere is a layer behind the copy, sized to the
// card's height, so a bigger sphere never makes the card taller. On phones it stacks under the copy.
const styles = sortCx({
    section: "bg-primary py-16 md:py-24",
    container: "mx-auto max-w-container px-4 md:px-8",
    panel: "relative flex flex-col overflow-hidden rounded-2xl border border-secondary bg-neutral-50 shadow-xs",
    body: "relative z-10 flex flex-col px-6 pt-10 md:w-3/5 md:pb-10 lg:p-16",
    // Fades the logos that drift under the copy so the text stays readable.
    scrim: "pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[62%] bg-linear-to-r from-neutral-50 from-70% to-neutral-50/0 md:block",
    eyebrow: "text-sm font-semibold text-brand-secondary md:text-md",
    headline: "mt-3 text-display-sm font-semibold text-black md:text-display-md",
    description: "mt-4 max-w-xl text-lg text-black md:mt-5 md:text-xl",
    stats: "mt-8 flex gap-10",
    statValue: "text-display-sm font-semibold text-black tabular-nums",
    statLabel: "mt-1 text-md text-tertiary",
    cta: "mt-8 md:mt-10",
    sphere: "mx-auto w-full max-w-90 p-6 md:absolute md:inset-y-0 md:right-0 md:mx-0 md:h-full md:w-auto md:max-w-none md:p-6",
});

// ── Component ─────────────────────────────────────────────────────────────────

export interface SupplierShowcaseProps {
    eyebrow?: string;
    headline: string;
    description: string;
    suppliers: Supplier[];
    /** The Participating Suppliers page. */
    viewAllHref: string;
    viewAllLabel?: string;
    /** Show supplier and division counts under the description. */
    showStats?: boolean;
    /** How many logos ride the sphere. */
    maxLogos?: number;
    /** Sphere rotation in degrees per second. */
    speed?: number;
    /** Cycle every supplier through the sphere, swapping logos on the far side. */
    cycle?: boolean;
    className?: string;
}

/**
 * Home page card for participating suppliers: a short pitch and a link to the
 * full list, beside a turning sphere of supplier logos.
 */
export const SupplierShowcase = ({
    eyebrow = "Participating suppliers",
    headline,
    description,
    suppliers,
    viewAllHref,
    viewAllLabel = "View all suppliers",
    showStats = true,
    maxLogos,
    speed,
    cycle,
    className,
}: SupplierShowcaseProps) => {
    const divisionCount = new Set(suppliers.flatMap((s) => s.listings.map((l) => l.division))).size;

    return (
        <section className={cx(styles.section, className)}>
            <div className={styles.container}>
                <div className={styles.panel}>
                    <div className={styles.body}>
                        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                        <h2 className={styles.headline}>{headline}</h2>
                        <p className={styles.description}>{description}</p>

                        {showStats && (
                            <dl className={styles.stats}>
                                <div className="flex flex-col-reverse">
                                    <dt className={styles.statLabel}>Suppliers</dt>
                                    <dd className={styles.statValue}>{suppliers.length.toLocaleString()}</dd>
                                </div>
                                <div className="flex flex-col-reverse">
                                    <dt className={styles.statLabel}>{divisionCount === 1 ? "Division" : "Divisions"}</dt>
                                    <dd className={styles.statValue}>{divisionCount}</dd>
                                </div>
                            </dl>
                        )}

                        <div className={styles.cta}>
                            <Button size="xl" color="primary" href={viewAllHref} iconTrailing={ArrowRight}>
                                {viewAllLabel}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.scrim} />
                    <SupplierSphere suppliers={suppliers} maxLogos={maxLogos} speed={speed} cycle={cycle} bleed={0.06} className={styles.sphere} />
                </div>
            </div>
        </section>
    );
};
