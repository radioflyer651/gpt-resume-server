

/** If a value is null, then returns undefined.  Otherwise, returns the input value. */
export function nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
}