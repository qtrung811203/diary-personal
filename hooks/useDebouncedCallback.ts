import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): T {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    return () => {
      // Flush instead of discarding: navigating away or unmounting within
      // the debounce window (e.g. clicking prev/next right after typing)
      // must not silently drop the last ~800ms of edits.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (pendingArgsRef.current) {
          fnRef.current(...pendingArgsRef.current);
        }
      }
    };
    // Intentionally runs cleanup only on unmount, not on every delayMs change.
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      pendingArgsRef.current = args;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        pendingArgsRef.current = null;
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  ) as T;
}
