import type { FC } from "react";
import { Bell01, XClose } from "@untitledui/icons";
import { Button as AriaButton, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx, sortCx } from "@/utils/cx";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppNotification {
    id: string;
    title: string;
    /** One or two lines of detail under the title. */
    body?: string;
    /** When it arrived, already formatted, e.g. `2 hours ago`. */
    time: string;
    /** Defaults to the bell. */
    icon?: FC<{ className?: string }>;
    isUnread?: boolean;
    /** Where the notification leads. Without it the row still marks itself read when pressed. */
    href?: string;
}

export interface NotificationsDrawerProps {
    notifications: AppNotification[];
    isOpen: boolean;
    /** Called when the drawer should close. */
    onClose: () => void;
    /** Called when a notification is pressed, e.g. to mark it read. */
    onNotificationPress?: (notification: AppNotification) => void;
    /** Shows a `Mark all as read` action while any notification is unread. */
    onMarkAllRead?: () => void;
    /** Notifications page. Adds a `View all` button to the footer. */
    viewAllHref?: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = sortCx({
    overlay: "fixed inset-0 z-50 flex justify-end bg-overlay/70 transition-opacity duration-300 data-[entering]:opacity-0 data-[exiting]:opacity-0",
    modal: "flex h-full w-full max-w-md flex-col bg-primary shadow-xl outline-hidden transition-transform duration-300 ease-out data-[entering]:translate-x-full data-[exiting]:translate-x-full",
    header: "flex shrink-0 items-center justify-between gap-4 border-b border-secondary px-4 py-5 md:px-6",
    count: "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-solid px-1.5 text-xs leading-none font-semibold text-white tabular-nums",
    close: "flex size-9 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
    row: "flex w-full cursor-pointer gap-3 px-4 py-4 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:-outline-offset-2 md:px-6",
    rowIcon: "flex size-10 shrink-0 items-center justify-center rounded-full",
    dot: "mt-1.5 size-2 shrink-0 rounded-full bg-brand-solid",
});

// ── Component ─────────────────────────────────────────────────────────────────

/** Slide-out panel listing the participant's notifications, opened from the header bell. */
export const NotificationsDrawer: FC<NotificationsDrawerProps> = ({ notifications, isOpen, onClose, onNotificationPress, onMarkAllRead, viewAllHref }) => {
    const unreadCount = notifications.filter((notification) => notification.isUnread).length;

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={styles.overlay}
        >
            <Modal className={styles.modal}>
                <Dialog className="flex h-full flex-col outline-hidden">
                    <div className={styles.header}>
                        <div className="flex items-center gap-2.5">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                Notifications
                            </Heading>
                            {unreadCount > 0 && (
                                <span className={styles.count}>
                                    {unreadCount}
                                    <span className="sr-only"> unread</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {onMarkAllRead && unreadCount > 0 && (
                                <Button color="link-color" size="sm" onClick={onMarkAllRead}>
                                    Mark all as read
                                </Button>
                            )}
                            <AriaButton aria-label="Close notifications" onPress={onClose} className={styles.close}>
                                <XClose className="size-5" />
                            </AriaButton>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                                <Bell01 className="size-6 text-fg-quaternary" aria-hidden="true" />
                                <p className="text-sm font-semibold text-secondary">You're all caught up</p>
                                <p className="text-sm text-tertiary">New notifications will show up here.</p>
                            </div>
                        ) : (
                            <ul role="list" className="divide-y divide-border-secondary">
                                {notifications.map((notification) => {
                                    const Icon = notification.icon ?? Bell01;
                                    const content = (
                                        <>
                                            <span
                                                className={cx(
                                                    styles.rowIcon,
                                                    notification.isUnread ? "bg-brand-50 text-brand-700" : "bg-secondary text-fg-quaternary",
                                                )}
                                            >
                                                <Icon className="size-5" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={cx("block text-sm text-primary", notification.isUnread ? "font-semibold" : "font-medium")}>
                                                    {notification.title}
                                                </span>
                                                {notification.body && <span className="mt-0.5 block text-sm text-tertiary">{notification.body}</span>}
                                                <span className="mt-1.5 block text-xs text-quaternary">{notification.time}</span>
                                            </span>
                                            {notification.isUnread && (
                                                <>
                                                    <span className={styles.dot} aria-hidden="true" />
                                                    <span className="sr-only">Unread</span>
                                                </>
                                            )}
                                        </>
                                    );

                                    return (
                                        <li key={notification.id}>
                                            {notification.href ? (
                                                <a href={notification.href} onClick={() => onNotificationPress?.(notification)} className={styles.row}>
                                                    {content}
                                                </a>
                                            ) : (
                                                <AriaButton onPress={() => onNotificationPress?.(notification)} className={styles.row}>
                                                    {content}
                                                </AriaButton>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {viewAllHref && (
                        <div className="shrink-0 border-t border-secondary px-4 py-4 md:px-6">
                            <Button color="secondary" size="lg" href={viewAllHref} className="w-full">
                                View all notifications
                            </Button>
                        </div>
                    )}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
