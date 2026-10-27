"use client";

import { useState } from "react";
import { MOOD_GROUPS, MOOD_GROUP_META, type MoodGroup } from "@/lib/moods";
import { useJournal } from "./JournalProvider";

export default function MoodPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { moods, addMood, deleteMood } = useJournal();
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MoodGroup>("positive");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = moods.find((m) => m.id === value);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await addMood({ icon, name, group });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIcon("");
    setName("");
    onChange(result.mood.id);
    setOpen(false);
  }

  async function handleDelete(id: string, label: string) {
    if (
      !window.confirm(
        `Xoá mood "${label}"? Các nhật ký đang dùng nó sẽ chuyển thành chưa chọn tâm trạng.`
      )
    )
      return;
    await deleteMood(id);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 rounded-xl border border-white/60 bg-white shadow-sm px-3 flex items-center gap-2 text-sm font-semibold text-[#3a332c] max-w-[60vw]"
      >
        <span className="text-lg leading-none">{selected ? selected.icon : "🫥"}</span>
        <span className="truncate">{selected ? selected.name : "Chọn tâm trạng"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-30 w-[min(92vw,380px)] max-h-[72vh] overflow-y-auto rounded-2xl border border-[#e7ddd0] bg-white p-3.5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-[#7a6f62] tracking-wide">TÂM TRẠNG HÔM NAY</div>
              <button
                type="button"
                onClick={() => setManage((v) => !v)}
                className="text-xs font-semibold text-[#e8829e]"
              >
                {manage ? "Xong" : "Sửa danh sách"}
              </button>
            </div>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mb-2 text-xs text-[#7a6f62] underline"
              >
                Bỏ chọn tâm trạng
              </button>
            )}

            {MOOD_GROUPS.map((g) => {
              const items = moods.filter((m) => m.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7a6f62] mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: MOOD_GROUP_META[g].color }}
                    />
                    {MOOD_GROUP_META[g].label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((m) => (
                      <div key={m.id} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (manage) return;
                            onChange(m.id);
                            setOpen(false);
                          }}
                          className={`rounded-full border px-2.5 py-1 text-[13px] flex items-center gap-1.5 ${
                            m.id === value
                              ? "border-[#e8829e] bg-[#ffd1de] font-bold"
                              : "border-[#eadfd2] bg-[#fffaf3] hover:bg-[#fff0f4]"
                          } ${manage ? "pr-7" : ""}`}
                        >
                          <span className="text-base leading-none">{m.icon}</span>
                          {m.name}
                        </button>
                        {manage && (
                          <button
                            type="button"
                            title="Xoá mood này"
                            onClick={() => handleDelete(m.id, m.name)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[11px] text-[#c0392b] hover:bg-[#fdecea]"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <form onSubmit={handleAdd} className="mt-2 pt-3 border-t border-[#f1e7da]">
              <div className="text-xs font-bold text-[#7a6f62] mb-2">THÊM MOOD MỚI</div>
              <div className="flex gap-2">
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🙂"
                  aria-label="Icon (emoji)"
                  className="w-14 text-center text-xl rounded-lg border border-[#e7ddd0] py-1.5 outline-none focus:border-[#e8829e]"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên tâm trạng"
                  maxLength={30}
                  className="flex-1 min-w-0 rounded-lg border border-[#e7ddd0] px-3 text-sm outline-none focus:border-[#e8829e]"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as MoodGroup)}
                  className="flex-1 min-w-0 rounded-lg border border-[#e7ddd0] px-2 py-1.5 text-sm bg-white outline-none focus:border-[#e8829e]"
                >
                  {MOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {MOOD_GROUP_META[g].label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={busy || !icon.trim() || !name.trim()}
                  className="rounded-lg bg-[#e8829e] hover:bg-[#d96b89] text-white text-sm font-semibold px-4 disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
              <p className="text-[11px] text-[#a1968a] mt-1.5">
                Icon là một emoji (gõ hoặc dán). Nhóm dùng để thống kê trên Tổng quan.
              </p>
              {error && <p className="text-xs text-[#c0392b] mt-1">{error}</p>}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
