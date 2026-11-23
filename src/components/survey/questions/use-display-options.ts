import { useState } from "react";
import type { QuestionOption } from "../survey-types";

const shuffle = <T>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

/** Options in display order, shuffled once per participant view when the question asks for it. */
export const useDisplayOptions = (options: QuestionOption[], randomize?: boolean) => {
    const [ordered] = useState(() => (randomize ? shuffle(options) : options));
    // If the options change (e.g. editing in the builder), show them as given.
    return randomize && ordered.length === options.length ? ordered : options;
};
