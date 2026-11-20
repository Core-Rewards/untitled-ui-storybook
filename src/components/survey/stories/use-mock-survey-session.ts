import { useCallback, useRef, useState } from "react";
import type { Survey, SurveyResponse, SurveySubmitResult } from "../survey-types";

export interface MockSessionEvent {
    at: string;
    kind: "autosave" | "submit" | "reward_paid" | "duplicate_ignored" | "exit";
    detail: string;
}

/**
 * Stands in for the platform in stories: autosaves the response, submits after a
 * short delay and pays the reward once per participant, however many times submit
 * is called. The event log makes autosave and payout visible.
 */
export const useMockSurveySession = (survey: Survey, initial?: SurveyResponse, { submitDelayMs = 900, failFirstSubmit = false } = {}) => {
    const [response, setResponse] = useState<SurveyResponse | undefined>(initial);
    const [events, setEvents] = useState<MockSessionEvent[]>([]);
    const [pointsPaid, setPointsPaid] = useState(0);
    const paid = useRef(initial?.status === "complete");
    const attempts = useRef(0);

    const log = useCallback((kind: MockSessionEvent["kind"], detail: string) => {
        setEvents((e) => [{ at: new Date().toLocaleTimeString(), kind, detail }, ...e].slice(0, 30));
    }, []);

    const onResponseChange = useCallback(
        (next: SurveyResponse) => {
            setResponse(next);
            const answered = Object.values(next.answers).filter((v) => v !== undefined).length;
            log("autosave", `${answered} answered · ${next.status}`);
        },
        [log],
    );

    const onSubmit = useCallback(
        async (final: SurveyResponse): Promise<SurveySubmitResult> => {
            attempts.current += 1;
            log("submit", `attempt ${attempts.current}`);
            await new Promise((r) => setTimeout(r, submitDelayMs));
            if (failFirstSubmit && attempts.current === 1) throw new Error("Network error");
            setResponse(final);
            if (paid.current) {
                log("duplicate_ignored", "reward already paid for this participant");
            } else if (survey.reward) {
                paid.current = true;
                setPointsPaid(survey.reward.type === "points" ? survey.reward.amount : 0);
                log("reward_paid", `${survey.reward.amount} ${survey.reward.type}`);
            }
            return { reward: survey.reward };
        },
        [failFirstSubmit, log, submitDelayMs, survey.reward],
    );

    const onExit = useCallback((r: SurveyResponse) => log("exit", `saved at ${Object.keys(r.answers).length} answered`), [log]);

    const reset = useCallback((next?: SurveyResponse) => {
        setResponse(next);
        setEvents([]);
        setPointsPaid(0);
        paid.current = next?.status === "complete";
        attempts.current = 0;
    }, []);

    return { response, events, pointsPaid, onResponseChange, onSubmit, onExit, reset };
};
