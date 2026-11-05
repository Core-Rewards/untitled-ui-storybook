import type { Meta, StoryObj } from "@storybook/react-vite";
import { mockGames } from "../api/mock-arcade-api";
import { layers } from "../assets";
import { ArcadeBackdrop } from "./arcade-backdrop";
import { ArcadeButton } from "./arcade-button";
import { ArcadeHeader } from "./arcade-header";
import { ArcadeWordmark } from "./arcade-wordmark";
import { GameCard } from "./game-card";
import { GameStage } from "./game-stage";
import { TokenBalance } from "./token-balance";

const Stage = ({ children, variant = "lobby" }: { children: React.ReactNode; variant?: "enter" | "lobby" }) => (
    <ArcadeBackdrop variant={variant} className="!min-h-0 items-center justify-center p-10 lg:!min-h-0">
        {children}
    </ArcadeBackdrop>
);

const meta = {
    title: "Arcade/Components",
    parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

/* ---------- Wordmark ---------- */

export const Wordmark: StoryObj<typeof ArcadeWordmark> = {
    args: { motion: "enter", idleFloat: false, startDelayMs: 0 },
    argTypes: { motion: { control: "inline-radio", options: ["enter", "float", "static"] } },
    parameters: {
        docs: {
            description: {
                story: "Six independent letter layers (from `assets/arcade-letters`). Use the Remount button in the toolbar to replay the entrance.",
            },
        },
    },
    render: (args) => (
        <Stage variant="enter">
            <div className="w-full max-w-4xl">
                <ArcadeWordmark {...args} />
            </div>
        </Stage>
    ),
};

export const WordmarkVsLogo: StoryObj<typeof ArcadeWordmark> = {
    name: "Wordmark vs static logo",
    args: { motion: "enter", idleFloat: false },
    argTypes: { motion: { control: "inline-radio", options: ["enter", "float", "static"] } },
    parameters: {
        docs: {
            description: {
                story: "Left: the static logo. Right: the animated letters. Bottom: the animated letters over a 50% ghost of the logo, so you can check that they settle exactly into the lockup.",
            },
        },
    },
    render: (args) => (
        <Stage variant="lobby">
            <div className="grid w-full max-w-6xl gap-10">
                <div className="grid gap-6 md:grid-cols-2">
                    <figure className="flex flex-col gap-2">
                        <img src={layers.arcadeLogo} alt="Static Arcade logo" className="w-full" />
                        <figcaption className="font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">Static logo</figcaption>
                    </figure>
                    <figure className="flex flex-col gap-2">
                        <ArcadeWordmark {...args} />
                        <figcaption className="font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">Animated letters</figcaption>
                    </figure>
                </div>
                <figure className="flex flex-col gap-2">
                    <div className="relative">
                        <ArcadeWordmark {...args} />
                        <img src={layers.arcadeLogo} alt="" className="pointer-events-none absolute inset-0 z-20 w-full opacity-50" />
                    </div>
                    <figcaption className="font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">
                        Animated letters under a 50% ghost of the static logo
                    </figcaption>
                </figure>
            </div>
        </Stage>
    ),
};

/* ---------- Button ---------- */

export const Buttons: StoryObj<typeof ArcadeButton> = {
    args: { children: "Enter the Arcade", size: "lg", color: "magenta", isPulsing: false, showBrackets: false, showArrow: true, isDisabled: false, hoverEffect: "none" },
    argTypes: {
        hoverEffect: { control: "inline-radio", options: ["none", "swipe"] },
        size: { control: "inline-radio", options: ["md", "lg", "xl"] },
        color: { control: "inline-radio", options: ["magenta", "acid", "cyan", "ghost"] },
    },
    render: (args) => (
        <Stage>
            <div className="flex flex-col items-center gap-10">
                <ArcadeButton {...args} />
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <ArcadeButton size="md" color="cyan">
                        Play now
                    </ArcadeButton>
                    <ArcadeButton size="md" color="acid">
                        Play now
                    </ArcadeButton>
                    <ArcadeButton size="md" color="magenta">
                        Play now
                    </ArcadeButton>
                    <ArcadeButton size="md" color="ghost">
                        All games
                    </ArcadeButton>
                    <ArcadeButton size="md" color="acid" isDisabled>
                        Disabled
                    </ArcadeButton>
                </div>
                <ArcadeButton size="xl" isPulsing showBrackets>
                    Enter the Arcade
                </ArcadeButton>
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <ArcadeButton size="xl" color="ghost" showArrow={false} hoverEffect="swipe" caption="Uses 5 tokens">
                        Drop 5
                    </ArcadeButton>
                    <ArcadeButton size="xl" color="acid" showArrow={false} hoverEffect="swipe" caption="Hover me">
                        Swipe
                    </ArcadeButton>
                </div>
            </div>
        </Stage>
    ),
};

/* ---------- Token balance ---------- */

export const TokenCounter: StoryObj<typeof TokenBalance> = {
    name: "Token balance",
    args: { tokens: 3, isLoading: false, size: "md" },
    render: (args) => (
        <Stage>
            <div className="flex flex-wrap items-center gap-6">
                <TokenBalance {...args} />
                <TokenBalance tokens={0} />
                <TokenBalance isLoading />
                <TokenBalance tokens={12} size="sm" />
            </div>
        </Stage>
    ),
};

/* ---------- Game card ---------- */

const cardArgs = { game: mockGames[1], tokenBalance: 3, isPlaying: false };

export const GameCardDefault: StoryObj<typeof GameCard> = {
    name: "Game card",
    args: cardArgs,
    render: (args) => (
        <Stage>
            <div className="w-80">
                <GameCard {...args} />
            </div>
        </Stage>
    ),
};

export const GameCardStates: StoryObj = {
    name: "Game card states",
    render: () => (
        <Stage>
            <div className="grid w-full max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <p className="mb-3 font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">Default</p>
                    <GameCard game={mockGames[0]} tokenBalance={3} />
                </div>
                <div>
                    <p className="mb-3 font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">Out of tokens</p>
                    <GameCard game={mockGames[2]} tokenBalance={0} />
                </div>
                <div>
                    <p className="mb-3 font-arcade-mono text-xs tracking-widest text-arcade-cyan uppercase">Unavailable</p>
                    <GameCard game={{ ...mockGames[0], isAvailable: false, unavailableReason: "Restocking. Back Monday" }} tokenBalance={3} />
                </div>
            </div>
        </Stage>
    ),
};

/* ---------- Header ---------- */

export const Header: StoryObj = {
    parameters: {
        docs: {
            description: {
                story: "Top bar from the design kit preview. Back far left (omitted on the Enter screen), How to Play / Achievements / Jackpot in the center (a Menu button on small screens), tokens far right.",
            },
        },
    },
    render: () => (
        <div className="arcade-root flex min-h-dvh flex-col gap-10 bg-arcade-void pb-10">
            <ArcadeHeader tokenBalance={10} onNavigate={() => {}} />
            <ArcadeHeader back={{ label: "Back", onPress: () => {} }} tokenBalance={3} onNavigate={() => {}} />
            <ArcadeHeader back={{ label: "All games", onPress: () => {} }} tokenBalance={0} current="jackpot" onNavigate={() => {}} />
        </div>
    ),
};

/* ---------- Game screen template ---------- */

export const GameScreenTemplate: StoryObj<typeof GameStage> = {
    name: "Game screen template",
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                story: "`GameStage` is the layout every game uses: title or logo on the left, the game centered, a short description on the right, action buttons centered under the game. Below `lg` it stacks title, game, actions, description. Plinko is the reference implementation.",
            },
        },
    },
    render: () => (
        <ArcadeBackdrop variant="lobby">
            <ArcadeHeader back={{ label: "All games", onPress: () => {} }} tokenBalance={8} onNavigate={() => {}} />
            <GameStage
                title="Game"
                hud={["Your", "game", "here"]}
                about="Two or three sentences on how the game works and what you can win. Pulled from the game data."
                facts={[
                    { label: "Cost", value: "1 token per play" },
                    { label: "Top prize", value: "Up to 1,000 pts" },
                ]}
                status="Status line"
                actions={
                    <>
                        <ArcadeButton size="xl" color="acid" showArrow={false} caption="Uses 1 token" className="flex-[3] basis-0 px-6 whitespace-nowrap md:px-8">
                            Play
                        </ArcadeButton>
                        <ArcadeButton size="xl" color="ghost" showArrow={false} caption="Uses 5 tokens" className="flex-[2] basis-0 px-6 whitespace-nowrap md:px-8">
                            Play 5
                        </ArcadeButton>
                    </>
                }
            >
                <div className="flex aspect-[4/3] w-full max-w-[560px] items-center justify-center border-2 border-dashed border-arcade-cyan/50 font-arcade-mono text-xs tracking-[0.2em] text-arcade-muted uppercase">
                    Game area
                </div>
            </GameStage>
        </ArcadeBackdrop>
    ),
};
