import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ADMIN_NOW, AdminDemoShell } from "../stories/admin-demo-shell";
import { sampleSurveyList, starterTemplates, templateLibrary } from "./admin-sample-data";
import { SurveyBuilder } from "../builder/survey-builder";
import { getBuilderQuiz, getBuilderQuizTranslations, getBuilderSurvey, getBuilderTranslations, mockDraftFrench } from "../builder/builder-sample-data";
import type { Translations } from "../builder/builder-model";
import { ResultsPage } from "../results/results-page";
import { generateQuizResults, getLiveQuizForResults } from "../results/quiz-results-sample-data";
import { generateSatisfactionResults } from "../results/results-sample-data";
import { getSatisfactionSurvey } from "../survey-sample-data";
import type { Survey, SurveyKind, SurveyLocale } from "../survey-types";
import type { NewSurveyRequest, SurveyListItem } from "./admin-types";
import { NewSurveyPage } from "./new-survey-page";
import type { NewSurveySelection } from "./new-survey-page";
import { SurveyListPage } from "./survey-list-page";
import type { SurveyListPageProps } from "./survey-list-page";

type View =
    | { kind: "list" }
    | { kind: "new"; selection?: NewSurveySelection }
    | { kind: "builder"; survey: Survey; translations: Translations }
    | { kind: "results"; item: SurveyListItem };

const liveDates = { opensAt: "2026-12-01T09:00:00-05:00", closesAt: "2026-12-15T23:59:00-05:00" };

/** Opens a list row (or a newly created survey or quiz) in the builder, using the sample survey's or quiz's questions. */
const builderFor = (
    title: string,
    { blank = false, bilingual = true, kind = "survey" }: { blank?: boolean; bilingual?: boolean; kind?: SurveyKind } = {},
): View => {
    const quiz = kind === "quiz";
    const sample = quiz ? getBuilderQuiz() : getBuilderSurvey();
    const base = { ...sample, enabledLocales: bilingual ? (["en", "fr"] as SurveyLocale[]) : (["en"] as SurveyLocale[]) };
    if (blank)
        return {
            kind: "builder",
            survey: { ...base, title, intro: { ...base.intro, title }, card: { ...base.card, headline: title }, questions: [] },
            translations: {},
        };
    return { kind: "builder", survey: { ...base, title }, translations: bilingual ? (quiz ? getBuilderQuizTranslations() : getBuilderTranslations()) : {} };
};

/**
 * The admin journey in the shell: the list, New survey (with the template library),
 * the builder for Edit and newly created surveys, and Results for live and closed
 * surveys. Sample content stands in for each survey's own questions.
 */
const SurveyListDemo = (props: SurveyListPageProps & { onCreate: (request: NewSurveyRequest) => void }) => {
    const [view, setView] = useState<View>({ kind: "list" });

    if (view.kind === "builder") {
        return (
            <AdminDemoShell sidebarMode="rail" fullBleed>
                <SurveyBuilder
                    survey={view.survey}
                    translations={view.translations}
                    programName={props.programName}
                    enabledRewardTypes={["points", "sweepstakes"]}
                    now={props.now}
                    onDraftTranslations={mockDraftFrench}
                    onExit={() => setView({ kind: "list" })}
                />
            </AdminDemoShell>
        );
    }

    return (
        <AdminDemoShell>
            {view.kind === "new" ? (
                <NewSurveyPage
                    templates={templateLibrary}
                    surveys={props.surveys}
                    defaultSelection={view.selection}
                    onCancel={() => setView({ kind: "list" })}
                    onCreate={(r) => {
                        props.onCreate(r);
                        setView(builderFor(r.name, { blank: r.source === "blank", bilingual: r.bilingual, kind: r.kind }));
                    }}
                />
            ) : view.kind === "results" ? (
                <ResultsPage
                    survey={
                        view.item.kind === "quiz"
                            ? getLiveQuizForResults({
                                  title: view.item.title,
                                  status: view.item.status,
                                  enabledLocales: view.item.locales,
                                  ...(view.item.status === "live" ? liveDates : { opensAt: view.item.opensAt!, closesAt: view.item.closesAt! }),
                              })
                            : getSatisfactionSurvey("en", {
                                  title: view.item.title,
                                  status: view.item.status,
                                  anonymity: view.item.anonymity,
                                  enabledLocales: view.item.locales,
                                  ...(view.item.status === "live" ? liveDates : { opensAt: view.item.opensAt!, closesAt: view.item.closesAt! }),
                              })
                    }
                    responses={
                        view.item.kind === "quiz" ? generateQuizResults() : generateSatisfactionResults({ identified: view.item.anonymity === "identified" })
                    }
                    now={props.now}
                    onExit={() => setView({ kind: "list" })}
                    onEditSurvey={() => setView(builderFor(view.item.title, { bilingual: view.item.locales.length > 1, kind: view.item.kind }))}
                />
            ) : (
                <SurveyListPage
                    {...props}
                    onNewSurvey={() => {
                        props.onNewSurvey();
                        setView({ kind: "new" });
                    }}
                    onUseTemplate={(t) => {
                        props.onUseTemplate(t);
                        setView({ kind: "new", selection: `template:${t.id}` });
                    }}
                    onRowAction={(action, item) => {
                        props.onRowAction(action, item);
                        if (action === "results") setView({ kind: "results", item });
                        if (action === "edit") setView(builderFor(item.title, { bilingual: item.locales.length > 1, kind: item.kind }));
                    }}
                />
            )}
        </AdminDemoShell>
    );
};

const meta = {
    title: "Survey/Admin/Survey list",
    component: SurveyListPage,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: [
                    "The admin survey list (A1) in the admin shell, with **Surveys** added to the sidebar.",
                    "",
                    "- Status tabs with counts: All, Drafts, Scheduled, Live, Closed. Archived surveys are hidden.",
                    "- Each row: name, status pill, dates, responses, completion rate, reward and languages. Click a name to edit a draft or scheduled survey, or see results for a live or closed one.",
                    "- The ··· menu only offers what applies: View results once there can be responses, Close now while live, Archive once it isn't live.",
                    "- **New survey** opens the New survey page, which also holds the template library. The empty state's templates open it with that template selected.",
                    "- **Quizzes** sit in the same list with a Quiz badge and their reward rule (\"Pass: 250 points\", \"Up to 500 points\"). All / Surveys / Quizzes filters appear once the program has a quiz.",
                    "- In this story the whole admin journey is wired: **Edit** (or clicking a draft) opens the builder, **View results** (or clicking a live or closed survey) opens Results, and Create survey opens the builder. Sample content stands in for each survey's own questions.",
                ].join("\n"),
            },
        },
    },
    render: (args) => <SurveyListDemo {...args} onCreate={fn()} />,
    args: {
        surveys: sampleSurveyList,
        programName: "Advisor Advantage",
        templates: starterTemplates,
        now: ADMIN_NOW,
        onNewSurvey: fn(),
        onUseTemplate: fn(),
        onRowAction: fn(),
    },
} satisfies Meta<typeof SurveyListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LiveTab: Story = { name: "Live tab", args: { defaultTab: "live" } };

/** Only quizzes, via the kind filter. */
export const QuizzesOnly: Story = { name: "Quizzes filter", args: { defaultKind: "quiz" } };

/** No surveys yet: an explainer and the three starter templates. */
export const EmptyState: Story = { name: "Empty state", args: { surveys: [] } };

export const Phone: Story = { globals: { viewport: { value: "phone", isRotated: false } } };
