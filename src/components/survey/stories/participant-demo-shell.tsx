import type { ReactNode } from "react";
import { ClipboardCheck } from "@untitledui/icons";
import { AppShell } from "@/components/base/app-shell/app-shell";
import { sampleAccountMenuItems, sampleAccountName, sampleBrand, sampleHeaderActions, sampleNavItems } from "@/components/base/app-shell/app-shell-sample-data";
import type { AppNavEntry } from "@/components/base/app-shell/app-shell-types";
import { useProgramBrand } from "@/components/themes/program-brands";

/** The participant nav with "Surveys & quizzes" added after How to Earn, showing how many are open. */
const navWithSurveys = (count: number): AppNavEntry[] => {
    const item: AppNavEntry = {
        id: "surveys",
        label: "Surveys & quizzes",
        href: "#",
        icon: ClipboardCheck,
        badge:
            count > 0 ? (
                <span className="rounded-full bg-brand-solid px-2 py-0.5 text-xs font-semibold text-white tabular-nums" aria-label={`${count} available`}>
                    {count}
                </span>
            ) : undefined,
    };
    const at = sampleNavItems.findIndex((n) => !("divider" in n) && n.id === "earn");
    return [...sampleNavItems.slice(0, at + 1), item, ...sampleNavItems.slice(at + 1)];
};

/** The participant site (Base/AppShell) with Surveys & quizzes in the nav. */
export const ParticipantDemoShell = ({ children, activeId = "dashboard", available = 0 }: { children: ReactNode; activeId?: string; available?: number }) => {
    const brand = useProgramBrand();
    return (
        <AppShell
            sidebar={{
                brand: brand.logoSrc ? { logoSrc: brand.logoSrc, name: brand.name } : sampleBrand,
                items: navWithSurveys(available),
                activeId,
                accountName: sampleAccountName,
                pointsBalance: 12450,
                accountMenuItems: sampleAccountMenuItems,
            }}
            header={{ actions: sampleHeaderActions }}
        >
            {children}
        </AppShell>
    );
};
