import type { Prisma } from "@prisma/client";

// Entries worth showing as memories: anything with a title, text or photos.
export const nonEmptyEntry: Prisma.DiaryEntryWhereInput = {
  OR: [{ title: { not: "" } }, { words: { gt: 0 } }, { photoCount: { gt: 0 } }],
};

export const memoryCardSelect = {
  id: true,
  date: true,
  createdAt: true,
  title: true,
  preview: true,
  moodId: true,
  isFavorite: true,
  photoCount: true,
  coverThumbUrl: true,
  coverColor: true,
  backgroundValue: true,
} as const;
