import {
    AlignLeft,
    Calendar,
    CheckDone01,
    ChevronSelectorVertical,
    Grid01,
    Hash01,
    MessageSquare01,
    Sliders01,
    Speedometer03,
    Star01,
    SwitchVertical01,
    ThumbsUp,
    Type01,
    UploadCloud02,
} from "@untitledui/icons";
import type { FC } from "react";
import type { SurveyQuestionType } from "../survey-types";

export type QuestionGroup = "Choice" | "Scales" | "Text and data" | "Other";

export interface QuestionTypeInfo {
    type: SurveyQuestionType;
    label: string;
    group: QuestionGroup;
    icon: FC<{ className?: string }>;
    /** One line for the type picker's preview. */
    bestFor: string;
    /** Extra words the picker search matches. */
    keywords?: string;
}

/** Every question type, grouped and ordered as the add-question picker shows them. */
export const QUESTION_TYPES: QuestionTypeInfo[] = [
    {
        type: "multiple_choice",
        label: "Multiple choice",
        group: "Choice",
        icon: CheckDone01,
        bestFor: "picking one or several answers from a short list. For more than 8 options, use Dropdown.",
        keywords: "single multi select options radio checkbox",
    },
    {
        type: "dropdown",
        label: "Dropdown",
        group: "Choice",
        icon: ChevronSelectorVertical,
        bestFor: "long lists like regions or products. Searchable.",
        keywords: "select list",
    },
    { type: "yes_no", label: "Yes / No", group: "Choice", icon: ThumbsUp, bestFor: "quick binary questions.", keywords: "boolean" },
    {
        type: "ranking",
        label: "Ranking",
        group: "Choice",
        icon: SwitchVertical01,
        bestFor: "ordering priorities by dragging.",
        keywords: "order sort priority",
    },
    { type: "rating", label: "Rating", group: "Scales", icon: Star01, bestFor: "a quick score with stars, hearts or thumbs.", keywords: "stars" },
    {
        type: "opinion_scale",
        label: "Opinion scale",
        group: "Scales",
        icon: Sliders01,
        bestFor: "agreement or satisfaction on a 1 to 5, 1 to 7 or 0 to 10 scale.",
        keywords: "likert agree satisfaction",
    },
    {
        type: "nps",
        label: "NPS",
        group: "Scales",
        icon: Speedometer03,
        bestFor: "program loyalty. Fixed 0 to 10 with standard labels.",
        keywords: "net promoter recommend",
    },
    {
        type: "matrix",
        label: "Matrix",
        group: "Scales",
        icon: Grid01,
        bestFor: "rating several items on one scale. One row per screen on phones.",
        keywords: "grid table",
    },
    { type: "short_text", label: "Short text", group: "Text and data", icon: Type01, bestFor: "a name, title or a few words.", keywords: "input open" },
    {
        type: "long_text",
        label: "Long text",
        group: "Text and data",
        icon: AlignLeft,
        bestFor: "open feedback in a sentence or two.",
        keywords: "paragraph comment open",
    },
    {
        type: "number",
        label: "Number",
        group: "Text and data",
        icon: Hash01,
        bestFor: "facts like acres or years, with a min and max.",
        keywords: "numeric amount",
    },
    { type: "date", label: "Date", group: "Text and data", icon: Calendar, bestFor: "a day, like a purchase or event date.", keywords: "day calendar" },
    {
        type: "file_upload",
        label: "File upload",
        group: "Text and data",
        icon: UploadCloud02,
        bestFor: "photos or documents, with type and size limits.",
        keywords: "photo image attachment",
    },
    {
        type: "statement",
        label: "Statement",
        group: "Other",
        icon: MessageSquare01,
        bestFor: "a message between questions. No answer, just Continue.",
        keywords: "message text info",
    },
];

export const QUESTION_GROUPS: QuestionGroup[] = ["Choice", "Scales", "Text and data", "Other"];

export const typeInfo = (type: SurveyQuestionType) => QUESTION_TYPES.find((t) => t.type === type)!;
