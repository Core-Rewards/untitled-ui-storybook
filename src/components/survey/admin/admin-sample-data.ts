import {
    Activity,
    Announcement01,
    BarChartSquare02,
    Calendar,
    ClipboardCheck,
    CoinsStacked01,
    Dice5,
    Gift01,
    GraduationHat01,
    HeartRounded,
    HomeLine,
    LifeBuoy01,
    PieChart03,
    Settings01,
    ShieldTick,
    Tag01,
    Users01,
} from "@untitledui/icons";
import type { AiChatSuggestion } from "@/components/application/ai-chat-sidebar";
import type { AppAccountMenuItem, AppNavEntry, AppNavItem } from "@/components/base/app-shell/app-shell-types";
import type { SurveyListItem, SurveyTemplate } from "./admin-types";

/*
 * Sample data for the admin stories. Names, counts and percentages are placeholders,
 * matching the wireframes.
 */

// ─── Admin navigation (AdminUI's links, with Surveys added) ──────────────────

export const adminNavItems: AppNavEntry[] = [
    { id: "home", label: "Home", href: "#", icon: HomeLine },
    { id: "participants", label: "Participants", href: "#", icon: Users01 },
    { id: "issue-points", label: "Issue Points", href: "#", icon: CoinsStacked01 },
    { id: "promotions", label: "Promotions", href: "#", icon: Announcement01 },
    { id: "arcade-controls", label: "Arcade Controls", href: "#", icon: Dice5 },
    { id: "surveys", label: "Surveys", href: "#", icon: ClipboardCheck },
    { id: "reporting", label: "Reporting", href: "#", icon: PieChart03 },
];

export const adminFooterItems: AppNavItem[] = [
    { id: "support", label: "Support", href: "#", icon: LifeBuoy01 },
    { id: "settings", label: "Settings", href: "#", icon: Settings01 },
];

/** The account card is the program switcher in admin: the current program, with the others in its menu. */
export const adminProgramName = "Advisor Advantage";

export const adminProgramMenuItems: AppAccountMenuItem[] = [
    { id: "program-ad-rewards", label: "AD Rewards US", href: "#" },
    { id: "program-ad-canada", label: "AD Rewards Canada", href: "#" },
    { id: "program-nutrien", label: "Nutrien Rewards", href: "#" },
];

/** Starter prompts for the AI assistant drawer on survey pages. Responses are placeholders. */
export const surveyAiSuggestions: AiChatSuggestion[] = [
    {
        label: "Summarize survey results",
        description: "for 2026 Program Satisfaction",
        icon: BarChartSquare02,
        response:
            "412 people have responded so far, with a 78% completion rate. Satisfaction averages 4.0 out of 5 and NPS is +42. The most common theme in open answers is that the rewards catalog is hard to browse.",
    },
    {
        label: "Draft a survey",
        description: "about the new rewards catalog",
        icon: ClipboardCheck,
        response:
            "Here's a 4-question draft: overall catalog satisfaction (opinion scale), how easy it is to find rewards (rating), which categories they want more of (multiple choice), and anything else (long text). Want me to create it as a draft?",
    },
    {
        label: "Who hasn't finished",
        description: "the satisfaction survey yet",
        icon: Users01,
        response:
            "The survey is anonymous, so I can't list names. 1,240 participants were invited and 412 have finished. A reminder email goes to everyone who hasn't finished 3 days before it closes on Dec 15.",
    },
];

// ─── Surveys (A1) ────────────────────────────────────────────────────────────

export const sampleSurveyList: SurveyListItem[] = [
    {
        id: "srv-2026-satisfaction",
        title: "2026 Program Satisfaction",
        status: "live",
        questionCount: 5,
        minutes: 2,
        anonymity: "anonymous",
        opensAt: "2026-12-01T09:00:00-05:00",
        closesAt: "2026-12-15T23:59:00-05:00",
        timezone: "America/Toronto",
        responses: 412,
        completionRate: 0.78,
        reward: { type: "points", amount: 500 },
        locales: ["en", "fr"],
        updatedAt: "2026-11-28T10:15:00-05:00",
    },
    {
        id: "srv-catalog-feedback",
        title: "Reward Catalog Feedback",
        status: "scheduled",
        questionCount: 4,
        minutes: 1,
        anonymity: "identified",
        opensAt: "2027-01-05T09:00:00-05:00",
        closesAt: "2027-01-19T23:59:00-05:00",
        timezone: "America/Toronto",
        reward: { type: "sweepstakes", amount: 1 },
        locales: ["en"],
        updatedAt: "2026-11-19T16:40:00-05:00",
    },
    {
        id: "srv-q1-promotion",
        title: "Q1 Promotion Feedback",
        status: "draft",
        questionCount: 3,
        minutes: 1,
        anonymity: "anonymous",
        timezone: "America/Toronto",
        reward: { type: "points", amount: 250 },
        locales: ["en"],
        updatedAt: "2026-12-09T10:00:00-05:00",
    },
    {
        id: "srv-grower-event",
        title: "Grower Event Follow-up",
        status: "closed",
        questionCount: 6,
        minutes: 3,
        anonymity: "identified",
        opensAt: "2026-10-01T09:00:00-04:00",
        closesAt: "2026-10-14T23:59:00-04:00",
        timezone: "America/Toronto",
        responses: 538,
        completionRate: 0.81,
        reward: { type: "points", amount: 300 },
        locales: ["en", "fr"],
        updatedAt: "2026-10-15T08:00:00-04:00",
    },
    {
        id: "quiz-fungicides-2027",
        kind: "quiz",
        title: "2027 Fungicide Lineup Quiz",
        status: "live",
        questionCount: 6,
        minutes: 2,
        anonymity: "identified",
        opensAt: "2026-12-02T09:00:00-05:00",
        closesAt: "2026-12-18T23:59:00-05:00",
        timezone: "America/Toronto",
        responses: 286,
        completionRate: 0.91,
        reward: { type: "points", amount: 250 },
        quizRewardRule: "pass",
        locales: ["en", "fr"],
        updatedAt: "2026-12-01T15:30:00-05:00",
    },
    {
        id: "quiz-seed-treatment",
        kind: "quiz",
        title: "Seed Treatment Basics",
        status: "draft",
        questionCount: 4,
        minutes: 1,
        anonymity: "identified",
        timezone: "America/Toronto",
        reward: { type: "points", amount: 500 },
        quizRewardRule: "tiered",
        locales: ["en"],
        updatedAt: "2026-12-08T16:20:00-05:00",
    },
];

// ─── Template library (Core-managed) ─────────────────────────────────────────

/** Survey templates. The three starters come first. */
const surveyTemplateLibrary: SurveyTemplate[] = [
    {
        id: "tpl-program-satisfaction",
        title: "Program satisfaction",
        description: "Overall satisfaction, NPS and what to improve. The pilot's default.",
        questionCount: 5,
        minutes: 2,
        hasFrench: true,
        icon: HeartRounded,
        category: "Satisfaction",
        isStarter: true,
        questions: [
            { type: "Opinion scale", title: "How satisfied are you with the program overall?" },
            { type: "Long text", title: "What's not working for you?" },
            { type: "NPS", title: "How likely are you to recommend the program to a colleague?" },
            { type: "Multiple choice", title: "Which program features do you use most?" },
            { type: "Long text", title: "What would make the program more valuable to you?" },
        ],
    },
    {
        id: "tpl-catalog-feedback",
        title: "Reward catalog feedback",
        description: "How easy rewards are to find and which categories people want more of.",
        questionCount: 4,
        minutes: 1,
        hasFrench: true,
        icon: Gift01,
        category: "Rewards",
        isStarter: true,
        questions: [
            { type: "Rating", title: "How would you rate the rewards catalog?" },
            { type: "Opinion scale", title: "It's easy to find a reward I want." },
            { type: "Multiple choice", title: "Which categories would you like more of?" },
            { type: "Long text", title: "Anything else about the catalog?" },
        ],
    },
    {
        id: "tpl-post-promotion",
        title: "Post-promotion feedback",
        description: "Whether a promotion was clear, worth it, and what would make the next one better.",
        questionCount: 4,
        minutes: 1,
        hasFrench: true,
        icon: Tag01,
        category: "Promotions",
        isStarter: true,
        questions: [
            { type: "Yes / No", title: "Did you take part in the promotion?" },
            { type: "Opinion scale", title: "The promotion rules were clear." },
            { type: "Rating", title: "How worthwhile was the reward?" },
            { type: "Long text", title: "What would make the next promotion better?" },
        ],
    },
    {
        id: "tpl-quick-pulse",
        title: "Quick pulse",
        description: "A one-question NPS check with an optional follow-up. Takes under a minute.",
        questionCount: 2,
        minutes: 1,
        hasFrench: true,
        icon: Activity,
        category: "Satisfaction",
        questions: [
            { type: "NPS", title: "How likely are you to recommend the program to a colleague?" },
            { type: "Long text", title: "What's the main reason for your score?" },
        ],
    },
    {
        id: "tpl-event-follow-up",
        title: "Event follow-up",
        description: "Rate a grower meeting, trade show or webinar and what to change next time.",
        questionCount: 5,
        minutes: 2,
        hasFrench: true,
        icon: Calendar,
        category: "Events",
        questions: [
            { type: "Rating", title: "How would you rate the event overall?" },
            { type: "Matrix", title: "How satisfied were you with each part of the event?" },
            { type: "Yes / No", title: "Would you attend again?" },
            { type: "Multiple choice", title: "Which sessions were most useful?" },
            { type: "Long text", title: "What should we change next time?" },
        ],
    },
    {
        id: "tpl-training-check",
        title: "Training feedback",
        description: "Check a training module landed: clarity, usefulness and what's missing.",
        questionCount: 3,
        minutes: 1,
        hasFrench: false,
        icon: GraduationHat01,
        category: "Training",
        questions: [
            { type: "Opinion scale", title: "The training was clear and easy to follow." },
            { type: "Opinion scale", title: "I can use what I learned in my work." },
            { type: "Long text", title: "What would you add to this training?" },
        ],
    },
];

/** Quiz templates. Correct answers are marked; admins swap in their own products and check them. */
export const quizTemplateLibrary: SurveyTemplate[] = [
    {
        id: "tpl-product-knowledge",
        kind: "quiz",
        title: "Product knowledge check",
        description: "What a product controls, its intervals and rates. Swap in your product; the right answers are marked for you to check.",
        questionCount: 5,
        minutes: 2,
        hasFrench: true,
        icon: GraduationHat01,
        category: "Product training",
        isStarter: true,
        questions: [
            { type: "Multiple choice · scored", title: "Which disease is [product] labelled for?" },
            { type: "Multiple choice · scored", title: "What's the restricted-entry interval?" },
            { type: "Yes / No · scored", title: "Can [product] be applied by air?" },
            { type: "Multiple choice, pick any · scored", title: "Which crops is [product] registered for?" },
            { type: "Opinion scale · not scored", title: "How confident do you feel recommending [product]?" },
        ],
    },
    {
        id: "tpl-label-safety",
        kind: "quiz",
        title: "Label safety refresher",
        description: "PPE, re-entry and storage basics from the label. A good yearly refresher.",
        questionCount: 4,
        minutes: 1,
        hasFrench: true,
        icon: ShieldTick,
        category: "Safety",
        questions: [
            { type: "Multiple choice · scored", title: "Which PPE does the label require when mixing?" },
            { type: "Yes / No · scored", title: "Can you re-enter before the interval if you wear PPE?" },
            { type: "Dropdown · scored", title: "How far from water must the product be stored?" },
            { type: "Multiple choice · scored", title: "Where do you find first-aid instructions?" },
        ],
    },
];

/** Every template in the library, surveys and quizzes. New survey shows the ones for the kind being created. */
export const templateLibrary: SurveyTemplate[] = [...surveyTemplateLibrary, ...quizTemplateLibrary];

/** The three survey starters, for the list's empty state. */
export const starterTemplates = surveyTemplateLibrary.filter((t) => t.isStarter);
