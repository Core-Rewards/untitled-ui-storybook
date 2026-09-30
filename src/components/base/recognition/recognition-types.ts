import type { FC } from "react";

export type RecognitionParticipant = {
    id: string;
    name: string;
    /** Job title, shown beside the name in search results (e.g. "Store Manager"). */
    title?: string;
    /** Department or location, shown after the title (e.g. "Dallas"). */
    department?: string;
};

export type RecognitionImage = {
    src: string;
    /** Describe the image, or pass `""` when it is decorative. */
    alt: string;
};

/** A reason for recognition, usually one of the company's values. */
export type RecognitionValue = {
    id: string;
    name: string;
    /** One line explaining the value (e.g. "Goes above and beyond for customers"). */
    description?: string;
    /** Defaults to a star. */
    icon?: FC<{ className?: string }>;
    /** Shown when the value is selected, and in the preview of what the recipient receives. */
    image?: RecognitionImage;
    /** Suggested award. Selecting the value fills in this amount, and the sender can change it. */
    points?: number;
};

export type RecognitionBudget = {
    /** Points the manager can still send. */
    available: number;
    /** Context shown under the balance (e.g. "Q4 budget · resets Dec 31"). */
    periodLabel?: string;
};

export type RecognitionSubmission = {
    recipient: RecognitionParticipant;
    value: RecognitionValue;
    points: number;
    message: string;
    /** Whether to email the recipient. */
    sendEmail: boolean;
};

/** A preset amount, or a custom amount as typed. */
export type PointsSelection = { kind: "preset"; points: number } | { kind: "custom"; input: string } | null;

export interface ManagerRecognitionProps {
    /** Shown as "From …" in the preview. */
    senderName: string;
    budget: RecognitionBudget;
    values: RecognitionValue[];
    /** People to choose from, filtered as the manager types. Use `onSearchParticipants` instead for large directories. */
    participants?: RecognitionParticipant[];
    /** Searches on the server as the manager types. Takes precedence over `participants`. */
    onSearchParticipants?: (query: string, signal: AbortSignal) => Promise<RecognitionParticipant[]>;
    /** Starts with this person selected, such as when opened from their profile. */
    defaultRecipient?: RecognitionParticipant;
    /** Preset point amounts. Defaults to 100, 250, 500 and 1,000. */
    pointOptions?: number[];
    /** Lets the manager enter any amount. Defaults to `true`. */
    allowCustomPoints?: boolean;
    /** Smallest award. Defaults to 1. */
    minPoints?: number;
    /** Largest single award, on top of the budget limit. */
    maxPoints?: number;
    /** Defaults to 500. */
    messageMaxLength?: number;
    /**
     * Sends the recognition. Return a promise to show a loading state; if it rejects, the form
     * keeps what was entered and shows an error. Update `budget` once the send succeeds.
     */
    onSend: (submission: RecognitionSubmission) => Promise<void> | void;
    /** Defaults to "Recognize an associate". */
    title?: string;
    description?: string;
    className?: string;
}
