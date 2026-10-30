"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toDateString } from "@/lib/dates";
import { markEditIntent } from "@/lib/edit-intent";
import type { MoodGroup } from "@/lib/moods";
import { apiFetch } from "@/lib/api-client";

export type EntrySummary = {
  id: string;
  date: string;
  createdAt: string;
  title: string;
  preview: string;
  moodId: string | null;
  isFavorite: boolean;
};

export type Mood = { id: string; name: string; icon: string; group: MoodGroup };

type MoodInput = { name: string; icon: string; group: MoodGroup };

type JournalContextValue = {
  entries: EntrySummary[];
  entriesLoaded: boolean;
  moods: Mood[];
  // Desktop: persisted preference (null = never chosen -> open). Mobile: a
  // transient drawer that always starts closed.
  desktopOpen: boolean | null;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  closeSidebarOnMobile: () => void;
  patchEntry: (id: string, patch: Partial<EntrySummary>) => void;
  removeEntry: (id: string) => void;
  // No date = today. A past "YYYY-MM-DD" files a backdated entry.
  createEntry: (date?: string) => Promise<void>;
  creating: boolean;
  addMood: (input: MoodInput) => Promise<{ ok: true; mood: Mood } | { ok: false; error: string }>;
  deleteMood: (id: string) => Promise<void>;
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside <JournalProvider>");
  return ctx;
}

const SIDEBAR_KEY = "diary.sidebarOpen";
const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 768;

// The desktop sidebar preference lives in localStorage; exposing it as an
// external store keeps server and first client render identical (null) and
// then switches to the stored value without setState-in-effect.
const prefListeners = new Set<() => void>();
function readSidebarPref(): boolean | null {
  try {
    const v = localStorage.getItem(SIDEBAR_KEY);
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
}
function subscribeSidebarPref(cb: () => void) {
  prefListeners.add(cb);
  return () => {
    prefListeners.delete(cb);
  };
}
function writeSidebarPref(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  } catch {}
  prefListeners.forEach((l) => l());
}

export default function JournalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [moods, setMoods] = useState<Mood[]>([]);
  const desktopOpen = useSyncExternalStore(subscribeSidebarPref, readSidebarPref, () => null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/diary")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d: { entries: EntrySummary[] }) => {
        if (cancelled) return;
        setEntries(d.entries);
        setEntriesLoaded(true);
      })
      .catch(() => !cancelled && setEntriesLoaded(true));
    apiFetch("/api/moods")
      .then((r) => (r.ok ? r.json() : { moods: [] }))
      .then((d: { moods: Mood[] }) => !cancelled && setMoods(d.moods))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isDesktop()) writeSidebarPref(readSidebarPref() === false);
    else setMobileOpen((v) => !v);
  }, []);

  const closeSidebarOnMobile = useCallback(() => setMobileOpen(false), []);

  const patchEntry = useCallback((id: string, patch: Partial<EntrySummary>) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((list) => list.filter((e) => e.id !== id));
  }, []);

  const createEntry = useCallback(async (date?: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const now = new Date();
      const today = toDateString(now);
      const day = date ?? today;
      // A backdated entry gets that day plus the current time of day, so it
      // sorts (and is labelled) under the day it was written for.
      const createdAt =
        day === today ? undefined : new Date(`${day}T${now.toTimeString().slice(0, 8)}`).toISOString();
      const res = await apiFetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: day, createdAt }),
      });
      if (!res.ok) return;
      const entry: EntrySummary = await res.json();
      setEntries((list) => [
        {
          id: entry.id,
          date: entry.date,
          createdAt: entry.createdAt,
          title: "",
          preview: "",
          moodId: null,
          isFavorite: false,
        },
        ...list,
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      closeSidebarOnMobile();
      // A day written after the fact opens ready to write in.
      markEditIntent(entry.id);
      router.push(`/diary/${entry.id}`);
    } finally {
      setCreating(false);
    }
  }, [creating, router, closeSidebarOnMobile]);

  const addMood = useCallback(async (input: MoodInput) => {
    const res = await apiFetch("/api/moods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false as const, error: data.error ?? "Không thêm được mood." };
    setMoods((list) => [...list, data as Mood]);
    return { ok: true as const, mood: data as Mood };
  }, []);

  const deleteMood = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/moods/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMoods((list) => list.filter((m) => m.id !== id));
    setEntries((list) => list.map((e) => (e.moodId === id ? { ...e, moodId: null } : e)));
  }, []);

  const value = useMemo(
    () => ({
      entries,
      entriesLoaded,
      moods,
      desktopOpen,
      mobileOpen,
      toggleSidebar,
      closeSidebarOnMobile,
      patchEntry,
      removeEntry,
      createEntry,
      creating,
      addMood,
      deleteMood,
    }),
    [
      entries,
      entriesLoaded,
      moods,
      desktopOpen,
      mobileOpen,
      toggleSidebar,
      closeSidebarOnMobile,
      patchEntry,
      removeEntry,
      createEntry,
      creating,
      addMood,
      deleteMood,
    ]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}
