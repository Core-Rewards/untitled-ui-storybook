import type { Meta, StoryObj } from "@storybook/react-vite";
import { PromotionCarousel } from "./promotion-carousel";
import { STORY_TODAY, samplePromotions } from "./promotion-sample-data";

const meta = {
    title: "Base/PromotionCarousel",
    component: PromotionCarousel,
    parameters: { layout: "padded" },
    tags: ["autodocs"],
    argTypes: {
        onEnroll: { action: "onEnroll" },
        onAddToCalendar: { action: "onAddToCalendar" },
        layout: { control: "inline-radio", options: ["paged-grid", "centered-peek"] },
    },
    args: {
        promotions: samplePromotions,
        title: "Promotions for you",
        viewAllHref: "#all-promotions",
        now: STORY_TODAY,
    },
} satisfies Meta<typeof PromotionCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * SlideCarousel's paged grid with promotion cards: three across on desktop,
 * paging a row at a time, ending on a View all tile. Sorted so what ends
 * soonest comes first, with ended promotions left out.
 */
export const PagedGrid: Story = {
    args: { layout: "paged-grid" },
};

/** SlideCarousel's centred peek: one card in focus, neighbours either side, looping. */
export const CenteredPeek: Story = {
    args: { layout: "centered-peek" },
};

/** The order you pass in, ended promotions included. */
export const CuratedOrder: Story = {
    args: { layout: "paged-grid", sortByUrgency: false, hideClosed: false },
};

export const Loading: Story = {
    args: { isLoading: true },
};

export const Empty: Story = {
    args: { promotions: [] },
};
