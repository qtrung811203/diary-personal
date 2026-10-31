"use client";

import { useState } from "react";
import PhotoPicker from "@/components/PhotoPicker";
import { PlusIcon } from "@/components/icons";
import type { EntryPhotos, Photo } from "@/hooks/useEntryPhotos";
import type { PhotoLayout } from "@/lib/photos";
import PhotoThumb from "./PhotoThumb";
import PhotoActions from "./PhotoActions";
import PhotoLayoutPicker, { LAYOUT_INFO } from "./PhotoLayoutPicker";
import Lightbox from "./Lightbox";

type Props = { photos: EntryPhotos; layout: PhotoLayout; onLayout: (l: PhotoLayout) => void };

// Tapping a photo opens its actions; "Xem ảnh lớn" opens the viewer.
function usePhotoDialogs(photos: EntryPhotos) {
  const [active, setActive] = useState<Photo | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const dialogs = (
    <>
      {active && (
        <PhotoActions
          photo={active}
          isCover={photos.cover?.id === active.id}
          onClose={() => setActive(null)}
          onCover={() => {
            void photos.setCover(active.id);
            setActive(null);
          }}
          onView={() => {
            setViewing(Math.max(0, photos.photos.findIndex((p) => p.id === active.id)));
            setActive(null);
          }}
          onDelete={() => {
            void photos.remove(active.id);
            setActive(null);
          }}
        />
      )}
      {viewing !== null && (
        <Lightbox photos={photos.photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
  return { open: setActive, dialogs };
}

function Pending({ preview, className }: { preview: string; className: string }) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
      <img src={preview} alt="" className="w-full h-full object-cover opacity-60" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-6 h-6 rounded-full border-[3px] border-white/70 border-t-[#e8829e] animate-spin" />
      </span>
    </span>
  );
}

function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="rounded-lg bg-[#fdecea] px-2.5 py-1.5 text-xs font-semibold text-[#c0392b]">{text}</p>;
}

// Desktop: the "Ảnh của ngày" column beside the writing card.
export function PhotoPanel({ photos, layout, onLayout }: Props) {
  const { open, dialogs } = usePhotoDialogs(photos);
  const [dragOver, setDragOver] = useState(false);
  const { cover, pending } = photos;
  const tile = "aspect-square rounded-xl";

  return (
    <aside
      className={`h-full overflow-y-auto no-scrollbar rounded-[18px] border bg-[#fff6ec]/95 p-4 flex flex-col gap-3 transition-colors ${
        dragOver ? "border-[#e8829e] border-dashed" : "border-[#f1e3d3]"
      }`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void photos.add(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-[#8a7f73]">
        <span>Ảnh của ngày</span>
        <span className="normal-case tracking-normal text-[#3a332c]">{photos.photos.length} ảnh</span>
      </div>

      {cover ? (
        <button type="button" onClick={() => open(cover)} className="relative block w-full text-left">
          <PhotoThumb photo={cover} className="aspect-[4/3] rounded-2xl" eager />
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#ffd1de]/95 px-2.5 py-1 text-[11px] font-bold text-[#c25576]">
            Ảnh bìa
          </span>
        </button>
      ) : (
        <PhotoPicker
          onPick={(f) => void photos.add(f)}
          className="aspect-[4/3] w-full rounded-2xl border-2 border-dashed border-[#f0b8c7] bg-white/60 text-[#c25576] flex flex-col items-center justify-center gap-1.5 hover:bg-white"
        >
          <PlusIcon className="w-7 h-7" />
          <span className="text-sm font-semibold">Thêm ảnh của ngày</span>
          <span className="text-[11px] text-[#a1968a]">hoặc kéo thả, dán ảnh vào đây</span>
        </PhotoPicker>
      )}

      {(photos.photos.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {photos.photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open(p)}
              className={`rounded-xl ring-offset-2 ring-offset-[#fff6ec] ${p.id === cover?.id ? "ring-2 ring-[#e8829e]" : "hover:ring-2 hover:ring-[#ffd1de]"}`}
            >
              <PhotoThumb photo={p} className={tile} />
            </button>
          ))}
          {pending.map((p) => (
            <Pending key={p.key} preview={p.preview} className={tile} />
          ))}
          <PhotoPicker
            onPick={(f) => void photos.add(f)}
            className={`${tile} border-2 border-dashed border-[#f0b8c7] text-[#e8829e] flex items-center justify-center hover:bg-white`}
          >
            <PlusIcon className="w-6 h-6" />
          </PhotoPicker>
        </div>
      )}

      <ErrorNote text={photos.error} />

      <div className="mt-1">
        <div className="text-[12px] font-bold text-[#3a332c]">Cách hiển thị ảnh khi xem lại</div>
        <p className="mt-1 mb-2.5 text-[11.5px] leading-snug text-[#8a7f73]">
          Chọn ảnh sẽ hiện thế nào khi bạn mở lại hoặc lướt nhật ký này. Không ảnh hưởng khi đang viết.
        </p>
        <PhotoLayoutPicker value={layout} onChange={onLayout} />
      </div>
      {dialogs}
    </aside>
  );
}

// Phone: a strip of photos at the top of the writing card.
export function PhotoStrip({ photos, layout, onLayout }: Props) {
  const { open, dialogs } = usePhotoDialogs(photos);
  const [picking, setPicking] = useState(false);
  const { cover, pending } = photos;
  const tile = "w-[72px] h-[72px] rounded-2xl shrink-0";

  return (
    <div className="mb-3 -mx-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#8a7f73]">Ảnh · {photos.photos.length}</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPicking(true)}
          className="rounded-full bg-[#fbe9d6] px-2.5 py-1 text-[11px] font-semibold text-[#6f655a]"
        >
          Kiểu xem lại: {LAYOUT_INFO[layout].name}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
        <PhotoPicker
          onPick={(f) => void photos.add(f)}
          className={`${tile} border-2 border-dashed border-[#f0b8c7] text-[#e8829e] flex items-center justify-center`}
        >
          <PlusIcon className="w-6 h-6" />
        </PhotoPicker>
        {photos.photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => open(p)}
            className="relative shrink-0"
          >
            <PhotoThumb photo={p} className={tile} />
            {p.id === cover?.id && (
              <span className="absolute bottom-1 left-1 rounded-full bg-[#ffd1de]/95 px-1.5 py-0.5 text-[10px] font-bold text-[#c25576]">
                Bìa
              </span>
            )}
          </button>
        ))}
        {pending.map((p) => (
          <Pending key={p.key} preview={p.preview} className={tile} />
        ))}
      </div>
      <ErrorNote text={photos.error} />

      {picking && (
        <div className="fixed inset-0 z-50 bg-[#3a332c]/25 flex items-end" onClick={() => setPicking(false)}>
          <div
            className="w-full rounded-t-3xl bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold text-[#3a332c] mb-1">Cách hiển thị ảnh khi xem lại</div>
            <p className="text-[12px] text-[#8a7f73] mb-3">Không ảnh hưởng khi đang viết.</p>
            <PhotoLayoutPicker
              value={layout}
              onChange={(l) => {
                onLayout(l);
                setPicking(false);
              }}
            />
          </div>
        </div>
      )}
      {dialogs}
    </div>
  );
}
