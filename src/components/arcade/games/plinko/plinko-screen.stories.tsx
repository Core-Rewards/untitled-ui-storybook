import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { type MockScenario, createMockArcadeApi, mockGames, mockPlinkoBoard } from "../../api/mock-arcade-api";
import { PrizeModal } from "../../components/prize-modal";
import { PlinkoBoard } from "./plinko-board";
import { PlinkoScreen } from "./plinko-screen";

const plinko = mockGames.find((g) => g.kind === "plinko")!;

/** Wires the screen to its own mock backend so every story is playable. */
const PlayablePlinko = ({
    scenario = "default",
    tokens = 25,
    reducedMotion = false,
}: {
    scenario?: MockScenario;
    tokens?: number;
    reducedMotion?: boolean;
}) => {
    const api = useMemo(() => createMockArcadeApi({ scenario, status: { tokenBalance: tokens } }), [scenario, tokens]);
    const [balance, setBalance] = useState(tokens);
    return (
        <PlinkoScreen
            game={plinko}
            tokenBalance={balance}
            reducedMotion={reducedMotion}
            onBack={fn()}
            onNavigate={fn()}
            onPlay={async () => {
                // `api.play` is the Arcade API call, not a Storybook play function.
                // eslint-disable-next-line storybook/context-in-play-function
                const result = await api.play({ gameId: plinko.id, idempotencyKey: crypto.randomUUID() });
                setBalance(result.tokenBalance);
                return result;
            }}
        />
    );
};

const meta = {
    title: "Arcade/Games/Plinko",
    component: PlayablePlinko,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Plinko, reskinned from the Rewards Arcade prototype. Same rules: every ball costs 1 token, every bin is a prize, and the **server** picks the prize before the ball drops. The board only animates to that result. These stories run on the mock prize engine (`mock-prize-engine.ts`), so they are fully playable.",
            },
        },
    },
    args: { scenario: "default", tokens: 25, reducedMotion: false },
    argTypes: {
        scenario: { control: "select", options: ["default", "merch-win", "error"] },
        tokens: { control: { type: "number", min: 0, max: 50 } },
    },
} satisfies Meta<typeof PlayablePlinko>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MerchWin: Story = {
    name: "Merch win (prize modal)",
    args: { scenario: "merch-win" },
    parameters: { docs: { description: { story: "Every drop lands in an outer GEAR bin and opens the prize modal." } } },
};

export const LastToken: Story = { name: "Last token", args: { tokens: 1 } };

export const OutOfTokens: Story = { name: "Out of tokens", args: { tokens: 0 } };

export const NetworkError: Story = { name: "Network error", args: { scenario: "error" } };

export const ReducedMotion: Story = { name: "Reduced motion", args: { reducedMotion: true } };

export const Mobile: Story = { globals: { viewport: { value: "mobile2", isRotated: false } } };

/* ---------- Pieces ---------- */

export const BoardOnly: StoryObj = {
    name: "Board only",
    render: () => (
        <div className="arcade-root flex min-h-dvh items-center justify-center bg-arcade-void p-8">
            <PlinkoBoard board={mockPlinkoBoard} maxHeight={600} className="max-w-3xl" />
        </div>
    ),
};

export const PrizeModalStory: StoryObj = {
    name: "Prize modal",
    render: () => {
        const Demo = () => {
            const [open, setOpen] = useState(true);
            return (
                <div className="arcade-root flex min-h-dvh items-center justify-center bg-arcade-void">
                    <button className="text-arcade-ice underline" onClick={() => setOpen(true)}>
                        Show again
                    </button>
                    <PrizeModal
                        prize={open ? { type: "merchandise", label: "Insulated Tumbler", fulfillmentNote: "Ships to the address on your profile" } : null}
                        onClose={() => setOpen(false)}
                    />
                </div>
            );
        };
        return <Demo />;
    },
};
