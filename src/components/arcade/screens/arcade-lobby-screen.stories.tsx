import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mockGames } from "../api/mock-arcade-api";
import { ArcadeLobbyScreen } from "./arcade-lobby-screen";

const meta = {
    title: "Arcade/Screens/Choose Your Game",
    component: ArcadeLobbyScreen,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Game lobby (from the *Choose Your Game* comp). Presentational: pass `games`, `tokenBalance` and callbacks. The featured game sits in the middle on desktop and first on mobile. `ArcadeLobbyPage` wires it to the API.",
            },
        },
    },
    args: {
        onNavigate: fn(),
        games: mockGames,
        tokenBalance: 3,
        isLoading: false,
        reducedMotion: false,
        onPlay: fn(),
        onBack: fn(),
        onRetry: fn(),
    },
} satisfies Meta<typeof ArcadeLobbyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoTokens: Story = { name: "No tokens", args: { tokenBalance: 0 } };

export const GameUnavailable: Story = {
    name: "Game unavailable",
    args: { games: mockGames.map((g) => (g.kind === "claw-machine" ? { ...g, isAvailable: false, unavailableReason: "Restocking. Back Monday" } : g)) },
};

export const PlayInFlight: Story = { name: "Play in flight", args: { playingGameId: "plinko-01" } };

export const Loading: Story = {
    args: { isLoading: true },
    parameters: { docs: { description: { story: "No placeholder cards: the area stays empty until the games arrive, then the cards fade in." } } },
};

export const Error: Story = { args: { error: "We couldn't reach the Arcade. Try again in a moment." } };

export const Mobile: Story = { globals: { viewport: { value: "mobile2", isRotated: false } } };
