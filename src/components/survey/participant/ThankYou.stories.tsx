import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SurveyLocaleProvider } from "../survey-locale-provider";
import { getSatisfactionSurvey } from "../survey-sample-data";
import { SurveyThankYou } from "./survey-thank-you";

const en = getSatisfactionSurvey("en");
const fr = getSatisfactionSurvey("fr");
const phone = { viewport: { value: "phone", isRotated: false } };

const meta = {
    title: "Survey/Participant/Thank-you",
    component: SurveyThankYou,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Thank-you with the reward already credited (P7 / D5). A short check animation and count-up, both skipped for reduced motion. No new-balance line, per the handoff. Sweepstakes entries and arcade spins use the same pattern with their own icon.",
            },
        },
    },
    decorators: [
        (Story, { parameters }) => (
            <SurveyLocaleProvider locale={parameters.locale ?? "en"}>
                <Story />
            </SurveyLocaleProvider>
        ),
    ],
    args: {
        surveyTitle: en.title,
        settings: en.thankYou,
        reward: { type: "points", amount: 500 },
        onAction: fn(),
    },
} satisfies Meta<typeof SurveyThankYou>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = { globals: phone };

export const Desktop: Story = {};

export const Sweepstakes: Story = { globals: phone, args: { reward: { type: "sweepstakes", amount: 3 } } };

export const ArcadeSpins: Story = { name: "Arcade spins", globals: phone, args: { reward: { type: "arcade_spins", amount: 2 } } };

export const NoReward: Story = { name: "No reward", globals: phone, args: { reward: undefined } };

export const French: Story = { globals: phone, parameters: { locale: "fr" }, args: { surveyTitle: fr.title, settings: fr.thankYou } };
