"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarToggle from "@/components/SidebarToggle";
import { PlusIcon } from "@/components/icons";
import { useJournal } from "@/components/JournalProvider";

// /diary has no content of its own: open the newest entry, or invite the
// user to write their first one.
export default function DiaryIndexPage() {
  const router = useRouter();
  const { entries, entriesLoaded, createEntry, creating } = useJournal();
  const latest = entries[0];

  useEffect(() => {
    if (entriesLoaded && latest) router.replace(`/diary/${latest.id}`);
  }, [entriesLoaded, latest, router]);

  if (!entriesLoaded || latest) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 sm:px-5 py-3">
        <SidebarToggle />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="text-5xl">📔</div>
        <p className="text-[#6f655a] max-w-xs leading-relaxed">
          Chưa có nhật ký nào. Hãy viết nhật ký đầu tiên của bạn nhé.
        </p>
        <button
          type="button"
          onClick={createEntry}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e8829e] hover:bg-[#d96b89] text-white font-semibold px-5 py-2.5 shadow-sm disabled:opacity-60"
        >
          <PlusIcon className="w-5 h-5" />
          Viết nhật ký hôm nay
        </button>
      </div>
    </div>
  );
}
