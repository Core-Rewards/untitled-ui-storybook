import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppHeader } from "./app-header";
import { AppShell } from "./app-shell";
import { sampleAccountMenuItems, sampleBrand, sampleHeaderActions, sampleNavItems } from "./app-shell-sample-data";
import { AppSidebar } from "./app-sidebar";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/AppShell",
    component: AppShell,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The participant site frame: sidebar with points balance and navigation, a header with notification, cart and account controls, and a scrolling content area. Below `lg` the sidebar moves into a drawer opened from the header's menu button.",
            },
        },
    },
    tags: ["autodocs"],
    args: {
        sidebar: { brand: sampleBrand, items: sampleNavItems, activeId: "dashboard", pointsBalance: 34449844 },
        header: { actions: sampleHeaderActions, accountMenuItems: sampleAccountMenuItems },
        children: (
            <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-secondary text-sm text-quaternary">Page content</div>
        ),
    },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {};

/** At phone width the sidebar is a drawer; tap the menu button to open it. */
export const Mobile: Story = {
    globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const Sidebar: Story = {
    render: (args) => (
        <div className="h-dvh">
            <AppSidebar {...args.sidebar} activeId="suppliers" />
        </div>
    ),
};

/** Counts over 99 cap at `99+`. */
export const Header: Story = {
    render: (args) => (
        <AppHeader
            {...args.header}
            actions={sampleHeaderActions.map((action) => (action.id === "cart" ? { ...action, badge: 120 } : action))}
        />
    ),
};
