import type { ReactNode } from "react";
import { AppShell } from "@/components/base/app-shell/app-shell";
import { sampleAccountMenuItems, sampleAccountName, sampleBrand, sampleHeaderActions, sampleNavItems } from "@/components/base/app-shell/app-shell-sample-data";
import type { PointsAward } from "@/components/base/app-shell/points-gain";
import { useProgramBrand } from "@/components/themes/program-brands";

/**
 * The participant dashboard as it exists today (Base/AppShell), with placeholder
 * cards around the new survey card. Only the survey card is new.
 */
export const SurveyDashboardDemo = ({
    children,
    pointsBalance = 12450,
    pointsAward,
    footer,
}: {
    children: ReactNode;
    pointsBalance?: number;
    pointsAward?: PointsAward | null;
    footer?: ReactNode;
}) => {
    const brand = useProgramBrand();
    return (
        <AppShell
            sidebar={{
                brand: brand.logoSrc ? { logoSrc: brand.logoSrc, name: brand.name } : sampleBrand,
                items: sampleNavItems,
                activeId: "dashboard",
                accountName: sampleAccountName,
                pointsBalance,
                pointsAward,
                accountMenuItems: sampleAccountMenuItems,
            }}
            header={{ actions: sampleHeaderActions }}
        >
            <div className="flex flex-col gap-6">
                <h1 className="text-display-xs font-semibold text-primary">Welcome back, Jordan</h1>
                {/* The survey card takes a full-width row, like Quiz and ConciergeCta. */}
                {children}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Placeholder title="Current promotions" />
                    <Placeholder title="Featured rewards" />
                </div>
                {footer}
            </div>
        </AppShell>
    );
};

const Placeholder = ({ title, className }: { title: string; className?: string }) => (
    <section className={`flex flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset ${className ?? ""}`}>
        <h2 className="text-md font-semibold text-primary">{title}</h2>
        <div className="h-14 rounded-xl bg-secondary" />
        <div className="h-14 rounded-xl bg-secondary" />
    </section>
);
