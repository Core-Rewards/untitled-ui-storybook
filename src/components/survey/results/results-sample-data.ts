import type { SurveyAnswers, SurveyLocale } from "../survey-types";
import type { ResultResponse } from "./results-types";

/*
 * Deterministic mock responses for "2026 Program Satisfaction", shaped to match the
 * wireframe: 412 complete of 528 started (78%), Q1 41/34/15/7/3%, NPS +42, Q4 picked
 * by 398 people, Q2 answered by the 41 who rated 1 or 2. Same output every time.
 */

export const mulberry32 = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const shuffle = <T>(items: T[], rand: () => number) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/** Expand {value: count} into a shuffled list of values. */
const spread = <T>(counts: [T, number][], rand: () => number) =>
    shuffle(
        counts.flatMap(([v, n]) => Array<T>(n).fill(v)),
        rand,
    );

const NOT_WORKING = {
    en: [
        "The rewards catalog is hard to browse.",
        "Points take too long to show up after I submit a sale.",
        "I never know which promotions apply to me.",
        "Shipping on rewards is slow.",
        "The site logs me out too often.",
        "Too many emails, not enough useful ones.",
        "I can't find my order history easily.",
    ],
    fr: [
        "Le catalogue de récompenses est difficile à parcourir.",
        "Les points prennent trop de temps à apparaître.",
        "Je ne sais jamais quelles promotions s'appliquent à moi.",
        "La livraison des récompenses est lente.",
    ],
};

const MORE_VALUABLE = {
    en: [
        "More gift card options.",
        "Let me redeem points for training.",
        "A mobile app would help.",
        "Bigger bonuses during the busy season.",
        "Show me how close I am to the next tier.",
        "Faster reward delivery.",
        "Team leaderboards for our region.",
        "More regional promotions.",
    ],
    fr: ["Plus de cartes-cadeaux.", "Une application mobile serait utile.", "Des promotions régionales.", "Une livraison plus rapide."],
};

const FIRST = [
    "Jordan",
    "Priya",
    "Marcus",
    "Sofia",
    "Ethan",
    "Aisha",
    "Daniel",
    "Grace",
    "Luis",
    "Hannah",
    "Noah",
    "Chloé",
    "Mathieu",
    "Amélie",
    "Owen",
    "Leah",
];
const LAST = [
    "Lee",
    "Patel",
    "Johnson",
    "Garcia",
    "Brooks",
    "Rahman",
    "Kim",
    "Thompson",
    "Hernández",
    "Müller",
    "Tremblay",
    "Roy",
    "Gagnon",
    "Wilson",
    "Martin",
    "Côté",
];
const REGIONS = ["Ontario", "Quebec", "Prairies", "British Columbia", "Atlantic"];
const ROLES = ["Crop advisor", "Retail manager", "Sales rep", "Agronomist"];

/** A made-up identified participant. */
export const randomParticipant = (rand: () => number): NonNullable<ResultResponse["participant"]> => ({
    name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`,
    account: `AA-${String(100000 + Math.floor(rand() * 899999))}`,
    region: REGIONS[Math.floor(rand() * REGIONS.length)],
    role: ROLES[Math.floor(rand() * ROLES.length)],
});

const FEATURES = ["earn", "redeem", "promotions", "arcade", "reports"] as const;

export interface GenerateOptions {
    /** Attach participant identity (identified surveys only). */
    identified?: boolean;
    /** Responses come in between these dates. */
    from?: string;
    to?: string;
}

export const generateSatisfactionResults = ({
    identified = false,
    from = "2026-12-01T09:00:00-05:00",
    to = "2026-12-09T11:00:00-05:00",
}: GenerateOptions = {}): ResultResponse[] => {
    const rand = mulberry32(2026);
    const COMPLETE = 412;
    const PARTIAL = 116;

    const q1 = spread<number>(
        [
            [5, 169],
            [4, 140],
            [3, 62],
            [2, 29],
            [1, 12],
        ],
        rand,
    );
    const nps = spread<number>(
        [
            [10, 120],
            [9, 119],
            [8, 60],
            [7, 47],
            [6, 30],
            [5, 16],
            [4, 8],
            [3, 6],
            [2, 3],
            [1, 2],
            [0, 1],
        ],
        rand,
    );
    // Q4: 398 answered; each feature picked by a fixed number of them.
    const q4Answered = shuffle(
        Array.from({ length: COMPLETE }, (_, i) => i),
        rand,
    ).slice(0, 398);
    const picks: Record<number, string[]> = {};
    const featureCounts: Record<(typeof FEATURES)[number], number> = { earn: 326, redeem: 295, promotions: 203, arcade: 131, reports: 72 };
    for (const f of FEATURES) for (const i of shuffle(q4Answered, rand).slice(0, featureCounts[f])) (picks[i] ??= []).push(f);
    // Everyone who answered picked at least one.
    for (const i of q4Answered) if (!picks[i]?.length) picks[i] = ["earn"];

    const start = new Date(from).getTime();
    const span = new Date(to).getTime() - start;
    const locales = spread<SurveyLocale>(
        [
            ["en", 370],
            ["fr", 158],
        ],
        rand,
    );

    // Interleave complete and partial responses across the whole period.
    const slots = shuffle(
        Array.from({ length: COMPLETE + PARTIAL }, (_, k) => k),
        rand,
    );
    const out: ResultResponse[] = [];
    for (let i = 0; i < COMPLETE + PARTIAL; i++) {
        const locale = locales[i];
        const startedAt = new Date(start + Math.floor((slots[i] / (COMPLETE + PARTIAL)) * span + rand() * 3_600_000)).toISOString();
        const participant = identified ? randomParticipant(rand) : undefined;

        if (i < COMPLETE) {
            const answers: SurveyAnswers = { q1: q1[i], q3: nps[i] };
            if (q1[i] <= 2) answers.q2 = NOT_WORKING[locale][Math.floor(rand() * NOT_WORKING[locale].length)];
            if (picks[i]) answers.q4 = { selected: picks[i] };
            if (rand() < 0.3) answers.q5 = MORE_VALUABLE[locale][Math.floor(rand() * MORE_VALUABLE[locale].length)];
            // Durations around a 1m52s median.
            const durationSeconds = Math.round(70 + rand() * 84 + (rand() < 0.1 ? rand() * 240 : 0));
            out.push({
                number: 0,
                locale,
                status: "complete",
                startedAt,
                submittedAt: new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString(),
                durationSeconds,
                answers,
                participant,
            });
        } else {
            // Partials stop somewhere in the first three questions.
            const answers: SurveyAnswers = { q1: 1 + Math.floor(rand() * 5) };
            if (rand() < 0.5) answers.q3 = Math.floor(rand() * 11);
            out.push({ number: 0, locale, status: "partial", startedAt, answers, participant });
        }
    }

    // Number in the order they started.
    return out.sort((a, b) => a.startedAt.localeCompare(b.startedAt)).map((r, i) => ({ ...r, number: i + 1 }));
};
