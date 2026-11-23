import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AdminDemoShell } from "../stories/admin-demo-shell";
import { getBuilderSurvey, getBuilderTranslations } from "./builder-sample-data";
import { SurveyBuilder } from "./survey-builder";

const meta = {
    title: "Survey/Admin/Builder/Questions step",
    component: SurveyBuilder,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "Step 1 of the survey builder (A3–A4), in the admin shell with the sidebar collapsed to a rail for room.",
                    "",
                    "- **Outline (left):** intro and thank-you pinned, questions with type, Required and a branch mark for logic. Questions only reached through a rule are indented with “Only if Q1 is 1 or 2”. Drag (or keyboard drag) to reorder.",
                    "- **Canvas (centre):** the participant's question, edited in place. Dashed underlines mark editable text; choice options take Enter to add, Backspace to remove and paste to split a list. Desktop / Mobile switches the frame.",
                    "- **Settings (right):** type (keeps compatible content, asks before dropping the rest), Required, Description and the options for the type. The **Logic** tab writes rules as sentences and checks every question can be reached.",
                    "- **Add question:** the button, the “+” between questions, or **/** anywhere opens the type picker (search, preview, Question bank). The new question is selected with the cursor in its text, the FR counter grows, and an **Undo** toast confirms.",
                    "- Every edit autosaves; **Undo** (or Ctrl/Cmd+Z) steps back. **Preview** runs the real participant flow in test mode.",
                ].join("\n"),
            },
        },
    },
    decorators: [
        (Story) => (
            <AdminDemoShell sidebarMode="rail" fullBleed>
                <Story />
            </AdminDemoShell>
        ),
    ],
    args: {
        survey: getBuilderSurvey(),
        translations: getBuilderTranslations(),
        programName: "Advisor Advantage",
        onChange: fn(),
        onExit: fn(),
        onStepChange: fn(),
        onOpenTranslations: fn(),
    },
} satisfies Meta<typeof SurveyBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A3: Q1 selected, its settings on the right. */
export const Questions: Story = {};

/** A4: the Logic tab on Q1, with “If answer is any of 1, 2 → go to Q2”. */
export const Logic: Story = { args: { initialPanelTab: "logic" } };

/** A3b: the add-question picker, open from the Add question button. */
export const AddQuestion: Story = { name: "Add question picker", args: { initialPickerOpen: true } };

/** The canvas in its phone frame. */
export const MobileCanvas: Story = { name: "Mobile canvas", args: { initialFrame: "mobile" } };

/** A multiple-choice question selected, to edit options in place. */
export const EditingOptions: Story = { name: "Editing options", args: { initialSelectedId: "q4" } };
