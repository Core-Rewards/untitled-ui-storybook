import type { LogicCondition, LogicTarget, Survey, SurveyQuestion } from "../survey-types";

/*
 * Static checks for jump logic: which questions no path reaches, which rules loop
 * back, and how long the shortest and longest paths are. Used by the Logic tab, the
 * outline ("Only if Q1 is 1 or 2") and, later, the publish checklist.
 */

/** Where the question goes when no rule matches. */
export const defaultTargetOf = (survey: Survey, q: SurveyQuestion): LogicTarget => {
    if (q.defaultTarget) return q.defaultTarget;
    const i = survey.questions.indexOf(q);
    return survey.questions[i + 1]?.id ?? "end";
};

/** Every place a question can lead: each rule's target plus the default. */
export const targetsOf = (survey: Survey, q: SurveyQuestion): LogicTarget[] => [...(q.logic ?? []).map((r) => r.goTo), defaultTargetOf(survey, q)];

export interface LogicReport {
    /** Questions no path reaches. */
    unreachable: string[];
    /** Rules or defaults that point back to the same or an earlier question. */
    loops: { from: string; to: string }[];
    /** Answerable questions on the shortest and longest paths to the end. */
    shortest: number;
    longest: number;
}

export const analyzeLogic = (survey: Survey): LogicReport => {
    const qs = survey.questions;
    const index = new Map(qs.map((q, i) => [q.id, i]));
    const loops: LogicReport["loops"] = [];
    for (const q of qs) {
        for (const t of targetsOf(survey, q)) {
            if (t !== "end" && (index.get(t) ?? Infinity) <= index.get(q.id)!) loops.push({ from: q.id, to: t });
        }
    }

    const reached = new Set<string>();
    const stack = qs[0] ? [qs[0].id] : [];
    while (stack.length) {
        const id = stack.pop()!;
        if (reached.has(id)) continue;
        reached.add(id);
        const q = qs[index.get(id)!];
        if (!q) continue;
        for (const t of targetsOf(survey, q)) if (t !== "end" && index.has(t) && !reached.has(t)) stack.push(t);
    }

    // Path lengths over the forward-only graph (loops are reported separately).
    const memo = new Map<string, [number, number]>();
    const span = (id: string): [number, number] => {
        if (memo.has(id)) return memo.get(id)!;
        const q = qs[index.get(id)!];
        memo.set(id, [0, 0]);
        const own = q.type === "statement" ? 0 : 1;
        const forward = targetsOf(survey, q).filter((t) => t === "end" || (index.get(t) ?? -1) > index.get(id)!);
        const spans = forward.map((t) => (t === "end" ? ([0, 0] as [number, number]) : span(t)));
        const result: [number, number] = spans.length ? [own + Math.min(...spans.map((s) => s[0])), own + Math.max(...spans.map((s) => s[1]))] : [own, own];
        memo.set(id, result);
        return result;
    };
    const [shortest, longest] = qs[0] ? span(qs[0].id) : [0, 0];

    return { unreachable: qs.filter((q) => !reached.has(q.id)).map((q) => q.id), loops, shortest, longest };
};

/** "Q1 is 1 or 2" style text for a condition. */
export const describeCondition = (survey: Survey, c: LogicCondition): string => {
    const i = survey.questions.findIndex((q) => q.id === c.questionId);
    const q = survey.questions[i];
    const n = `Q${i + 1}`;
    const label = (v: string | number) => {
        if (q && "options" in q) return q.options.find((o) => o.id === v)?.label || String(v);
        if (q?.type === "yes_no") return v === "yes" ? "Yes" : "No";
        return String(v);
    };
    const list = (vs: Array<string | number>) => (vs.length <= 1 ? vs.map(label).join("") : `${vs.slice(0, -1).map(label).join(", ")} or ${label(vs.at(-1)!)}`);
    switch (c.operator) {
        case "is_any_of":
            return `${n} is ${list(c.values ?? [])}`;
        case "is_none_of":
            return `${n} is not ${list(c.values ?? [])}`;
        case "is":
            return `${n} is ${label(c.value ?? "")}`;
        case "is_not":
            return `${n} is not ${label(c.value ?? "")}`;
        case "includes":
            return `${n} includes ${label(c.value ?? "")}`;
        case "lt":
            return `${n} is under ${c.value}`;
        case "lte":
            return `${n} is ${c.value} or less`;
        case "gt":
            return `${n} is over ${c.value}`;
        case "gte":
            return `${n} is ${c.value} or more`;
        case "answered":
            return `${n} is answered`;
        case "not_answered":
            return `${n} is skipped`;
    }
};

/**
 * For the outline: if a question is only reached through rules (the question before
 * it doesn't lead to it by default), the conditions that lead there.
 */
export const onlyIf = (survey: Survey, q: SurveyQuestion): string | undefined => {
    const i = survey.questions.indexOf(q);
    if (i <= 0) return undefined;
    const reachedByDefault = survey.questions.some((p) => defaultTargetOf(survey, p) === q.id);
    if (reachedByDefault) return undefined;
    const via = survey.questions.flatMap((p) => (p.logic ?? []).filter((r) => r.goTo === q.id).map((r) => describeCondition(survey, r.when)));
    return via.length ? `Only if ${via.join(" or ")}` : undefined;
};
