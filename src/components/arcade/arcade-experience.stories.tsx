import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GamingPad01 } from "@untitledui/icons";
import { AppShell } from "@/components/base/app-shell/app-shell";
import {
    sampleAccountMenuItems,
    sampleAccountName,
    sampleBrand,
    sampleHeaderActions,
    sampleNavItems,
} from "@/components/base/app-shell/app-shell-sample-data";
import type { AppNavEntry } from "@/components/base/app-shell/app-shell-types";
import { ArcadeApiProvider } from "./api/arcade-api-provider";
import { useArcadePoints, useArcadeStatus } from "./api/arcade-session";
import { type MockScenario, createMockArcadeApi } from "./api/mock-arcade-api";
import { ArcadeExperience, type ArcadeView } from "./arcade-experience";
import { ArcadeNavBadge } from "./components/arcade-nav-badge";

const SAMPLE_POINTS = 34449844;

/** Participant nav with the Rewards Arcade item (and its token badge) after How to Earn. */
const navWithArcade = (tokens?: number): AppNavEntry[] => {
    const items = [...sampleNavItems];
    const at = items.findIndex((i) => "id" in i && i.id === "earn") + 1;
    items.splice(at, 0, {
        id: "arcade",
        label: "Rewards Arcade",
        href: "#",
        icon: GamingPad01,
        badge: tokens !== undefined ? <ArcadeNavBadge tokens={tokens} /> : undefined,
    });
    return items;
};

/** The Arcade inside the participant AppShell. Points won roll up the balance in the account card. */
const ArcadeInShell = ({ initialView }: { initialView?: ArcadeView }) => {
    const status = useArcadeStatus();
    const points = useArcadePoints();
    return (
        <AppShell
            sidebar={{
                brand: sampleBrand,
                items: navWithArcade(status.data?.tokenBalance),
                activeId: "arcade",
                accountName: sampleAccountName,
                // Preview only: the platform passes the real balance, refreshed from `onPointsAwarded`.
                pointsBalance: SAMPLE_POINTS + points.sessionTotal,
                pointsAward: points.lastAward,
                accountMenuItems: sampleAccountMenuItems,
            }}
            header={{ actions: sampleHeaderActions }}
            // Full bleed: the Arcade fills the content area under the 56px header.
            contentClassName="flex min-h-full max-w-none flex-col p-0 lg:p-0 [--app-header-height:3.5rem]"
        >
            <ArcadeExperience initialView={initialView} />
        </AppShell>
    );
};

const WithApi = ({ scenario, children }: { scenario: MockScenario; children: React.ReactNode }) => {
    const api = useMemo(() => createMockArcadeApi({ scenario }), [scenario]);
    return <ArcadeApiProvider api={api}>{children}</ArcadeApiProvider>;
};

type Args = { scenario: MockScenario; initialView?: ArcadeView; inShell: boolean };

const meta = {
    title: "Arcade/Experience",
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The full Rewards Arcade flow (Enter, Choose Your Game, Plinko) on the mock Arcade API, inside the participant AppShell. The **Rewards Arcade** nav item shows the token count, and points won flash \"+N\" next to the balance in the account card. Pick a backend scenario with the `scenario` control. In the platform the same screens mount on routes (`ARCADE_ROUTES`); `ArcadeExperience` keeps navigation in state so it runs anywhere.",
            },
        },
    },
    argTypes: {
        scenario: {
            control: "select",
            options: ["default", "low-tokens", "merch-win", "no-tokens", "game-unavailable", "arcade-disabled", "loading", "error"],
        },
        initialView: { control: false },
        inShell: { control: "boolean" },
    },
    args: { scenario: "default", inShell: true },
    render: ({ scenario, initialView, inShell }) => (
        <WithApi key={scenario} scenario={scenario}>
            {inShell ? <ArcadeInShell initialView={initialView} /> : <ArcadeExperience initialView={initialView} />}
        </WithApi>
    ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Starts on the Enter screen, as if the participant just clicked Rewards Arcade. */
export const InAppShell: Story = { name: "In the app shell" };

/** Straight to Plinko. Play a few balls and watch the balance in the account card. */
export const PlayPlinko: Story = { args: { initialView: { screen: "game", gameId: "plinko-01" } } };

export const ChooseYourGame: Story = { name: "Choose your game", args: { initialView: { screen: "lobby" } } };

/** Every play wins merch, so the prize modal opens and no points are added. */
export const MerchWin: Story = { name: "Merch win", args: { scenario: "merch-win", initialView: { screen: "game", gameId: "plinko-01" } } };

export const Standalone: Story = { name: "Without the shell", args: { inShell: false } };

export const Mobile: Story = { globals: { viewport: { value: "mobile2", isRotated: false } } };
