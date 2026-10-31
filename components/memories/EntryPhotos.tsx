"use client";

import PhotoThumb from "@/components/photos/PhotoThumb";
import type { Photo } from "@/hooks/useEntryPhotos";
import type { PhotoLayout } from "@/lib/photos";

// The entry's photos on the read view, in the layout chosen while writing.
// (With "cover" the cover itself is already the page's hero image.)
export default function EntryPhotos({
  photos,
  coverId,
  layout,
  onOpen,
}: {
  photos: Photo[];
  coverId: string | null;
  layout: PhotoLayout;
  onOpen: (photo: Photo) => void;
}) {
  const shown = layout === "cover" ? photos.filter((p) => p.id !== coverId) : photos;
  if (shown.length === 0) return null;

  if (layout === "polaroid") {
    return (
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-6 py-3">
        {shown.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p)}
            className="bg-white p-2.5 pb-9 shadow-[0_6px_18px_rgba(58,42,36,0.16)] transition-transform hover:rotate-0 hover:scale-[1.03]"
            style={{ transform: `rotate(${[-3, 2.5, -1.5, 3, -2.5, 1.5][i % 6]}deg)` }}
          >
            <PhotoThumb photo={p} className="w-36 h-36 sm:w-44 sm:h-44" />
          </button>
        ))}
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {shown.map((p) => (
          <button key={p.id} type="button" onClick={() => onOpen(p)} className="block">
            <PhotoThumb photo={p} className="aspect-square rounded-2xl" />
          </button>
        ))}
      </div>
    );
  }

  // cover: the remaining photos small — a swipeable row on phones.
  return (
    <div className="flex sm:grid sm:grid-cols-3 gap-2.5 overflow-x-auto no-scrollbar -mx-5 px-5 scroll-px-5 sm:mx-0 sm:px-0 snap-x">
      {shown.map((p) => (
        <button key={p.id} type="button" onClick={() => onOpen(p)} className="block shrink-0 w-[70%] sm:w-auto snap-start">
          <PhotoThumb photo={p} className="aspect-[4/3] rounded-2xl" />
        </button>
      ))}
    </div>
  );
}
