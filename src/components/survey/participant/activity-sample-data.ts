import { getSatisfactionSurvey, inProgressResponse } from "../survey-sample-data";
import type { Survey, SurveyQuestion } from "../survey-types";
import type { ActivityItem } from "./activity-logic";

/*
 * What one participant might have in front of them, for the Surveys & quizzes page
 * and the dashboard stories. Pair with STORY_NOW (Nov 20, 2026).
 */

const mcq = (id: string, title: string, options: string[]): SurveyQuestion => ({
    id,
    type: "multiple_choice",
    title,
    required: true,
    options: options.map((label, i) => ({ id: `${id}-${i}`, label })),
});

const base = getSatisfactionSurvey("en");

const quiz = (overrides: Partial<Survey>): Survey => ({
    ...base,
    kind: "quiz",
    anonymity: "identified",
    intro: { title: overrides.title ?? "Quiz", body: "Check what you know. You get one try." },
    card: { enabled: true, headline: overrides.title ?? "Quiz", body: "Check what you know. You get one try." },
    questions: [
        mcq("k1", "Which product is labelled for early blight?", ["Product A", "Product B", "Product C"]),
        mcq("k2", "What's the re-entry interval?", ["4 hours", "12 hours", "24 hours"]),
        mcq("k3", "Which crop is it not registered for?", ["Potatoes", "Wheat", "Canola"]),
        mcq("k4", "How many applications per season?", ["1", "2", "3"]),
        mcq("k5", "What's the pre-harvest interval for potatoes?", ["1 day", "7 days", "14 days"]),
        mcq("k6", "Which tank-mix partner is recommended?", ["Partner X", "Partner Y", "None"]),
    ],
    ...overrides,
});

/** Live satisfaction survey, already started (Resume · 3 of 5). */
const satisfaction: ActivityItem = {
    survey: getSatisfactionSurvey("en"),
    response: inProgressResponse("en"),
};

/** Live quiz paying only on a pass. */
const fungicideQuiz: ActivityItem = {
    survey: quiz({
        id: "quiz-fungicides-2027",
        title: "2027 Fungicide Lineup Quiz",
        opensAt: "2026-11-16T09:00:00-05:00",
        closesAt: "2026-12-04T23:59:00-05:00",
        reward: { type: "points", amount: 250 },
        quiz: { passMark: 80, rewardRule: "pass" },
    }),
};

/** Live tiered quiz, closes later. */
const seedQuiz: ActivityItem = {
    survey: quiz({
        id: "quiz-seed-treatment",
        title: "Seed Treatment Basics",
        opensAt: "2026-11-18T09:00:00-05:00",
        closesAt: "2026-12-31T23:59:00-05:00",
        reward: { type: "points", amount: 500 },
        quiz: {
            passMark: 60,
            rewardRule: "tiered",
            tiers: [
                { minScore: 100, amount: 500 },
                { minScore: 80, amount: 300 },
                { minScore: 60, amount: 150 },
            ],
        },
        questions: [
            mcq("s1", "When should seed treatment be applied?", ["Before planting", "At emergence"]),
            mcq("s2", "What does it protect against?", ["Seed rot", "Hail"]),
        ],
    }),
};

/** Opens in the new year. */
const catalogSurvey: ActivityItem = {
    survey: getSatisfactionSurvey("en", {
        id: "srv-catalog-feedback",
        title: "Reward Catalog Feedback",
        status: "scheduled",
        opensAt: "2027-01-05T09:00:00-05:00",
        closesAt: "2027-01-19T23:59:00-05:00",
        reward: { type: "sweepstakes", amount: 1 },
        card: { enabled: true, headline: "Reward Catalog Feedback", body: "Help us decide what to add to the catalog." },
    }),
};

/** Finished quiz with a score. */
const agronomyQuiz: ActivityItem = {
    survey: quiz({
        id: "quiz-q3-agronomy",
        title: "Q3 Agronomy Quiz",
        status: "closed",
        opensAt: "2026-10-01T09:00:00-04:00",
        closesAt: "2026-10-31T23:59:00-04:00",
        reward: { type: "points", amount: 300 },
        quiz: { passMark: 70, rewardRule: "completion" },
    }),
    response: {
        surveyId: "quiz-q3-agronomy",
        status: "complete",
        locale: "en",
        answers: {},
        history: [],
        submittedAt: "2026-10-12T15:20:00-04:00",
        score: { correct: 5, total: 6, passed: true },
        rewardEarned: { type: "points", amount: 300 },
    },
};

/** Finished survey. */
const growerSurvey: ActivityItem = {
    survey: getSatisfactionSurvey("en", {
        id: "srv-grower-event",
        title: "Grower Event Follow-up",
        status: "closed",
        opensAt: "2026-10-01T09:00:00-04:00",
        closesAt: "2026-10-14T23:59:00-04:00",
        reward: { type: "points", amount: 300 },
        card: { enabled: true, headline: "Grower Event Follow-up", body: "Tell us how the event went." },
    }),
    response: {
        surveyId: "srv-grower-event",
        status: "complete",
        locale: "en",
        answers: {},
        history: [],
        submittedAt: "2026-10-06T11:05:00-04:00",
        rewardEarned: { type: "points", amount: 300 },
    },
};

/** Finished quiz, not passed on a pass-only reward. */
const safetyQuiz: ActivityItem = {
    survey: quiz({
        id: "quiz-label-safety",
        title: "Label Safety Refresher",
        status: "closed",
        opensAt: "2026-09-01T09:00:00-04:00",
        closesAt: "2026-09-30T23:59:00-04:00",
        reward: { type: "points", amount: 200 },
        quiz: { passMark: 80, rewardRule: "pass" },
    }),
    response: {
        surveyId: "quiz-label-safety",
        status: "complete",
        locale: "en",
        answers: {},
        history: [],
        submittedAt: "2026-09-18T09:40:00-04:00",
        score: { correct: 4, total: 6, passed: false },
    },
};

/** Closed before they took it. Not shown anywhere. */
const missedSurvey: ActivityItem = {
    survey: getSatisfactionSurvey("en", {
        id: "srv-spring-planting",
        title: "Spring Planting Check-in",
        status: "closed",
        opensAt: "2026-04-01T09:00:00-04:00",
        closesAt: "2026-04-15T23:59:00-04:00",
    }),
};

export const sampleActivities: ActivityItem[] = [satisfaction, fungicideQuiz, seedQuiz, catalogSurvey, agronomyQuiz, growerSurvey, safetyQuiz, missedSurvey];

export const activitySamples = { satisfaction, fungicideQuiz, seedQuiz, catalogSurvey, agronomyQuiz, growerSurvey, safetyQuiz, missedSurvey };
