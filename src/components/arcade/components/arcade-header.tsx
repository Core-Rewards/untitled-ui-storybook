import { type ReactNode, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    Heading as AriaHeading,
    Link as AriaLink,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuTrigger as AriaMenuTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    Popover as AriaPopover,
} from "react-aria-components";
import { IconMenu } from "@/components/arcade/components/arcade-icons";
import { cx } from "@/utils/cx";
import { ARCADE_ROUTES } from "../routes";
import { ArcadeButton } from "./arcade-button";
import { TokenBalance } from "./token-balance";

export type ArcadeNavItem = "how-to-play" | "achievements" | "jackpot";

export interface ArcadeHeaderProps {
    /** Back button, far left. Omit on the Enter screen. */
    back?: { label: string; onPress: () => void };
    tokenBalance?: number;
    isLoading?: boolean;
    /** Highlights the current nav item. */
    current?: ArcadeNavItem;
    /** Content of the How to Play dialog. Each game can pass its own rules. */
    howToPlay?: ReactNode;
    /** Extra controls placed just left of the token counter (e.g. the sound toggle). */
    actions?: ReactNode;
    /**
     * Handle Achievements / Jackpot yourself (e.g. state-based navigation in Storybook).
     * When omitted they are plain links to `ARCADE_ROUTES`.
     */
    onNavigate?: (section: "achievements" | "jackpot") => void;
    className?: string;
}

/** Header buttons use the design kit tab button (`arcade-tab` utility in arcade-theme.css). */
const tab = "arcade-tab outline-none";

const DefaultHowToPlay = () => (
    <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-arcade-muted">
        <li>You earn tokens through your program activities.</li>
        <li>Pick a game. Each play costs the token amount shown on the card.</li>
        <li>Every play wins a prize. Points go straight to your balance; gear ships to you.</li>
    </ol>
);

const HowToPlayDialog = ({ children, isOpen, onOpenChange }: { children?: ReactNode; isOpen: boolean; onOpenChange: (open: boolean) => void }) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable
        className={({ isEntering, isExiting }) =>
            cx(
                "arcade-root fixed inset-0 z-50 flex items-center justify-center bg-arcade-void/70 p-4 backdrop-blur-sm",
                isEntering && "duration-200 animate-in fade-in",
                isExiting && "duration-150 animate-out fade-out",
            )
        }
    >
        <AriaModal className="w-full max-w-md outline-none">
            <AriaDialog className="outline-none">
                {({ close }) => (
                    <div className="flex flex-col gap-4 bg-arcade-night p-6 text-sm text-arcade-ice arcade-frame">
                        <AriaHeading
                            slot="title"
                            className="font-arcade-display text-4xl leading-none font-black text-white uppercase italic arcade-text-offset"
                        >
                            How to play
                        </AriaHeading>
                        {children ?? <DefaultHowToPlay />}
                        <ArcadeButton size="md" color="acid" showArrow={false} className="self-start" onPress={close} autoFocus>
                            Got it
                        </ArcadeButton>
                    </div>
                )}
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);

/**
 * Arcade top bar, from the design kit preview (`arcade-design-kit/preview/index.html`):
 * solid ink bar with a faint dot screen and a violet highlight edge.
 * Back (far left) · How to Play / Achievements / Jackpot (center) · Tokens (far right).
 * Used on every Arcade screen; the Enter screen omits `back`.
 */
export const ArcadeHeader = ({ back, tokenBalance, isLoading, current, howToPlay, actions, onNavigate, className }: ArcadeHeaderProps) => {
    const [howOpen, setHowOpen] = useState(false);
    const linkProps = (section: "achievements" | "jackpot") =>
        onNavigate ? { onPress: () => onNavigate(section) } : { href: ARCADE_ROUTES[section] };
    return (
        <header
            className={cx(
                "relative z-20 w-full border-b border-arcade-rule bg-arcade-night",
                // Dot screen texture from the kit
                "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(var(--color-arcade-cyan)_1px,transparent_1px)] before:bg-[length:15px_15px] before:opacity-[0.07] before:content-['']",
                className,
            )}
        >
            <div className="relative mx-auto grid h-18 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:h-22 md:gap-4 md:px-8">
                {/* Left: back */}
                <div className="flex min-w-0 items-center">
                    {back && (
                        <AriaButton onPress={back.onPress} className={cx(tab, "max-w-full")}>
                            <ArrowLeft aria-hidden="true" className="size-4 stroke-[2.5px]" />
                            <span className="truncate max-sm:sr-only">{back.label}</span>
                        </AriaButton>
                    )}
                </div>

                {/* Center: menu */}
                <nav aria-label="Arcade" className="flex items-center justify-center">
                    <ul className="flex items-center gap-2 max-md:hidden">
                        <li>
                            <AriaButton onPress={() => setHowOpen(true)} aria-current={current === "how-to-play" ? "page" : undefined} className={tab}>
                                How to Play
                            </AriaButton>
                        </li>
                        <li>
                            <AriaLink {...linkProps("achievements")} aria-current={current === "achievements" ? "page" : undefined} className={tab}>
                                Achievements
                            </AriaLink>
                        </li>
                        <li>
                            <AriaLink {...linkProps("jackpot")} aria-current={current === "jackpot" ? "page" : undefined} className={tab}>
                                Jackpot
                            </AriaLink>
                        </li>
                    </ul>

                    {/* Small screens: same items in a menu */}
                    <AriaMenuTrigger>
                        <AriaButton aria-label="Arcade menu" className={cx(tab, "md:hidden")}>
                            <IconMenu className="size-4" /> Menu
                        </AriaButton>
                        <AriaPopover placement="bottom" offset={10} className="arcade-root outline-none">
                            <AriaMenu
                                onAction={(key) => {
                                    if (key === "how") setHowOpen(true);
                                    else if (onNavigate && (key === "achievements" || key === "jackpot")) onNavigate(key);
                                }}
                                className="flex min-w-48 flex-col gap-1.5 bg-arcade-night p-2 arcade-frame-sm outline-none"
                            >
                                {[
                                    { id: "how", label: "How to Play" },
                                    { id: "achievements", label: "Achievements", href: onNavigate ? undefined : ARCADE_ROUTES.achievements },
                                    { id: "jackpot", label: "Jackpot", href: onNavigate ? undefined : ARCADE_ROUTES.jackpot },
                                ].map((item) => (
                                    <AriaMenuItem
                                        key={item.id}
                                        id={item.id}
                                        href={item.href}
                                        className="arcade-tab w-full outline-none data-[focused]:border-arcade-cyan data-[focused]:text-arcade-acid"
                                    >
                                        {item.label}
                                    </AriaMenuItem>
                                ))}
                            </AriaMenu>
                        </AriaPopover>
                    </AriaMenuTrigger>
                </nav>

                {/* Right: tokens */}
                <div className="flex items-center justify-end gap-3">
                    {actions}
                    <TokenBalance tokens={tokenBalance} isLoading={isLoading} size="sm" />
                </div>
            </div>
            <HowToPlayDialog isOpen={howOpen} onOpenChange={setHowOpen}>
                {howToPlay}
            </HowToPlayDialog>
        </header>
    );
};
