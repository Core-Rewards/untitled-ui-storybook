import { useState } from "react";
import type { FC, ReactNode } from "react";
import { Button as AriaButton, Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Menu02, X as CloseIcon } from "@untitledui/icons";
import { AiChatMobileTrigger, AiChatSidebar, AiChatTrigger } from "@/components/application/ai-chat-sidebar";
import type { AiChatSuggestion } from "@/components/application/ai-chat-sidebar";
import { AppSidebar } from "@/components/base/app-shell/app-sidebar";
import type { AppSidebarProps } from "@/components/base/app-shell/app-sidebar";
import { cx } from "@/utils/cx";
import { AdminSidebarRail } from "./admin-sidebar-rail";

export interface AdminShellProps {
    /**
     * The same sidebar as the participant AppShell. In admin, the account card holds
     * the program switcher: `accountName` is the program and `accountMenuItems` list the
     * other programs. Leave `pointsBalance` out.
     */
    sidebar: Omit<AppSidebarProps, "onNavigate" | "className" | "accountMenuPlacement" | "pointsBalance" | "pointsAward">;
    /** Page content. It scrolls inside the shell. */
    children: ReactNode;
    /** Starter prompts for the AI assistant drawer. */
    aiSuggestions?: AiChatSuggestion[];
    /** Whether the AI drawer starts open on desktop. AdminUI opens it by default. */
    defaultAiOpen?: boolean;
    /**
     * `rail` collapses the sidebar to icons on desktop, for pages that need the width
     * (the survey builder). Its menu button opens the full sidebar as a drawer.
     */
    sidebarMode?: "full" | "rail";
    /** Padding and width for the content column. Defaults to full width with page padding. */
    contentClassName?: string;
    className?: string;
}

/**
 * Admin frame, matching the AdminUI admin layout: the shared sidebar (logo, program
 * switcher, navigation, Support and Settings), the page, and the AI assistant drawer
 * on the right with its sparkles toggle pinned top-right. Below `lg` a top bar holds
 * the AI and menu buttons, and the sidebar opens as a drawer.
 */
export const AdminShell: FC<AdminShellProps> = ({
    sidebar,
    children,
    aiSuggestions,
    defaultAiOpen = false,
    sidebarMode = "full",
    contentClassName,
    className,
}) => {
    const isRail = sidebarMode === "rail";
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [isAiOpen, setAiOpen] = useState(defaultAiOpen);
    const { brand } = sidebar;

    return (
        <div className={cx("flex h-dvh flex-col overflow-hidden bg-secondary_subtle text-primary lg:flex-row", className)}>
            {/* Mobile top bar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
                <img src={brand.mobileLogoSrc ?? brand.logoSrc} alt={brand.name} className="h-8 w-auto" />
                <div className="flex items-center gap-1">
                    <AiChatMobileTrigger suggestions={aiSuggestions} />
                    <AriaButton
                        aria-label="Expand navigation menu"
                        onPress={() => setDrawerOpen(true)}
                        className="flex cursor-pointer items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Menu02 className="size-6" />
                    </AriaButton>
                </div>
            </header>

            <ModalOverlay
                isOpen={isDrawerOpen}
                onOpenChange={setDrawerOpen}
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md",
                        !isRail && "lg:hidden",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                <AriaButton
                    aria-label="Close navigation menu"
                    onPress={() => setDrawerOpen(false)}
                    className="fixed top-2.5 right-3 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <CloseIcon className="size-6" />
                </AriaButton>
                <Modal className="w-full max-w-74 cursor-auto will-change-transform">
                    <Dialog aria-label="Navigation" className="h-dvh outline-hidden">
                        <AppSidebar {...sidebar} accountMenuPlacement="bottom" onNavigate={() => setDrawerOpen(false)} />
                    </Dialog>
                </Modal>
            </ModalOverlay>

            {isRail ? (
                <AdminSidebarRail
                    items={sidebar.items}
                    footerItems={sidebar.footerItems}
                    activeId={sidebar.activeId}
                    onExpand={() => setDrawerOpen(true)}
                    className="hidden lg:flex"
                />
            ) : (
                <AppSidebar {...sidebar} className="hidden shrink-0 lg:flex" />
            )}

            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-primary">
                {/* Zero-height sticky rail keeps the AI toggle pinned to the top-right of the content column. */}
                <div className="pointer-events-none sticky top-0 z-20 flex h-0 items-start justify-end px-4 pt-4 max-lg:hidden">
                    <AiChatTrigger isOpen={isAiOpen} onPress={() => setAiOpen((open) => !open)} className="pointer-events-auto" />
                </div>
                <div className={cx("w-full px-4 py-8 lg:px-8 lg:py-10", contentClassName)}>{children}</div>
            </main>

            <AiChatSidebar isOpen={isAiOpen} onClose={() => setAiOpen(false)} suggestions={aiSuggestions} className="max-lg:hidden" />
        </div>
    );
};
