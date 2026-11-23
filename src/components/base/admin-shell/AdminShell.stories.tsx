import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { sampleBrand } from "@/components/base/app-shell/app-shell-sample-data";
import { adminFooterItems, adminNavItems, adminProgramMenuItems, adminProgramName, surveyAiSuggestions } from "@/components/survey/admin/admin-sample-data";
import { AdminShell } from "./admin-shell";

const meta = {
    title: "Base/AdminShell",
    component: AdminShell,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The admin frame, matching the AdminUI admin layout. It reuses the participant `AppSidebar` (logo, account card, navigation, Support and Settings). In admin the account card is the **program switcher**: the current program, with the others in its menu. The AI assistant drawer (ported from AdminUI) opens from the sparkles button pinned top-right. Below `lg` a top bar holds the AI and menu buttons and the sidebar opens as a drawer.",
            },
        },
    },
    tags: ["autodocs"],
    args: {
        sidebar: {
            brand: sampleBrand,
            items: adminNavItems,
            footerItems: adminFooterItems,
            activeId: "surveys",
            accountName: adminProgramName,
            accountMenuItems: adminProgramMenuItems,
            onSignOut: fn(),
        },
        aiSuggestions: surveyAiSuggestions,
        children: (
            <div className="flex flex-col gap-6">
                <h1 className="text-display-xs font-semibold text-primary">Page title</h1>
                <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-secondary text-sm text-quaternary">
                    Page content
                </div>
            </div>
        ),
    },
} satisfies Meta<typeof AdminShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The AI assistant drawer open, as AdminUI shows it by default. */
export const AiDrawerOpen: Story = { name: "AI drawer open", args: { defaultAiOpen: true } };

export const Phone: Story = { globals: { viewport: { value: "phone", isRotated: false } } };
