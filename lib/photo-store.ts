import { prisma } from "./prisma";
import { coverFields, extractImages, stripImages } from "./photos";
import { countWords, extractTitleAndPreview, normalizeDoc } from "./doc";
import { deleteImageByUrl } from "./storage";

export const photoSelect = {
  id: true,
  url: true,
  thumbUrl: true,
  width: true,
  height: true,
  color: true,
  sortOrder: true,
} as const;

// Re-derives the cover/count copied onto the entry from its photos.
export async function refreshCover(entryId: string, coverPhotoId?: string | null) {
  const [entry, photos] = await Promise.all([
    prisma.diaryEntry.findUnique({ where: { id: entryId }, select: { coverPhotoId: true } }),
    prisma.entryPhoto.findMany({ where: { entryId }, orderBy: { sortOrder: "asc" }, select: photoSelect }),
  ]);
  const fields = coverFields(photos, coverPhotoId === undefined ? (entry?.coverPhotoId ?? null) : coverPhotoId);
  await prisma.diaryEntry.update({ where: { id: entryId }, data: fields });
  return fields;
}

export function deletePhotoObjects(photos: { url: string; thumbUrl: string | null }[]) {
  for (const p of photos) {
    deleteImageByUrl(p.url).catch(() => {});
    if (p.thumbUrl) deleteImageByUrl(p.thumbUrl).catch(() => {});
  }
}

// One-off, lazy: entries written while photos were inline images get them
// moved into EntryPhoto (in document order) and stripped from the text.
// Runs on the sidebar load and before an entry is opened (so an editor
// without image support never sees, and re-saves without, the old images);
// no deploy step needed.
export async function migrateInlineImages(userId: string, entryId?: string) {
  const rows = entryId
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "DiaryEntry"
        WHERE id = ${entryId} AND "userId" = ${userId} AND "contentJson"::text LIKE '%"type": "image"%'`
    : await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "DiaryEntry"
        WHERE "userId" = ${userId} AND "contentJson"::text LIKE '%"type": "image"%'
        LIMIT 100`;
  for (const { id } of rows) {
    const entry = await prisma.diaryEntry.findUnique({ where: { id }, select: { contentJson: true } });
    if (!entry) continue;
    const srcs = extractImages(entry.contentJson);
    const doc = normalizeDoc(stripImages(entry.contentJson));
    // Sidebar load and entry open can race; only the run whose update still
    // matches the original text adds the photos.
    const moved = await prisma.$transaction(async (tx) => {
      const { count } = await tx.diaryEntry.updateMany({
        where: { id, contentJson: { equals: entry.contentJson as object } },
        data: { contentJson: doc as object, ...extractTitleAndPreview(doc), words: countWords(doc) },
      });
      if (count === 0) return false;
      const last = await tx.entryPhoto.aggregate({ where: { entryId: id }, _max: { sortOrder: true } });
      const start = (last._max.sortOrder ?? -1) + 1;
      await tx.entryPhoto.createMany({
        data: srcs.map((url, i) => ({ entryId: id, userId, url, sortOrder: start + i })),
      });
      return true;
    });
    if (!moved) continue;
    await refreshCover(id);
  }
}
