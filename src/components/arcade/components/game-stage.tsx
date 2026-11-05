import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { HudLabel } from "./hud-label";

export interface GameStageFact {
    label: string;
    value: ReactNode;
}

export interface GameStageProps {
    /** Game name. Shown as the big offset title on the left (and above the game on mobile). */
    title: string;
    /** Replaces the text title on the left, e.g. a game logo image. */
    logo?: ReactNode;
    /** Short line under the title, e.g. "Let it drop". */
    tagline?: ReactNode;
    /** Decorative micro-type under the title. */
    hud?: string[];
    /** Two or three sentences for the info panel on the right. */
    about: ReactNode;
    /** Key facts under the description, e.g. cost per play and top prize. */
    facts?: GameStageFact[];
    /** Extra content at the bottom of the info panel. */
    aboutFooter?: ReactNode;
    /** Primary controls, centered under the game. */
    actions: ReactNode;
    /** One line under the actions (status, errors). Announced politely. */
    status?: ReactNode;
    /** Mark the status line as an error. */
    statusIsError?: boolean;
    /** The game itself (board, cabinet, card). Centered. */
    children: ReactNode;
    className?: string;
}

/**
 * Layout template for every Arcade game screen:
 * title/logo on the left, the game centered, a short description on the right,
 * and the action buttons centered under the game.
 *
 * The side columns are equal width, so the game always sits on the true center line.
 * Below `lg` it stacks: title, game, actions, description.
 */
export const GameStage = ({
    title,
    logo,
    tagline,
    hud,
    about,
    facts,
    aboutFooter,
    actions,
    status,
    statusIsError,
    children,
    className,
}: GameStageProps) => (
    <div
        className={cx(
            "relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 px-4 pt-6 pb-8 md:px-8",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:gap-8",
            className,
        )}
    >
        {/* Left: title / logo */}
        <aside className="@container flex flex-col gap-5 max-lg:hidden lg:pt-4">
            {logo ?? (
                <h1 className="font-arcade-display text-[min(33cqw,9rem)] leading-[0.82] font-black tracking-tight text-white uppercase italic arcade-text-offset">
                    {title}
                </h1>
            )}
            {tagline}
            {hud && <HudLabel lines={hud} className="mt-2" />}
        </aside>

        {/* Center: game + actions */}
        <section aria-label={title} className="flex min-w-0 flex-col items-center gap-5">
            <h1 className="font-arcade-display text-6xl leading-none font-black text-white uppercase italic arcade-text-offset lg:hidden">{title}</h1>
            {children}
            <div className="flex w-full max-w-xl flex-wrap items-stretch justify-center gap-4">{actions}</div>
            <p
                aria-live="polite"
                className={cx(
                    "min-h-5 text-center font-arcade-mono text-xs tracking-[0.15em] uppercase",
                    statusIsError ? "text-arcade-pink" : "text-arcade-muted",
                )}
            >
                {status}
            </p>
        </section>

        {/* Right: description */}
        <aside className="flex flex-col lg:pt-4">
            <section aria-label={`About ${title}`} className="flex flex-col gap-4 bg-arcade-night/95 p-5 arcade-frame">
                <h2 className="font-arcade-mono text-[11px] tracking-[0.2em] text-arcade-cyan uppercase">How it works</h2>
                <p className="text-base leading-relaxed text-arcade-ice">{about}</p>
                {facts && facts.length > 0 && (
                    <dl className="flex flex-col gap-2 border-t border-white/10 pt-3 font-arcade-mono text-[11px] tracking-[0.18em] uppercase">
                        {facts.map((f) => (
                            <div key={f.label} className="flex items-baseline justify-between gap-3">
                                <dt className="whitespace-nowrap text-arcade-muted">{f.label}</dt>
                                <dd className="text-right text-arcade-ice">{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                {aboutFooter}
            </section>
        </aside>
    </div>
);
