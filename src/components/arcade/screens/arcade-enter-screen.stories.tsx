import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ArcadeEnterScreen } from "./arcade-enter-screen";

const enterMeta = {
    title: "Arcade/Screens/Enter",
    component: ArcadeEnterScreen,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Animated entry screen (from the *Enter the Arcade* comp). Letters slam in, background layers drift, the CTA pulses. Pressing **Enter the Arcade** zooms out, then fires `onEnter`. Honors `prefers-reduced-motion`.",
            },
        },
    },
    args: {
        tokenBalance: 3,
        eyebrow: "Welcome to your rewards",
        isLoading: false,
        reducedMotion: false,
        onEnter: fn(),
        onNavigate: fn(),
    },
} satisfies Meta<typeof ArcadeEnterScreen>;

export default enterMeta;
type EnterStory = StoryObj<typeof enterMeta>;

export const Default: EnterStory = {};

export const NoTokens: EnterStory = { name: "No tokens", args: { tokenBalance: 0 } };

export const Loading: EnterStory = { args: { isLoading: true, tokenBalance: undefined } };

export const ReducedMotion: EnterStory = { name: "Reduced motion", args: { reducedMotion: true } };

export const Mobile: EnterStory = { globals: { viewport: { value: "mobile2", isRotated: false } } };
