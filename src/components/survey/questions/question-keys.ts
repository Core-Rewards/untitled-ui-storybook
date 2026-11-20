import { useEffect, useRef } from "react";

/** Delay before auto-advancing, so the participant sees their choice register. */
export const AUTO_ADVANCE_MS = 400;

export const letterFor = (index: number) => String.fromCharCode(65 + index);

const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.getAttribute("role") === "combobox";
};

/**
 * Listens for single-key shortcuts (letters, digits) on the window while enabled.
 * Ignores keys typed into fields and keys with modifiers. Return true from the
 * handler to mark the key as handled.
 */
export const useShortcutKeys = (enabled: boolean, handler: (key: string, event: KeyboardEvent) => boolean | void) => {
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
            if (isTypingTarget(event.target)) return;
            if (handlerRef.current(event.key, event)) event.preventDefault();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [enabled]);
};
