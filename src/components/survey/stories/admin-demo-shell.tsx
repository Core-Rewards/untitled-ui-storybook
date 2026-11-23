import type { ReactNode } from "react";
import { AdminShell } from "@/components/base/admin-shell/admin-shell";
import { sampleBrand } from "@/components/base/app-shell/app-shell-sample-data";
import { useProgramBrand } from "@/components/themes/program-brands";
import { adminFooterItems, adminNavItems, adminProgramMenuItems, adminProgramName, surveyAiSuggestions } from "../admin/admin-sample-data";

/** A fixed "today" for admin stories: Dec 9, mid-way through the live survey, so "Closes in 6 days" and "2 hours ago" never drift. */
export const ADMIN_NOW = new Date("2026-12-09T12:00:00-05:00");

/** The admin shell with Surveys selected, the program switcher and survey-specific AI prompts. */
export const AdminDemoShell = ({
    children,
    activeId = "surveys",
    defaultAiOpen = false,
    sidebarMode = "full",
    fullBleed = false,
}: {
    children: ReactNode;
    activeId?: string;
    defaultAiOpen?: boolean;
    sidebarMode?: "full" | "rail";
    /** Content fills the column with no page padding, e.g. the builder's panes. */
    fullBleed?: boolean;
}) => {
    const brand = useProgramBrand();
    return (
        <AdminShell
            sidebar={{
                brand: brand.logoSrc ? { logoSrc: brand.logoSrc, name: brand.name } : sampleBrand,
                items: adminNavItems,
                footerItems: adminFooterItems,
                activeId,
                accountName: adminProgramName,
                accountMenuItems: adminProgramMenuItems,
                onSignOut: () => {},
            }}
            aiSuggestions={surveyAiSuggestions}
            defaultAiOpen={defaultAiOpen}
            sidebarMode={sidebarMode}
            contentClassName={fullBleed ? "flex min-h-0 flex-1 flex-col p-0 lg:p-0" : undefined}
        >
            {children}
        </AdminShell>
    );
};
