import { getFungicideQuiz } from "../quiz-sample-data";
import type { AnswerValue, Survey, SurveyAnswers, SurveyLocale } from "../survey-types";
import { mulberry32, randomParticipant, shuffle } from "./results-sample-data";
import type { ResultResponse } from "./results-types";

/*
 * Deterministic mock responses for the "2027 Fungicide Lineup Quiz"
 * (`getFungicideQuiz`). Quizzes are identified, so every response has a
 * participant. Each person has an "ability" so scores cluster realistically, and
 * the multi-select (k4) is clearly the hardest question. Same output every time.
 */

/** Base chance of a right answer per scored question. k4 (pick all that apply) is the hard one. */
const BASE: Record<string, number> = { k1: 0.88, k2: 0.8, k3: 0.78, k4: 0.47, k5: 0.74 };

/** Wrong answers people actually give, per question. */
const WRONG: Record<string, AnswerValue[]> = {
    k1: [{ selected: ["k1-a"] }, { selected: ["k1-c"] }],
    k2: [{ selected: ["k2-a"] }, { selected: ["k2-c"] }, { selected: ["k2-c"] }],
    k3: ["no"],
    // Mostly "also picked canola", the classic miss.
    k4: [
        { selected: ["k4-a", "k4-b", "k4-c"] },
        { selected: ["k4-a", "k4-b", "k4-c"] },
        { selected: ["k4-a"] },
        { selected: ["k4-a", "k4-c"] },
        { selected: ["k4-b"] },
    ],
    k5: ["k5-a", "k5-c", "k5-c", "k5-d"],
};

const RIGHT: Record<string, AnswerValue> = {
    k1: { selected: ["k1-b"] },
    k2: { selected: ["k2-b"] },
    k3: "yes",
    k4: { selected: ["k4-a", "k4-b"] },
    k5: "k5-b",
};

const SCORED = ["k1", "k2", "k3", "k4", "k5"];

export interface GenerateQuizOptions {
    /** Completed responses. Defaults to 186. */
    complete?: number;
    /** Started but not submitted. Defaults to 34. */
    partial?: number;
    /** Responses come in between these dates. */
    from?: string;
    to?: string;
}

/**
 * Responses for `getFungicideQuiz`: about 57% pass at the default 80% pass mark,
 * k4 is answered correctly by under half, and about a quarter answer in French.
 */
export const generateQuizResults = ({
    complete = 186,
    partial = 34,
    from = "2026-12-01T09:00:00-05:00",
    to = "2026-12-09T11:00:00-05:00",
}: GenerateQuizOptions = {}): ResultResponse[] => {
    const rand = mulberry32(2027);
    const total = complete + partial;
    const start = new Date(from).getTime();
    const span = new Date(to).getTime() - start;
    const slots = shuffle(
        Array.from({ length: total }, (_, k) => k),
        rand,
    );
    const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];

    const answerFor = (id: string, ability: number) => {
        const p = Math.min(0.98, Math.max(0.05, BASE[id] + (ability - 0.5) * 0.8));
        return rand() < p ? RIGHT[id] : pick(WRONG[id]);
    };

    const out: ResultResponse[] = [];
    for (let i = 0; i < total; i++) {
        const locale: SurveyLocale = rand() < 0.26 ? "fr" : "en";
        const startedAt = new Date(start + Math.floor((slots[i] / total) * span + rand() * 3_600_000)).toISOString();
        const participant = randomParticipant(rand);
        const ability = rand();

        if (i < complete) {
            const answers: SurveyAnswers = Object.fromEntries(SCORED.map((id) => [id, answerFor(id, ability)]));
            // The unscored confidence question is optional; most answer it, and it tracks ability loosely.
            if (rand() < 0.82) answers.k6 = Math.min(5, Math.max(1, Math.round(1.5 + ability * 3 + (rand() - 0.5) * 1.5)));
            // Durations around a minute and a half.
            const durationSeconds = Math.round(55 + rand() * 70 + (rand() < 0.1 ? rand() * 200 : 0));
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
            const stop = 1 + Math.floor(rand() * 3);
            const answers: SurveyAnswers = Object.fromEntries(SCORED.slice(0, stop).map((id) => [id, answerFor(id, ability)]));
            out.push({ number: 0, locale, status: "partial", startedAt, answers, participant });
        }
    }

    // Number in the order they started.
    return out.sort((a, b) => a.startedAt.localeCompare(b.startedAt)).map((r, i) => ({ ...r, number: i + 1 }));
};

/** The quiz as it looks while live in the results stories (Dec 1 to 15, so it's open on ADMIN_NOW). */
export const getLiveQuizForResults = (overrides: Partial<Survey> = {}): Survey =>
    getFungicideQuiz("en", { status: "live", opensAt: "2026-12-01T09:00:00-05:00", closesAt: "2026-12-15T23:59:00-05:00", ...overrides });
