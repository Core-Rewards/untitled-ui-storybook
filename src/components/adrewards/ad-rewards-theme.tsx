import { useEffect } from "react";
import type { ReactNode } from "react";
import "./ad-rewards-theme.css";

const THEME_CLASS = "theme-ad-rewards";

// Several themed stories can be on screen at once on a docs page, so count them
// and only drop the class when the last one leaves.
let mounted = 0;

/** Swaps the brand scale to AD green while its children are on screen, and puts it back after. */
export const AdRewardsTheme = ({ children }: { children: ReactNode }) => {
    useEffect(() => {
        mounted += 1;
        document.documentElement.classList.add(THEME_CLASS);
        return () => {
            mounted -= 1;
            if (mounted === 0) document.documentElement.classList.remove(THEME_CLASS);
        };
    }, []);
    return children;
};
