"use client";

import { PanelIcon } from "./icons";
import { useJournal } from "./JournalProvider";

export default function SidebarToggle() {
  const { toggleSidebar } = useJournal();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title="Hiện / ẩn thanh bên"
      className="w-10 h-10 rounded-xl border border-white/60 bg-white shadow-sm text-[#7a6f62] flex items-center justify-center shrink-0"
    >
      <PanelIcon className="w-5 h-5" />
    </button>
  );
}
