"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { preparePhoto, sendPhoto, type CoverFields, type PreparedPhoto, type UploadedPhoto } from "@/lib/image-upload";

export type Photo = UploadedPhoto;
// A photo still uploading: shown straight away from a local preview.
export type PendingPhoto = { key: string; preview: string };

// An entry's photos: uploads (in the order picked), delete and cover. Every
// change reports the entry's new cover fields so the sidebar can follow along.
export function useEntryPhotos(
  entryId: string,
  initial: Photo[],
  initialCover: string | null,
  onCover: (fields: CoverFields) => void
) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [coverId, setCoverId] = useState<string | null>(initialCover ?? initial[0]?.id ?? null);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const onCoverRef = useRef(onCover);
  useEffect(() => {
    onCoverRef.current = onCover;
  });

  const apply = useCallback((fields: CoverFields) => {
    setCoverId(fields.coverPhotoId);
    onCoverRef.current(fields);
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(t);
  }, [error]);

  const add = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      setError(null);
      const jobs = images.map((file, i) => ({ file, key: `${Date.now()}-${i}`, preview: URL.createObjectURL(file) }));
      setPending((list) => [...list, ...jobs.map(({ key, preview }) => ({ key, preview }))]);

      // Photos are shrunk one after another in the background while the
      // uploads go one by one, so they keep the order they were picked in.
      let prepChain: Promise<unknown> = Promise.resolve();
      const prepared = jobs.map((job) => {
        const p: Promise<PreparedPhoto> = prepChain.then(() => preparePhoto(job.file));
        prepChain = p.catch(() => {});
        return p;
      });
      for (const [i, job] of jobs.entries()) {
        try {
          const { photo, ...cover } = await sendPhoto(entryId, job.file, await prepared[i]);
          setPhotos((list) => [...list, photo].sort((a, b) => a.sortOrder - b.sortOrder));
          apply(cover);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Không thêm được ảnh.");
        } finally {
          URL.revokeObjectURL(job.preview);
          setPending((list) => list.filter((p) => p.key !== job.key));
        }
      }
    },
    [entryId, apply]
  );

  const remove = useCallback(
    async (photoId: string) => {
      const res = await apiFetch(`/api/diary/${entryId}/photos/${photoId}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) return setError("Không xoá được ảnh.");
      setPhotos((list) => list.filter((p) => p.id !== photoId));
      apply(await res.json());
    },
    [entryId, apply]
  );

  const setCover = useCallback(
    async (photoId: string) => {
      setCoverId(photoId);
      const res = await apiFetch(`/api/diary/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      }).catch(() => null);
      if (!res?.ok) return setError("Không đặt được ảnh bìa.");
      const data = await res.json();
      apply({
        photoCount: data.photoCount,
        coverPhotoId: data.coverPhotoId,
        coverThumbUrl: data.coverThumbUrl,
        coverColor: data.coverColor,
      });
    },
    [entryId, apply]
  );

  const cover = photos.find((p) => p.id === coverId) ?? photos[0] ?? null;
  return { photos, cover, pending, error, add, remove, setCover };
}

export type EntryPhotos = ReturnType<typeof useEntryPhotos>;
