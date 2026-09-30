import type { PointsSelection, RecognitionParticipant } from "./recognition-types";

export const DEFAULT_POINT_OPTIONS = [100, 250, 500, 1000];

const numberFormatter = new Intl.NumberFormat("en-US");

/** "1,000" */
export const formatPoints = (points: number) => numberFormatter.format(points);

/** "1,000 points", or "1 point". */
export const pointsLabel = (points: number) => `${formatPoints(points)} ${points === 1 ? "point" : "points"}`;

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** "Store Manager · Dallas" */
export const participantSupportingText = (participant: RecognitionParticipant) =>
    [participant.title, participant.department].filter(Boolean).join(" · ") || undefined;

/**
 * The text the combobox puts in its input once a participant is selected. It matches how
 * `SelectItem` builds its `textValue`, so the selected person can be recognized in `onInputChange`.
 */
export const participantTextValue = (participant: RecognitionParticipant) => {
    const supportingText = participantSupportingText(participant);

    return supportingText ? `${participant.name} ${supportingText}` : participant.name;
};

/** Digits only, so "1,500" and "1500 pts" both read as 1500. */
export const sanitizePointsInput = (input: string) => input.replace(/\D/g, "").slice(0, 9);

export const resolvePoints = (selection: PointsSelection): number | null => {
    if (!selection) return null;
    if (selection.kind === "preset") return selection.points;

    return selection.input ? Number(selection.input) : null;
};

/**
 * Picks how a value's suggested points should be shown: as the matching preset when it is one
 * the manager can afford, otherwise as a custom amount, so any over-budget error appears in an
 * editable field.
 */
export const selectionForSuggestedPoints = (points: number, options: number[], available: number, allowCustom: boolean): PointsSelection => {
    if (options.includes(points) && points <= available) return { kind: "preset", points };
    if (allowCustom) return { kind: "custom", input: String(points) };

    return null;
};

type PointsLimits = { available: number; min: number; max?: number };

export const validatePoints = (points: number | null, { available, min, max }: PointsLimits): string | null => {
    if (points === null) return null;
    if (points > available) return `Exceeds your ${pointsLabel(available)} available.`;
    if (max !== undefined && points > max) return `The most you can send at once is ${pointsLabel(max)}.`;
    if (points < min) return `Send at least ${pointsLabel(min)}.`;

    return null;
};
