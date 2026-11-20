import { useEffect } from "react";
import type { ReactNode } from "react";
import { ProgramBrandContext } from "./program-brands";
import type { ProgramBrand } from "./program-brands";
import "./basf/theme-basf.css";

// Several themed stories can be on screen at once on a docs page, so count them
// and only drop a class when the last one using it leaves.
const mountedClasses = new Map<string, number>();

/**
 * Provides the program brand and swaps the brand colour scale while its children
 * are on screen. The class goes on <html> so popovers and drawers pick it up too.
 */
export const ProgramBrandProvider = ({ brand, children }: { brand: ProgramBrand; children: ReactNode }) => {
    useEffect(() => {
        const themeClass = brand.themeClass;
        if (!themeClass) return;
        mountedClasses.set(themeClass, (mountedClasses.get(themeClass) ?? 0) + 1);
        document.documentElement.classList.add(themeClass);
        return () => {
            const count = (mountedClasses.get(themeClass) ?? 1) - 1;
            mountedClasses.set(themeClass, count);
            if (count === 0) document.documentElement.classList.remove(themeClass);
        };
    }, [brand.themeClass]);

    return <ProgramBrandContext.Provider value={brand}>{children}</ProgramBrandContext.Provider>;
};
