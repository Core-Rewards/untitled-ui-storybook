import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AdminDemoShell } from "../stories/admin-demo-shell";
import { sampleSurveyList, templateLibrary } from "./admin-sample-data";
import { NewSurveyPage } from "./new-survey-page";

const meta = {
    title: "Survey/Admin/New survey",
    component: NewSurveyPage,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "New survey (A2) as a page in the admin shell, with the template library merged in.",
                    "",
                    "- **Survey or quiz** first. It's fixed once created, and the templates and copies below follow it.",
                    "- **Start blank**, pick a **template** (search, filter by category; the three starters come first), or **copy a survey** this program has run (questions, logic, settings and translations, never responses).",
                    "- The right panel previews the choice (a template's questions, or the survey being copied), suggests a name until the admin types their own, and sets the base language.",
                    "- **Create survey** returns a `NewSurveyRequest`; the builder opens on the Questions step. **Cancel** and the breadcrumb go back to the list.",
                ].join("\n"),
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <AdminDemoShell>
                <Story />
            </AdminDemoShell>
        ),
    ],
    args: {
        templates: templateLibrary,
        surveys: sampleSurveyList,
        onCreate: fn(),
        onCancel: fn(),
    },
} satisfies Meta<typeof NewSurveyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Blank: Story = { args: { defaultSelection: "blank" } };

export const CopyASurvey: Story = { name: "Copy a survey", args: { defaultSelection: "duplicate:srv-2026-satisfaction" } };

/** A program with no surveys yet: the copy section is hidden. */
export const FirstSurvey: Story = { name: "First survey (nothing to copy)", args: { surveys: [] } };

/** Quiz chosen: quiz templates (right answers marked) and quizzes this program has run. */
export const Quiz: Story = { args: { defaultKind: "quiz" } };

export const Phone: Story = { globals: { viewport: { value: "phone", isRotated: false } } };
