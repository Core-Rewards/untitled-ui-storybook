import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trophy01 } from "@untitledui/icons";
import { contentCategories } from "./content-card-categories";
import { ContentCard } from "./content-card";
import type { ContentCardImage, ContentCardProps, ContentCategoryKey } from "./content-card-types";

// ─── Sample Data ─────────────────────────────────────────────────────────────

const unsplash = (id: string, alt: string): ContentCardImage => ({
    src: `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop`,
    alt,
});

const images = {
    team: unsplash("1522071820081-009f0129c71c", "A team working together on laptops around a wooden table"),
    headphones: unsplash("1505740420928-5e560c06d30e", "Black over-ear headphones on a yellow background"),
    analytics: unsplash("1460925895917-afdab827c52f", "A laptop showing a sales analytics dashboard"),
    workshop: unsplash("1552664730-d307ca884978", "A presenter leading a workshop at a whiteboard covered in sticky notes"),
    conference: unsplash("1540575467063-178a50c2df87", "An audience seated at a conference keynote"),
    shopping: unsplash("1607082348824-0a96f2a4b9da", "Red and black shopping bags on a dark background"),
};

const cards: Record<ContentCategoryKey, ContentCardProps> = {
    news: {
        category: "news",
        title: "Q4 incentive program launches October 1",
        description: "Earn points on every qualifying sale through December 31. Top performers in each region will also qualify for the year-end President's Club trip.",
        href: "#",
        image: images.team,
        date: "2026-09-30",
    },
    "new-product": {
        category: "new-product",
        title: "Wireless headphones now in the rewards catalog",
        description: "Noise-cancelling, 30-hour battery life, and available in three colors. Redeem your points for the newest addition to the electronics collection.",
        href: "#",
        image: images.headphones,
        date: "2026-09-24",
    },
    resource: {
        category: "resource",
        title: "2026 sales playbook: positioning the full lighting portfolio",
        description: "A field guide to discovery questions, competitive comparisons and bundling strategies that help reps grow average order size.",
        href: "#",
        image: images.analytics,
        date: "2026-09-18",
    },
    video: {
        category: "video",
        title: "Training: how to submit a sale in under a minute",
        description: "Walk through the sales submission flow step by step, from uploading an invoice to tracking your points once the claim is approved.",
        href: "#",
        image: images.workshop,
        date: "2026-09-12",
    },
    event: {
        category: "event",
        title: "Partner Summit 2026: registration is open",
        description: "Two days of product previews, hands-on sessions and networking with the teams behind the brands you sell. Seats are limited.",
        href: "#",
        image: images.conference,
        date: "2026-09-05",
    },
    promotion: {
        category: "promotion",
        title: "Double points on accessories all month",
        description: "Every accessory sale earns twice the usual points through October 31. No sign-up needed. The bonus is applied automatically.",
        href: "#",
        image: images.shopping,
        date: "2026-09-01",
    },
};

const TwoUp = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-8 md:grid-cols-2">{children}</div>;

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/ContentCard",
    component: ContentCard,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        variant: { control: "inline-radio", options: ["default", "featured"] },
        category: { control: "select", options: Object.keys(contentCategories) },
        headingLevel: { control: "inline-radio", options: [2, 3, 4] },
        date: { control: "text" },
    },
    decorators: [
        (Story) => (
            <div className="mx-auto max-w-[1120px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ContentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Variants ─────────────────────────────────────────────────────────────────

/** The standard card, sized for a two-column grid. */
export const Default: Story = {
    args: cards.news,
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
        </TwoUp>
    ),
};

/**
 * Spans the full page width with the image beside the content. Below 768px of
 * card width it stacks like the default card.
 */
export const Featured: Story = {
    args: { ...cards.resource, variant: "featured" },
};

/** Video cards overlay a play button on the image and default to "Watch now". */
export const Video: Story = {
    args: cards.video,
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
        </TwoUp>
    ),
};

// ─── No image ─────────────────────────────────────────────────────────────────

/**
 * Without an image, the media area keeps its size and shows the category icon
 * on a tinted panel, so mixed grids stay aligned.
 */
export const NoImage: Story = {
    args: { ...cards.news, image: undefined },
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
            <ContentCard {...cards.news} />
        </TwoUp>
    ),
};

export const FeaturedNoImage: Story = {
    args: { ...cards.event, variant: "featured", image: undefined },
};

// ─── Categories ───────────────────────────────────────────────────────────────

/** Every category preset, with and without an image. */
export const AllCategories: Story = {
    args: cards.news,
    render: () => (
        <div className="flex flex-col gap-8">
            <TwoUp>
                {Object.values(cards).map((card) => (
                    <ContentCard key={card.title} {...card} />
                ))}
            </TwoUp>
            <TwoUp>
                {Object.values(cards).map((card) => (
                    <ContentCard key={card.title} {...card} image={undefined} />
                ))}
            </TwoUp>
        </div>
    ),
};

/** Categories are data, so a new one needs no component changes. */
export const CustomCategory: Story = {
    args: {
        category: { label: "Recognition", color: "warning", icon: Trophy01, ctaLabel: "See the winners" },
        title: "Congratulations to our Q3 top performers",
        description: "Twelve reps across four regions hit every tier of the Q3 goal. See who made the list and how they did it.",
        href: "#",
        date: "2026-09-28",
    },
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
        </TwoUp>
    ),
};

// ─── Layout ───────────────────────────────────────────────────────────────────

/** How the cards are meant to be used together: one featured card above a two-column grid. */
export const ContentLibrary: Story = {
    args: cards.resource,
    render: () => (
        <div className="flex flex-col gap-8">
            <ContentCard {...cards.resource} variant="featured" headingLevel={2} />
            <TwoUp>
                <ContentCard {...cards.news} />
                <ContentCard {...cards.video} />
                <ContentCard {...cards.promotion} image={undefined} />
                <ContentCard {...cards["new-product"]} />
                <ContentCard {...cards.event} />
                <ContentCard {...cards.news} 
                    title="Updated redemption limits for gift cards"
                    description="Starting November 1, you can redeem up to 250,000 points in gift cards per month, up from 100,000."
                    image={undefined}
                    date="2026-08-27"
                />
            </TwoUp>
        </div>
    ),
};

// ─── Edge cases ───────────────────────────────────────────────────────────────

/** Long titles and descriptions are truncated so cards in a row keep their rhythm. */
export const LongContent: Story = {
    args: {
        ...cards.resource,
        title: "The complete 2026 guide to positioning the full lighting portfolio across commercial, industrial and residential projects of every size",
        description:
            "This guide covers discovery questions for every buyer type, side-by-side competitive comparisons, bundling strategies that grow average order size, how to handle the five most common objections, and a worked example of a multi-site retrofit proposal from first call to signed contract.",
    },
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
            <ContentCard {...cards.news} />
        </TwoUp>
    ),
};

/** Only the required props: a category, a title and a link. */
export const Minimal: Story = {
    args: {
        category: "resource",
        title: "Program terms and conditions",
        href: "#",
    },
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
        </TwoUp>
    ),
};

/** External links open in a new tab and say so to screen readers. */
export const ExternalLink: Story = {
    args: { ...cards.resource, href: "https://example.com", external: true, ctaLabel: "Download PDF" },
    render: (args) => (
        <TwoUp>
            <ContentCard {...args} />
        </TwoUp>
    ),
};
