import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { withAdRewardsTheme } from "./with-ad-rewards-theme";
import { AdRewardsHomePage } from "./home-page";

const meta = {
    title: "AD Rewards/Home",
    component: AdRewardsHomePage,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The AD Rewards participant home page, rebuilt on the app shell with library components: QuizCard for the Question of the Week, featured ContentCards, the PromotionCarousel, SupplierShowcase and the ScratchWinCard. Only the home page is built, so navigation and card links are static. The account menu and notifications drawer work.",
            },
        },
    },
    decorators: [withAdRewardsTheme],
    args: {
        now: new Date(2026, 10, 11),
        onSignOut: fn(),
    },
} satisfies Meta<typeof AdRewardsHomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};

/** At phone width the sidebar becomes a drawer behind the menu button. */
export const Mobile: Story = {
    globals: { viewport: { value: "mobile2", isRotated: false } },
};
