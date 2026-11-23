import { useMemo } from "react";
import type { ReactNode } from "react";
import { SurveyContext } from "./survey-context";
import { SURVEY_COPY } from "./survey-copy";
import type { SurveyLocale } from "./survey-types";

/** Sets the participant's language for every survey component inside it. */
export const SurveyLocaleProvider = ({ locale, children }: { locale: SurveyLocale; children: ReactNode }) => {
    const value = useMemo(() => ({ locale, copy: SURVEY_COPY[locale] }), [locale]);
    return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
};
