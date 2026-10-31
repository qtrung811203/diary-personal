export type MemoryCard = {
  id: string;
  date: string;
  createdAt: string;
  title: string;
  preview: string;
  moodId: string | null;
  isFavorite: boolean;
  photoCount: number;
  coverThumbUrl: string | null;
  coverColor: string | null;
  backgroundValue: string;
};

export type MemoryPhoto = {
  id: string;
  entryId: string;
  url: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  color: string | null;
};

export type MonthData = { month: string; entries: MemoryCard[]; photos: MemoryPhoto[]; photoTotal: number };

export type MemoryTab = "cards" | "grid" | "timeline";
