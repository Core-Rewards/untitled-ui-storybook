import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LifeBuoy01, Settings01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { AppHeader } from "./app-header";
import { AppShell } from "./app-shell";
import { sampleAccountMenuItems, sampleAccountName, sampleBrand, sampleHeaderActions, sampleNavItems } from "./app-shell-sample-data";
import { AppSidebar } from "./app-sidebar";
import type { PointsAward } from "./points-gain";

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

const PointsWonDemo = (args: Story["args"]) => {
    const [points, setPoints] = useState(34449844);
    const [award, setAward] = useState<PointsAward | null>(null);
    const win = (amount: number) => {
        setPoints((p) => p + amount);
        setAward((a) => ({ id: (a?.id ?? 0) + 1, amount }));
    };
    return (
        <AppShell {...meta.args} {...args} sidebar={{ ...meta.args.sidebar, pointsBalance: points, pointsAward: award }}>
            <div className="flex flex-col gap-4">
                <h1 className="text-display-xs font-semibold text-primary">Points won</h1>
                <p className="max-w-xl text-md text-tertiary">
                    Pass `pointsAward` with the new `pointsBalance`. A "+N" pill flashes next to the balance, counts up, holds, then fades while the balance rolls up.
                    The Rewards Arcade sends one award per finished play or batch of plays.
                </p>
                <div className="flex gap-3">
                    <Button size="md" onClick={() => win(250)}>
                        Win 250
                    </Button>
                    <Button size="md" color="secondary" onClick={() => win(1350)}>
                        Win 1,350
                    </Button>
                </div>
            </div>
        </AppShell>
    );
};

/** "+N" counter next to the balance when points are won (used by the Rewards Arcade). */
export const PointsWon: Story = {
    name: "Points won counter",
    render: (args) => <PointsWonDemo {...args} />,
};
