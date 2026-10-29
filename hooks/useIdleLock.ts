import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

// Calls onIdle() after `ms` without user activity. Browsers throttle timers in
// background tabs, so the elapsed time is also checked when the tab becomes
// visible again.
export function useIdleLock(onIdle: () => void, ms: number, enabled: boolean) {
  const cb = useRef(onIdle);
  useEffect(() => {
    cb.current = onIdle;
  });

  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    let timer = window.setTimeout(fire, ms);

    function fire() {
      cb.current();
    }
    function bump() {
      last = Date.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, ms);
    }
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - last >= ms) fire();
    }

    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, bump, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, bump);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ms, enabled]);
}
