import { useState } from "react";
import type { FC, ReactNode } from "react";
import { Button as AriaButton, Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Menu02, X as CloseIcon } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { AppHeader } from "./app-header";
import type { AppHeaderProps } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import type { AppSidebarProps } from "./app-sidebar";

export interface AppShellProps {
    sidebar: Omit<AppSidebarProps, "onNavigate" | "className" | "accountMenuPlacement">;
    header?: Omit<AppHeaderProps, "className">;
    /** Page content. It scrolls inside the shell, so sticky children pin under the header. */
    children: ReactNode;
    /** Width and padding for the content column. Defaults to `max-w-6xl` (1152px), the platform content width. */
    contentClassName?: string;
    className?: string;
}

/**
 * Mirrors the AdminUI participant portal layout: a 280px sidebar with logo,
 * account card and navigation, a slim utility header, and the page. Below `lg`
 * the sidebar and header give way to a top bar whose menu button opens the
 * sidebar as a drawer.
 */
export const AppShell: FC<AppShellProps> = ({ sidebar, header, children, contentClassName, className }) => {
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const { brand } = sidebar;

    return (
        <div className={cx("flex h-dvh flex-col overflow-hidden bg-primary text-primary lg:flex-row", className)}>
            {/* Mobile top bar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
                <img src={brand.mobileLogoSrc ?? brand.logoSrc} alt={brand.name} className="h-8 w-auto" />
                <AriaButton
                    aria-label="Expand navigation menu"
                    onPress={() => setDrawerOpen(true)}
                    className="flex cursor-pointer items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <Menu02 className="size-6" />
                </AriaButton>
            </header>

            <ModalOverlay
                isOpen={isDrawerOpen}
                onOpenChange={setDrawerOpen}
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden",
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

            <AppSidebar {...sidebar} className="hidden shrink-0 lg:flex" />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AppHeader {...header} className="max-lg:hidden" />
                {/* `relative` keeps absolutely positioned descendants (sr-only text) from stretching the document past the shell. */}
                <main className="relative flex-1 overflow-y-auto">
                    <div className={cx("mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-16", contentClassName)}>{children}</div>
                </main>
            </div>
        </div>
    );
};
