"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import DiaryEditor from "@/components/DiaryEditor";
import BackgroundPicker from "@/components/BackgroundPicker";
import MoodPicker from "@/components/MoodPicker";
import FontPicker from "@/components/FontPicker";
import SidebarToggle from "@/components/SidebarToggle";
import { TrashIcon } from "@/components/icons";
import { useJournal } from "@/components/JournalProvider";
import { DEFAULT_BACKGROUND_VALUE } from "@/lib/background";
import { weekdayShort } from "@/lib/dates";
import { extractTitleAndPreview, isDocEmpty } from "@/lib/doc";
import { DEFAULT_EDITOR_FONT, isEditorFont, type EditorFontKey } from "@/lib/fonts";
import { apiFetch } from "@/lib/api-client";

type Entry = {
  id: string;
  date: string;
  createdAt: string;
  contentJson: JSONContent;
  moodId: string | null;
  fontFamily: string;
  backgroundType: string;
  backgroundValue: string;
};

type Load = { status: "loaded"; entry: Entry } | { status: "error" } | { status: "missing" };

const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

// "T3, 27/10/2026 · 10:59" — date from the entry's own local day, time from
// the exact creation instant.
function createdLabel(entry: { date: string; createdAt: string }) {
  const [y, m, d] = entry.date.split("-");
  return `${weekdayShort(entry.date)}, ${d}/${m}/${y} · ${timeFormat.format(new Date(entry.createdAt))}`;
}

// One instance per entry id (the page keys it by id), so every closure below
// is permanently bound to *its* entry: a save that's flushed while switching
// entries can only ever go to the entry it was typed in.
export default function EntryView({ id }: { id: string }) {
  const router = useRouter();
  const { entries, patchEntry, removeEntry } = useJournal();

  const [load, setLoad] = useState<Load | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/diary/${id}`)
      .then(async (res) => {
        if (res.status === 404) return { status: "missing" } as Load;
        if (!res.ok) throw new Error(String(res.status));
        return { status: "loaded", entry: (await res.json()) as Entry } as Load;
      })
      // A failed load must never fall back to an empty entry: the first
      // keystroke's autosave would then overwrite what's really stored.
      .catch(() => ({ status: "error" }) as Load)
      .then((result) => {
        if (!cancelled) setLoad(result);
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryTick]);

  const entry = load?.status === "loaded" ? load.entry : null;

  function save(patch: Record<string, unknown>) {
    setSaveStatus("saving");
    return apiFetch(`/api/diary/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        setSaveStatus("saved");
      })
      .catch(() => setSaveStatus("error"));
  }

  function handleLiveChange(json: JSONContent) {
    patchEntry(id, extractTitleAndPreview(json));
  }

  function handleMood(moodId: string | null) {
    setLoad((cur) =>
      cur?.status === "loaded" ? { status: "loaded", entry: { ...cur.entry, moodId } } : cur
    );
    patchEntry(id, { moodId });
    void save({ moodId });
  }

  function handleFont(fontFamily: EditorFontKey) {
    setLoad((cur) =>
      cur?.status === "loaded" ? { status: "loaded", entry: { ...cur.entry, fontFamily } } : cur
    );
    void save({ fontFamily });
  }

  function handleBackground(type: "color" | "image", value: string) {
    setLoad((cur) =>
      cur?.status === "loaded"
        ? { status: "loaded", entry: { ...cur.entry, backgroundType: type, backgroundValue: value } }
        : cur
    );
    void save({ backgroundType: type, backgroundValue: value });
  }

  async function handleDelete() {
    if (!window.confirm("Xoá nhật ký này? Không thể khôi phục.")) return;
    const res = await apiFetch(`/api/diary/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const index = entries.findIndex((e) => e.id === id);
    const neighbor = entries[index + 1] ?? entries[index - 1];
    removeEntry(id);
    router.replace(neighbor ? `/diary/${neighbor.id}` : "/diary");
  }

  const background = !entry
    ? DEFAULT_BACKGROUND_VALUE
    : entry.backgroundType === "image"
    ? `url(${entry.backgroundValue}) center/cover fixed`
    : entry.backgroundValue;

  if (load?.status === "missing") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-[#7a6f62]">
        <p>Không tìm thấy nhật ký này.</p>
        <Link href="/diary" className="text-[#e8829e] font-semibold">
          Về danh sách
        </Link>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col transition-colors duration-300 ease-out"
      style={{ background }}
    >
      <div className="flex items-center gap-2 px-3 sm:px-5 py-3 shrink-0 flex-wrap">
        <SidebarToggle />
        {entry && <MoodPicker value={entry.moodId} onChange={handleMood} />}
        {saveStatus !== "idle" && (
          <span className="text-xs rounded-full bg-white/75 px-2.5 py-1 text-[#6f655a]">
            {saveStatus === "saving" && "Đang lưu…"}
            {saveStatus === "saved" && <span className="text-[#3f8a52]">Đã lưu</span>}
            {saveStatus === "error" && <span className="text-[#c0392b]">Lỗi lưu</span>}
          </span>
        )}
        {entry && (
          <div className="ml-auto flex items-center gap-2">
            <FontPicker
              value={isEditorFont(entry.fontFamily) ? entry.fontFamily : DEFAULT_EDITOR_FONT}
              onChange={handleFont}
            />
            <BackgroundPicker
              backgroundType={entry.backgroundType === "image" ? "image" : "color"}
              backgroundValue={entry.backgroundValue}
              onChange={handleBackground}
            />
            <button
              type="button"
              title="Xoá nhật ký"
              onClick={handleDelete}
              className="w-10 h-10 rounded-xl border border-white/60 bg-white shadow-sm text-[#c0392b] flex items-center justify-center"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {load?.status === "error" && (
        <div className="mx-3 sm:mx-5 mb-3 bg-[#fdecea] border border-[#f3c6c0] text-[#c0392b] text-[12.5px] font-semibold px-3.5 py-2.5 rounded-[10px] flex items-center justify-between gap-3">
          <span>⚠️ Không tải được nhật ký. Không có gì bị mất — hãy thử lại.</span>
          <button
            type="button"
            onClick={() => {
              setLoad(null);
              setRetryTick((n) => n + 1);
            }}
            className="shrink-0 bg-white border border-[#f3c6c0] rounded-full px-3 py-1 text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 mx-3 sm:mx-5">
        {entry && (
          <DiaryEditor
            initialContent={entry.contentJson}
            autofocus={isDocEmpty(entry.contentJson) ? "start" : "end"}
            fontKey={isEditorFont(entry.fontFamily) ? entry.fontFamily : DEFAULT_EDITOR_FONT}
            onLiveChange={handleLiveChange}
            onChange={(json) => void save({ contentJson: json })}
          />
        )}
        {!load && (
          <div className="flex flex-col gap-3 h-full animate-pulse">
            <div className="h-[52px] rounded-2xl bg-white/50" />
            <div className="flex-1 rounded-[18px] bg-white/40" />
          </div>
        )}
      </div>

      {entry && (
        <div className="shrink-0 px-3 sm:px-5 py-2.5">
          <span className="inline-block rounded-full bg-white/75 px-3 py-1 text-xs text-[#6f655a]">
            {createdLabel(entry)}
          </span>
        </div>
      )}
    </div>
  );
}
