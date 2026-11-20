import type { Meta, StoryObj } from "@storybook/react-vite";
import { getSatisfactionSurvey, sampleQuestions } from "../survey-sample-data";
import { Frame, QuestionPlayground } from "../stories/survey-story-helpers";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { SurveyQuestion } from "./survey-question";

const en = getSatisfactionSurvey("en");
const fr = getSatisfactionSurvey("fr");
const byId = (id: string, survey = en) => survey.questions.find((q) => q.id === id)!;

const meta = {
    title: "Survey/Questions",
    component: QuestionPlayground,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component: [
                    "One set of question components for the participant flow and the builder canvas. Each story shows the phone layout (390px) beside the desktop layout.",
                    "",
                    "Layout follows the **width the question is given** (container queries on `@container/survey`), not the window, so a phone frame inside the desktop builder gets the phone layout.",
                    "",
                    "- Single choice, yes/no, rating, opinion scale and NPS **auto-advance** after a tap (`onCommit`). The rest use Next.",
                    "- Desktop shortcuts: **A–Z** to pick, **number keys** for scales (type 1 then 0 for 10), **Enter** to continue. Shortcuts are off in the phone frame.",
                    "- Selection shows as a filled key, heavier border and a check, never colour alone. Rows are at least 48px tall.",
                    "- The `value` panel shows the answer shape the platform stores for each type.",
                ].join("\n"),
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        size: { control: "inline-radio", options: ["both", "phone", "desktop"] },
        locale: { control: "inline-radio", options: ["en", "fr"] },
        question: { control: "object" },
        initialValue: { control: "object" },
    },
    args: {
        size: "both",
        locale: "en",
        question: byId("q1"),
    },
} satisfies Meta<typeof QuestionPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── From the wireframes ─────────────────────────────────────────────────────

/** Q1 from the wireframes: opinion scale 1 to 5 with end labels. Auto-advances. */
export const OpinionScale: Story = { args: { question: byId("q1") } };

/** NPS: two rows (0–5, 6–10) on phones, one row of 11 on desktop. */
export const NPS: Story = { args: { question: byId("q3") } };

/** Multi-select ("Choose all that apply") with two picked, as in the wireframes. Uses Next. */
export const MultipleChoiceMulti: Story = {
    name: "Multiple choice (pick any)",
    args: { question: byId("q4"), initialValue: { selected: ["earn", "redeem"] } },
};

/** Long text with a character counter. Cmd/Ctrl + Enter continues. */
export const LongText: Story = { args: { question: byId("q5") } };

// ─── Every other type ────────────────────────────────────────────────────────

/** Single choice auto-advances. Picking "Other" opens a text field instead. */
export const MultipleChoiceSingle: Story = { name: "Multiple choice (pick one, with Other)", args: { question: sampleQuestions.multiple_choice } };

/** Searchable, for long lists. */
export const Dropdown: Story = { args: { question: sampleQuestions.dropdown } };

export const YesNo: Story = { name: "Yes / No", args: { question: sampleQuestions.yes_no } };

/** Stars by default; hearts and thumbs are options. Filled vs outline shows the choice. */
export const Rating: Story = { args: { question: sampleQuestions.rating } };

export const RatingHearts: Story = {
    name: "Rating (hearts, 1 to 7)",
    args: { question: { ...sampleQuestions.rating, scale: 7, icon: "heart" } as typeof sampleQuestions.rating },
};

/** 1 to 7 agreement scale. */
export const OpinionScaleSeven: Story = { name: "Opinion scale (1 to 7)", args: { question: sampleQuestions.opinion_scale } };

/** Drag (pointer, touch or keyboard) or use the arrows. The shown order counts as the answer. */
export const Ranking: Story = { args: { question: sampleQuestions.ranking } };

/** Grid on desktop; one row at a time on phones, moving on after each pick. */
export const Matrix: Story = { args: { question: sampleQuestions.matrix } };

/** Enter continues. */
export const ShortText: Story = { args: { question: sampleQuestions.short_text } };

/** Min/max with a unit. Accepts a French decimal comma. */
export const NumberQuestion: Story = { name: "Number", args: { question: sampleQuestions.number } };

export const DateQuestion: Story = { name: "Date", args: { question: sampleQuestions.date } };

/** Drop or choose files; type and size are checked. Files are listed, not uploaded, in Storybook. */
export const FileUpload: Story = { args: { question: sampleQuestions.file_upload } };

/** A message between questions. No answer, just Continue. */
export const Statement: Story = { args: { question: sampleQuestions.statement } };

// ─── States ──────────────────────────────────────────────────────────────────

/** A required question after the participant tried to continue without answering. Inline, never a dialog. */
export const RequiredMessage: Story = { name: "Required message", args: { question: byId("q3"), showValidation: true } };

/** Min/max picks: the fourth option is disabled once three are chosen. */
export const MaxPicks: Story = {
    name: "Multiple choice (max 3)",
    args: {
        question: { ...byId("q4"), description: "Choose up to 3.", maxPicks: 3 } as ReturnType<typeof byId>,
        initialValue: { selected: ["earn", "redeem", "promotions"] },
    },
};

/** The wireframe questions in French. Question and option IDs match English, so answers share export columns. */
export const French: Story = { name: "French (NPS)", args: { question: byId("q3", fr), locale: "fr" } };

// ─── Gallery ─────────────────────────────────────────────────────────────────

/** Every question type at desktop width, in type-picker order. */
export const AllTypes: Story = {
    name: "All types",
    parameters: { docs: { disable: true } },
    render: () => (
        <SurveyLocaleProvider locale="en">
            <div className="flex flex-col gap-8">
                {Object.values(sampleQuestions).map((q, i) => (
                    <Frame key={q.id} size="desktop" label={q.type.replace("_", " ")}>
                        <SurveyQuestion question={q} number={i + 1} value={undefined} onChange={() => {}} />
                    </Frame>
                ))}
            </div>
        </SurveyLocaleProvider>
    ),
};
