import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ADMIN_NOW, AdminDemoShell } from "../stories/admin-demo-shell";
import { sampleSurveyList, starterTemplates, templateLibrary } from "./admin-sample-data";
import type { NewSurveyRequest } from "./admin-types";
import { NewSurveyPage } from "./new-survey-page";
import type { NewSurveySelection } from "./new-survey-page";
import { SurveyListPage } from "./survey-list-page";
import type { SurveyListPageProps } from "./survey-list-page";

/** The list in the admin shell. New survey and the empty state's templates open the New survey page; Cancel comes back. */
const SurveyListDemo = (props: SurveyListPageProps & { onCreate: (request: NewSurveyRequest) => void }) => {
    const [newSurvey, setNewSurvey] = useState<{ selection?: NewSurveySelection } | null>(null);
    return (
        <AdminDemoShell>
            {newSurvey ? (
                <NewSurveyPage
                    templates={templateLibrary}
                    surveys={props.surveys}
                    defaultSelection={newSurvey.selection}
                    onCancel={() => setNewSurvey(null)}
                    onCreate={(r) => {
                        props.onCreate(r);
                        setNewSurvey(null);
                    }}
                />
            ) : (
                <SurveyListPage
                    {...props}
                    onNewSurvey={() => {
                        props.onNewSurvey();
                        setNewSurvey({});
                    }}
                    onUseTemplate={(t) => {
                        props.onUseTemplate(t);
                        setNewSurvey({ selection: `template:${t.id}` });
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

/** No surveys yet: an explainer and the three starter templates. */
export const EmptyState: Story = { name: "Empty state", args: { surveys: [] } };

export const Phone: Story = { globals: { viewport: { value: "phone", isRotated: false } } };
