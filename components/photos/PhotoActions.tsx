"use client";

import { EyeIcon, ImageIcon, TrashIcon } from "@/components/icons";
import PhotoThumb from "./PhotoThumb";
import type { Photo } from "@/hooks/useEntryPhotos";

// What can be done with one photo: a bottom sheet on phones, a small card in
// the middle of the screen on desktop.
export default function PhotoActions({
  photo,
  isCover,
  onCover,
  onView,
  onDelete,
  onClose,
}: {
  photo: Photo;
  isCover: boolean;
  onCover: () => void;
  onView: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const item =
    "w-full rounded-xl px-3.5 py-3 text-[15px] font-semibold text-[#3a332c] hover:bg-[#fff0f4] flex items-center gap-3 disabled:opacity-45 disabled:hover:bg-transparent";
  return (
    <div className="fixed inset-0 z-50 bg-[#3a332c]/25 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="w-full md:w-[320px] rounded-t-3xl md:rounded-3xl bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-2 mb-1">
          <PhotoThumb photo={photo} className="w-14 h-14 rounded-xl shrink-0" eager />
          <div className="text-sm text-[#7a6f62]">{isCover ? "Đang là ảnh bìa" : "Ảnh của ngày"}</div>
        </div>
        <button type="button" className={item} disabled={isCover} onClick={onCover}>
          <ImageIcon className="w-5 h-5 text-[#e8829e]" /> Đặt làm ảnh bìa
        </button>
        <button type="button" className={item} onClick={onView}>
          <EyeIcon className="w-5 h-5 text-[#e8829e]" /> Xem ảnh lớn
        </button>
        <button
          type="button"
          className={`${item} text-[#c0392b] hover:bg-[#fdecea]`}
          onClick={() => window.confirm("Xoá ảnh này khỏi nhật ký?") && onDelete()}
        >
          <TrashIcon className="w-5 h-5" /> Xoá ảnh
        </button>
        <button type="button" className={`${item} justify-center text-[#7a6f62] mt-1`} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
