import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LifeBuoy01, Settings01 } from "@untitledui/icons";
import { AppHeader } from "./app-header";
import { AppShell } from "./app-shell";
import { sampleAccountMenuItems, sampleAccountName, sampleBrand, sampleHeaderActions, sampleNavItems } from "./app-shell-sample-data";
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
                    "The participant site frame, matching the AdminUI participant portal: a 280px sidebar with logo, account card (name, points and account menu) and navigation, a slim utility header with cart and notification buttons, and a scrolling content area. Below `lg` a top bar replaces both, and its menu button opens the sidebar as a drawer.",
            },
        },
    },
    tags: ["autodocs"],
    args: {
        sidebar: {
            brand: sampleBrand,
            items: sampleNavItems,
            activeId: "dashboard",
            accountName: sampleAccountName,
            pointsBalance: 34449844,
            accountMenuItems: sampleAccountMenuItems,
            onSignOut: fn(),
        },
        header: { actions: sampleHeaderActions },
        children: (
            <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-secondary text-sm text-quaternary">
                Page content
            </div>
        ),
    },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {};

/** At phone width a top bar replaces the sidebar and header; tap the menu button to open the drawer. */
export const Mobile: Story = {
    globals: { viewport: { value: "mobile2", isRotated: false } },
};

/** Links pinned to the bottom of the sidebar with `footerItems`. */
export const WithFooterLinks: Story = {
    args: {
        sidebar: {
            ...meta.args.sidebar,
            footerItems: [
                { id: "support", label: "Support", href: "#", icon: LifeBuoy01 },
                { id: "settings", label: "Settings", href: "#", icon: Settings01 },
            ],
        },
    },
};

export const Sidebar: Story = {
    render: (args) => (
        <div className="h-dvh w-fit">
            <AppSidebar {...args.sidebar} activeId="suppliers" />
        </div>
    ),
};

/** Counts over 99 cap at `99+`. */
export const Header: Story = {
    render: () => <AppHeader actions={sampleHeaderActions.map((action) => (action.id === "cart" ? { ...action, badge: 120 } : action))} />,
};
