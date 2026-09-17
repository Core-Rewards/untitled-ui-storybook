import { useCallback, useState } from "react";

/**
 * Lets a component own a piece of state by default while still allowing a
 * consumer to take control of it.
 *
 * Passing `controlledValue` (anything other than `undefined`) makes the value
 * controlled: the component stops tracking it internally and simply reports
 * changes through `onChange`.
 */
export function useControllableState<T>(controlledValue: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void] {
    const [internalValue, setInternalValue] = useState<T>(defaultValue);

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const setValue = useCallback(
        (next: T) => {
            if (!isControlled) {
                setInternalValue(next);
            }
            onChange?.(next);
        },
        [isControlled, onChange],
    );

    return [value, setValue];
}
