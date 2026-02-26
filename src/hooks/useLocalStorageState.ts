import { useState, useEffect, useCallback, useRef } from "react";

interface UseLocalStorageStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

/**
 * Generic hook that persists state in localStorage.
 * Returns [value, setValue, clear] — clear removes the key from localStorage and resets to defaultValue.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  options?: UseLocalStorageStateOptions<T>,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;

  const resolveDefault = (): T =>
    typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return deserialize(raw);
      }
    } catch {
      // ignore corrupt data
    }
    return resolveDefault();
  });

  // Keep key stable across renders for the effect
  const keyRef = useRef(key);
  keyRef.current = key;

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, serialize(state));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [state, serialize]);

  const clear = useCallback(() => {
    localStorage.removeItem(keyRef.current);
    setState(resolveDefault());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setState, clear];
}
