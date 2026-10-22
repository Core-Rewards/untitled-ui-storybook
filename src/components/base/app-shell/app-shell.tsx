import { useState } from "react";
import type { FC, ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { AppHeader } from "./app-header";
import type { AppHeaderProps } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import type { AppSidebarProps } from "./app-sidebar";

export interface AppShellProps {
    sidebar: Omit<AppSidebarProps, "onNavigate" | "className">;
    header?: Omit<AppHeaderProps, "onMenuPress" | "className">;
    /** Page content. It scrolls inside the shell, so sticky children pin under the header. */
    children: ReactNode;
    /** Width cap for the content column. Defaults to `max-w-7xl`. */
    contentClassName?: string;
    className?: string;
}

/**
 * Sidebar, header and a scrolling content area. From `lg` up the sidebar is
 * always shown; below that it moves into a drawer opened from the header.
 */
export const AppShell: FC<AppShellProps> = ({ sidebar, header, children, contentClassName, className }) => {
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className={cx("flex h-dvh overflow-hidden bg-primary text-primary", className)}>
            <AppSidebar {...sidebar} className="hidden lg:flex" />

            <ModalOverlay
                isOpen={isDrawerOpen}
                onOpenChange={setDrawerOpen}
                isDismissable
                className="fixed inset-0 z-50 bg-overlay/70 transition-opacity duration-300 entering:opacity-0 exiting:opacity-0 motion-reduce:transition-none lg:hidden"
            >
                <Modal className="h-full w-fit outline-none transition-transform duration-300 ease-out entering:-translate-x-full exiting:-translate-x-full motion-reduce:transition-none">
                    <Dialog aria-label="Navigation" className="relative h-full outline-none">
                        <AppSidebar {...sidebar} onNavigate={() => setDrawerOpen(false)} className="bg-primary shadow-xl" />
                        <Button
                            color="tertiary"
                            size="sm"
                            iconLeading={XClose}
                            aria-label="Close navigation"
                            onClick={() => setDrawerOpen(false)}
                            className="absolute top-3.5 -right-12 text-white hover:bg-white/10"
                        />
                    </Dialog>
                </Modal>
            </ModalOverlay>

            <div className="flex min-w-0 flex-1 flex-col">
                <AppHeader {...header} onMenuPress={() => setDrawerOpen(true)} />
                {/* `relative` keeps absolutely positioned descendants (sr-only text) from stretching the document past the shell. */}
                <main className="relative flex-1 overflow-y-auto">
                    <div className={cx("mx-auto max-w-7xl px-4 pt-8 pb-16 md:px-8", contentClassName)}>{children}</div>
                </main>
            </div>
        </div>
    );
};
