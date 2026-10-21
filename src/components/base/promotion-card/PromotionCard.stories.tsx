import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PromotionCard, PromotionCardSkeleton, PromotionViewAllCard } from "./promotion-card";
import type { PromotionCardData } from "./promotion-card-types";
import { STORY_TODAY, promotionById, samplePromotions } from "./promotion-sample-data";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/PromotionCard",
    component: PromotionCard,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "A promotion in a carousel row or grid. The offer pill says what it pays, the countdown (worked out from the dates) says whether it is still worth acting on, and the footer swaps to an Enroll button for opt-in promotions the participant has not joined.",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="max-w-sm">
                <Story />
            </div>
        ),
    ],
    argTypes: {
        onEnroll: { action: "onEnroll" },
        onAddToCalendar: { action: "onAddToCalendar" },
        headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    },
    args: {
        promotion: promotionById("triple-points-tober"),
        now: STORY_TODAY,
    },
} satisfies Meta<typeof PromotionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Everything on: campaign image, qualifying products, earning potential, enrollment and progress. */
export const Playground: Story = {};

/** A manufacturer logo in the header instead of a photo, three days from the end. */
export const LogoHeader: Story = {
    args: { promotion: promotionById("ductless-double-down") },
};

/** No art supplied: the offer becomes the header. Opt-in and not yet joined, so Enroll leads. */
export const OfferHeaderWithEnroll: Story = {
    args: { promotion: promotionById("fast-start-bonus") },
};

/** Clicking Enroll shows a busy state, then flips the card to enrolled. */
export const EnrollFlow: Story = {
    render: (args) => {
        const [promotion, setPromotion] = useState<PromotionCardData>(promotionById("fast-start-bonus"));
        const [isEnrolling, setIsEnrolling] = useState(false);
        return (
            <PromotionCard
                {...args}
                promotion={promotion}
                isEnrolling={isEnrolling}
                onEnroll={(item) => {
                    args.onEnroll?.(item);
                    setIsEnrolling(true);
                    window.setTimeout(() => {
                        setIsEnrolling(false);
                        setPromotion((current) => ({ ...current, enrollment: { enrolled: true }, pointsEarned: 0, progress: { current: 0, target: 5, unit: "installs" } }));
                    }, 1200);
                }}
            />
        );
    },
};

/**
 * Flags. `Recommended for you` carries the reason it was picked; `New` is set by
 * the program. In a carousel, recommended promotions lead their urgency group.
 */
export const NewAndRecommended: Story = {
    args: { promotion: promotionById("holiday-5x") },
};

/**
 * The calendar button opens a menu: Google, Outlook.com and Microsoft 365 open a
 * filled-in event in a new tab, and the last item downloads an `.ics` file for
 * Apple Calendar and desktop Outlook. The event spans the promotion, shows as
 * free time, and the file version reminds at 9am on the last day.
 */
export const AddToCalendar: Story = {
    args: { promotion: promotionById("ductless-double-down") },
};

/** A custom type label (ADRX) on a promotion that has not started. */
export const Upcoming: Story = {
    args: { promotion: promotionById("adrx-fall") },
};

/** Past its end date: muted, but still linked so the participant can check what they earned. */
export const Ended: Story = {
    args: { promotion: promotionById("summer-cooling-kickoff") },
};

/** Long copy is clamped so cards in a row stay level. */
export const LongContent: Story = {
    args: {
        promotion: {
            ...promotionById("ductless-double-down"),
            name: "Ductless Double Down: the Fall Multi-Zone and Single-Zone Mini-Split Accelerator",
            description:
                "Double points on all ductless mini-split systems, including multi-zone configurations, ceiling cassettes, ducted air handlers, and every qualifying outdoor unit registered within 30 days of install through the participating distributor network.",
        },
    },
};

/** The closing tile for a row, and the loading placeholder. */
export const ViewAllAndSkeleton: Story = {
    decorators: [
        (Story) => (
            <div className="grid max-w-3xl grid-cols-2 gap-6">
                <Story />
            </div>
        ),
    ],
    render: () => (
        <>
            <PromotionCardSkeleton />
            <PromotionViewAllCard href="#all-promotions" count={samplePromotions.length} />
        </>
    ),
};
