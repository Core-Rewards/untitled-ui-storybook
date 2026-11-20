import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { getSatisfactionSurvey, getSatisfactionSurveyWithImage } from "../survey-sample-data";
import { SurveyIntro } from "./survey-intro";

const phone = { viewport: { value: "phone", isRotated: false } };

const meta = {
    title: "Survey/Participant/Intro",
    component: SurveyIntro,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Intro screen (P3 / D2) in the focused takeover. Reward first, then title, why it matters, time and question count (calculated), and a privacy line that matches the survey's anonymity setting. Desktop is two columns when there's an image; Enter starts.",
            },
        },
    },
    decorators: [
        (Story, { args }) => (
            <SurveyLocaleProvider locale={args.survey.locale}>
                <Story />
            </SurveyLocaleProvider>
        ),
    ],
    args: {
        survey: getSatisfactionSurvey("en"),
        onStart: fn(),
        onClose: fn(),
    },
} satisfies Meta<typeof SurveyIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = { globals: phone };

export const PhoneWithImage: Story = { name: "Phone, with image", globals: phone, args: { survey: getSatisfactionSurveyWithImage("en") } };

export const Desktop: Story = {};

export const DesktopWithImage: Story = { name: "Desktop, with image", args: { survey: getSatisfactionSurveyWithImage("en") } };

/** Identified surveys say answers are linked to the account. */
export const Identified: Story = { globals: phone, args: { survey: getSatisfactionSurvey("en", { anonymity: "identified" }) } };

export const ArcadeSpinsReward: Story = {
    name: "Arcade spins reward",
    globals: phone,
    args: { survey: getSatisfactionSurvey("en", { reward: { type: "arcade_spins", amount: 2 } }) },
};

export const NoReward: Story = { name: "No reward", globals: phone, args: { survey: getSatisfactionSurvey("en", { reward: undefined }) } };

export const French: Story = { globals: phone, args: { survey: getSatisfactionSurvey("fr") } };
