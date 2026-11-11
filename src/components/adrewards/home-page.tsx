import { useMemo, useState } from "react";
import type { FC } from "react";
import { Bell01, ShoppingCart01, Zap } from "@untitledui/icons";
import { AppShell } from "@/components/base/app-shell/app-shell";
import type { AppHeaderAction } from "@/components/base/app-shell/app-shell-types";
import { Button } from "@/components/base/buttons/button";
import { ContentCard } from "@/components/base/content-card/content-card";
import { NotificationsDrawer } from "@/components/base/notifications/notifications-drawer";
import type { AppNotification } from "@/components/base/notifications/notifications-drawer";
import { PromotionCarousel } from "@/components/base/promotion-card/promotion-carousel";
import { QuizCard } from "@/components/base/quiz/quiz-card";
import type { QuizAnswer } from "@/components/base/quiz/quiz-types";
import { ScratchWinCard } from "@/components/base/scratch-win/scratch-win-card";
import type { ScratchWinResult } from "@/components/base/scratch-win/scratch-win-card";
import { sampleSuppliers } from "@/components/base/suppliers/supplier-sample-data";
import { SupplierShowcase } from "@/components/base/suppliers/supplier-showcase";
import educationImage from "./assets/EducationCenter_596x250.jpg";
import scratchCardImage from "./assets/Isolated_hand_holding_Scratch-off_card_bg.png";
import earnImage from "./assets/graphic_TwoMen_Counter.png";
import spinWheelImage from "./assets/hero_halfcolumn_spinwheel_581x900.jpg";
import {
    STATIC_HREF,
    accountMenuItems,
    accountName,
    brand,
    earnCategory,
    educationCategory,
    initialNotifications,
    navItems,
    pointsBalance,
    promotions,
    question,
} from "./home-page-data";

export interface AdRewardsHomePageProps {
    /** Today, for the promotion countdowns. Defaults to the current date. */
    now?: Date;
    onSignOut?: () => void;
}

/**
 * The AD Rewards participant home page on the app shell. Only this page is
 * built: navigation and card links are static, while the account menu, the
 * notifications drawer, the Question of the Week and the scratch-off code
 * field all work.
 */
export const AdRewardsHomePage: FC<AdRewardsHomePageProps> = ({ now, onSignOut = () => {} }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [answer, setAnswer] = useState<QuizAnswer | null>(null);
    const [scratchResult, setScratchResult] = useState<ScratchWinResult | null>(null);

    const unreadCount = notifications.filter((notification) => notification.isUnread).length;

    const headerActions = useMemo<AppHeaderAction[]>(
        () => [
            { id: "cart", label: "Cart", icon: ShoppingCart01, href: STATIC_HREF },
            { id: "notifications", label: "Notifications", icon: Bell01, badge: unreadCount, onPress: () => setNotificationsOpen(true) },
        ],
        [unreadCount],
    );

    const markRead = (id?: string) =>
        setNotifications((list) => list.map((notification) => (!id || notification.id === id ? { ...notification, isUnread: false } : notification)));

    return (
        <>
            <AppShell
                sidebar={{ brand, items: navItems, activeId: "home", accountName, pointsBalance, accountMenuItems, onSignOut }}
                header={{ actions: headerActions }}
                contentClassName="lg:py-10"
            >
                <div className="flex flex-col gap-8">
                    <h1 className="sr-only">Home</h1>

                    {/* ── Question of the Week ─────────────────────────────── */}
                    <div className="flex flex-col gap-4">
                        {answer?.isCorrect && (
                            <div
                                role="status"
                                className="flex flex-wrap items-center gap-4 rounded-xl border border-secondary bg-primary p-4 motion-safe:animate-[quiz-rise-in_0.45s_ease-out]"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                                    <Zap className="size-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-40 flex-1">
                                    <p className="text-sm font-semibold text-primary">You earned a spin on the points wheel</p>
                                    <p className="mt-0.5 text-sm text-tertiary">Spin for a chance to win up to 10,000 points.</p>
                                </div>
                                <Button color="primary" size="md" href={STATIC_HREF} className="shrink-0">
                                    Spin the Wheel
                                </Button>
                            </div>
                        )}
                        <QuizCard
                            question={question}
                            answer={answer}
                            onSubmit={setAnswer}
                            eyebrow="Question of the Week"
                            nextQuestionLabel="A new question arrives every Monday."
                            image={{ src: spinWheelImage, alt: "Earn a chance to win 10,000 points. Each correct answer to the Question of the Week gets you 1 spin." }}
                        />
                    </div>

                    {/* ── Earn more ────────────────────────────────────────── */}
                    <ContentCard
                        variant="featured"
                        category={earnCategory}
                        title="Earn More with AD Rewards!"
                        description="For every $1 sold of participating AD Rewards suppliers' products, earn 1 point. Track your points and visit the Shop to redeem them for amazing rewards. New reward items are added daily, so check back often."
                        href={STATIC_HREF}
                        image={{ src: earnImage, alt: "Two counter sales associates reviewing a tablet" }}
                        headingLevel={2}
                    />

                    {/* ── Promotions ───────────────────────────────────────── */}
                    <PromotionCarousel promotions={promotions} title="Your Promotions" viewAllHref={STATIC_HREF} sortByUrgency={false} now={now} />

                    {/* ── Participating suppliers ──────────────────────────── */}
                    {/* The showcase is a page section with its own gutters; inside the shell the content column already has them. */}
                    <SupplierShowcase
                        headline="Earn with the brands you already sell"
                        description="Hundreds of AD Rewards suppliers across our Electrical, Industrial, HVAC and Plumbing divisions reward you for every qualifying sale."
                        suppliers={sampleSuppliers}
                        viewAllHref={STATIC_HREF}
                        maxLogos={40}
                        speed={9}
                        className="bg-transparent py-0 md:py-0 [&>div]:max-w-none [&>div]:px-0"
                    />

                    {/* ── Education Center ─────────────────────────────────── */}
                    <ContentCard
                        variant="featured"
                        category={educationCategory}
                        title="Educate Yourself. Increase Your Sales."
                        description="Use this powerful platform to develop your product knowledge of your Supplier partners and earn AD Rewards points! The more you learn, the more you earn!"
                        href={STATIC_HREF}
                        image={{ src: educationImage, alt: "A sales associate taking an online product course" }}
                        headingLevel={2}
                    />

                    {/* ── Scratch & Win ────────────────────────────────────── */}
                    <ScratchWinCard
                        eyebrow="AD Rewards"
                        headline="Scratch & Win!"
                        description="Thank you for your loyal commitment to always offering AD Rewards participating suppliers first!"
                        learnMoreHref={STATIC_HREF}
                        image={{ src: scratchCardImage, alt: "A hand holding an AD Rewards scratch-off card" }}
                        result={scratchResult}
                        onSubmitCode={(code) =>
                            setScratchResult(
                                code.length >= 6
                                    ? { type: "success", message: "Code accepted! Your points will be added to your balance shortly." }
                                    : { type: "error", message: "That code was not recognized. Check your card and try again." },
                            )
                        }
                    />

                    <p className="text-center text-sm text-tertiary">Copyright © 2026 Core Rewards</p>
                </div>
            </AppShell>

            <NotificationsDrawer
                notifications={notifications}
                isOpen={isNotificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onNotificationPress={(notification) => markRead(notification.id)}
                onMarkAllRead={() => markRead()}
                viewAllHref={STATIC_HREF}
            />
        </>
    );
};
