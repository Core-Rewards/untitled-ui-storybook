import { createContext, useContext } from "react";
import type { UseCarouselResult } from "./use-carousel";

// ── Context ───────────────────────────────────────────────────────────────────

export interface CarouselContextValue extends UseCarouselResult {
    trackId: string;
    draggable: boolean;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarouselContext(): CarouselContextValue {
    const context = useContext(CarouselContext);
    if (!context) throw new Error("Carousel parts must be rendered inside <Carousel>.");
    return context;
}

export interface SlideContextValue {
    index: number;
    count: number;
    isClone: boolean;
}

export const SlideContext = createContext<SlideContextValue>({ index: 0, count: 1, isClone: false });
