import { createContext, useContext } from "react";
import advisorAdvantageLogo from "./basf/assets/logo-advisor-advantage.png";

export type ProgramBrandId = "neutral" | "basf";

export interface ProgramBrand {
    id: ProgramBrandId;
    /** Program name, shown next to the logo and used as its alt text. */
    name: string;
    /** Program logo. Without one, a neutral placeholder mark is shown. */
    logoSrc?: string;
    /** Class added to <html> while the brand is active. */
    themeClass?: string;
}

export const PROGRAM_BRANDS: Record<ProgramBrandId, ProgramBrand> = {
    neutral: { id: "neutral", name: "Rewards Program" },
    basf: { id: "basf", name: "Advisor Advantage", logoSrc: advisorAdvantageLogo, themeClass: "theme-basf" },
};

export const ProgramBrandContext = createContext<ProgramBrand>(PROGRAM_BRANDS.neutral);

/** The program brand in effect: its name, logo and theme. */
export const useProgramBrand = () => useContext(ProgramBrandContext);
