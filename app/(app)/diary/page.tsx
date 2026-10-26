"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Client-side on purpose: a server-rendered redirect would use the VPS's
// local clock (usually UTC), which mislabels "today" for hours every day
// for a user elsewhere (e.g. UTC+7) — see ledger Final review, finding 4.
function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DiaryIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/diary/${todayDateString()}`);
  }, [router]);

  return null;
}
