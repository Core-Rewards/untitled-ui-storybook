import type { Decorator } from "@storybook/react-vite";
import { AdRewardsTheme } from "./ad-rewards-theme";

/** Storybook decorator: add to a meta's `decorators` to show its stories in AD green. */
export const withAdRewardsTheme: Decorator = (Story) => (
    <AdRewardsTheme>
        <Story />
    </AdRewardsTheme>
);
