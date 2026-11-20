import { createContext, useContext } from "react";
import { SURVEY_COPY } from "./survey-copy";
import type { SurveyCopy } from "./survey-copy";
import type { SurveyLocale } from "./survey-types";

export interface SurveyContextValue {
    locale: SurveyLocale;
    copy: SurveyCopy;
}

export const SurveyContext = createContext<SurveyContextValue>({ locale: "en", copy: SURVEY_COPY.en });

/** The participant's language and the fixed UI strings for it. */
export const useSurveyCopy = () => useContext(SurveyContext);
