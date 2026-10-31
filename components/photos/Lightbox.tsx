"use client";

/* eslint-disable @next/next/no-img-element -- full-size photo from storage. */

import { useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";

type PhotoLike = { id: string; url: string; color?: string | null };

// Full-screen photo viewer: arrows / swipe to move, Esc or ✕ to close.
export default function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: PhotoLike[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const touchX = useRef<number | null>(null);
  const photo = photos[index];
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndex, onClose]);

  if (!photo) return null;
  const navBtn =
    "hidden sm:flex absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white items-center justify-center";

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#1f1814]/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <img
        key={photo.id}
        src={photo.url}
        alt=""
        className="max-w-[94vw] max-h-[86vh] object-contain rounded-xl shadow-2xl"
        style={{ background: photo.color ?? undefined }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" aria-label="Ảnh trước" className={`${navBtn} left-4`} onClick={(e) => (e.stopPropagation(), go(-1))}>
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button type="button" aria-label="Ảnh sau" className={`${navBtn} right-4`} onClick={(e) => (e.stopPropagation(), go(1))}>
            <ChevronRightIcon className="w-6 h-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            {index + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}
