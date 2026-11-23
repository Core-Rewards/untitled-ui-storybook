import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { useSurveyCopy } from "../survey-context";
import { getAnswerError } from "../survey-logic";
import { getSatisfactionSurvey, sampleQuestions } from "../survey-sample-data";
import type { AnswerValue } from "../survey-types";
import { SurveyQuestionScreen } from "./survey-question-screen";
import type { SurveyQuestionScreenProps } from "./survey-question-screen";

const survey = getSatisfactionSurvey("en");
const q = (id: string) => survey.questions.find((x) => x.id === id)!;
const phone = { viewport: { value: "phone", isRotated: false } };

/** Holds the answer so the screen is interactive; Next validates like the player does. */
const Interactive = (args: SurveyQuestionScreenProps) => {
    const { copy } = useSurveyCopy();
    const [value, setValue] = useState<AnswerValue | undefined>(args.value);
    const [message, setMessage] = useState(args.message);
    return (
        <SurveyQuestionScreen
            {...args}
            value={value}
            message={message}
            onChange={(v) => {
                setValue(v);
                setMessage(undefined);
                args.onChange(v);
            }}
            onNext={() => {
                const error = getAnswerError(args.question, value, copy);
                setMessage(error);
                if (!error) args.onNext();
            }}
        />
    );
};

const meta = {
    title: "Survey/Participant/Question screen",
    component: SurveyQuestionScreen,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "One question per screen in the focused takeover (P4–P6 / D3–D4). Phones: progress bar, back, “3 of 5”, close, and Next pinned to the bottom (auto-advance types show a hint instead). Desktop: logo and survey name, “Save and exit”, OK with keyboard hints, and up/down arrows bottom-right.",
            },
        },
    },
    decorators: [
        (Story) => (
            <SurveyLocaleProvider locale="en">
                <Story />
            </SurveyLocaleProvider>
        ),
    ],
    render: (args) => <Interactive {...args} />,
    args: {
        surveyTitle: survey.title,
        question: q("q3"),
        number: 3,
        total: 5,
        progress: 0.4,
        value: undefined,
        onChange: fn(),
        onCommit: fn(),
        onNext: fn(),
        onBack: fn(),
        onExit: fn(),
    },
} satisfies Meta<typeof SurveyQuestionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** P5: NPS in two rows. Tapping a number moves on. */
export const PhoneNPS: Story = { name: "Phone · NPS", globals: phone };

/** P4: multi-select with Next pinned to the bottom. */
export const PhoneMultipleChoice: Story = {
    name: "Phone · Multiple choice",
    globals: phone,
    args: { question: q("q4"), number: 4, progress: 0.6, value: { selected: ["earn", "redeem"] } },
};

/** P6: text with a character counter. */
export const PhoneText: Story = { name: "Phone · Text", globals: phone, args: { question: q("q2"), number: 2, progress: 0.2 } };

export const PhoneMatrix: Story = { name: "Phone · Matrix", globals: phone, args: { question: sampleQuestions.matrix, number: 2, progress: 0.2 } };

/** D3: all 11 numbers in one row; type a number on the keyboard. */
export const DesktopNPS: Story = { name: "Desktop · NPS" };

/** D4: letter keys and OK with “press Enter”. */
export const DesktopMultipleChoice: Story = {
    name: "Desktop · Multiple choice",
    args: { question: q("q4"), number: 4, progress: 0.6, value: { selected: ["earn", "redeem"] } },
};

/** Tried to continue without answering. */
export const RequiredMessage: Story = { name: "Required message", globals: phone, args: { message: "Please answer this question to continue." } };

/** Last question: the button says Submit. */
export const LastQuestion: Story = { name: "Last question (Submit)", globals: phone, args: { question: q("q5"), number: 5, progress: 0.8, isLast: true } };

export const Submitting: Story = { globals: phone, args: { question: q("q5"), number: 5, progress: 0.8, isLast: true, isSubmitting: true } };
