import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ConciergeCta } from "./concierge-cta";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/ConciergeCta",
    component: ConciergeCta,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    'Rewards Concierge call to action, built on Untitled UI\'s cta-split-image-04. Clicking the email copies it to the clipboard, swaps the icon to a check and shows a "Copied" notification, which is also announced to screen readers.',
            },
        },
    },
    tags: ["autodocs"],
    args: {
        headline: "Looking for something special?",
        description: "Work one-on-one with a rewards expert to track down exactly what you want.",
        ctaLabel: "Talk to a Rewards Concierge at",
        email: "concierge@corerewards.com",
        image: {
            src: "https://coreperformancefiles.blob.core.windows.net/coreperformancefiles/images/platform/image_concierge_1920x1080.jpg",
            alt: "A Rewards Concierge helping a participant",
        },
        copiedDuration: 2000,
        onCopy: fn(),
    },
    argTypes: {
        copiedDuration: { control: { type: "number", min: 500, step: 500 } },
    },
} satisfies Meta<typeof ConciergeCta>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Click the email to copy it. */
export const RewardsConcierge: Story = {};
