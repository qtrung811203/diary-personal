"use client";

import { useEffect } from "react";

// iOS Safari ignores `interactive-widget`: opening the keyboard shrinks only
// the *visual* viewport and leaves fixed/dvh layouts behind it. While the
// keyboard is open, mirror the visual viewport's height into --app-h so the
// app shell (h-[var(--app-h,100dvh)]) ends exactly above the keyboard.
export default function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    const sync = () => {
      const keyboardOpen = window.innerHeight - vv.height > 120 && vv.scale <= 1.01;
      if (keyboardOpen) {
        root.style.setProperty("--app-h", `${vv.height}px`);
        window.scrollTo(0, 0);
      } else {
        root.style.removeProperty("--app-h");
      }
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      root.style.removeProperty("--app-h");
    };
  }, []);

  return null;
}
