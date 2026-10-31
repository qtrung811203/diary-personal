import type { DocNode } from "./doc";

// Photos used to be inline TipTap image nodes; they now live beside the text.
// These helpers move old ones out and keep the entry's cover fields in sync.

export const PHOTO_LAYOUTS = ["cover", "grid", "polaroid"] as const;
export type PhotoLayout = (typeof PHOTO_LAYOUTS)[number];
export const isPhotoLayout = (v: unknown): v is PhotoLayout =>
  typeof v === "string" && (PHOTO_LAYOUTS as readonly string[]).includes(v);

export const MAX_PHOTOS_PER_ENTRY = 60;

export function extractImages(input: unknown): string[] {
  const out: string[] = [];
  const walk = (node: DocNode) => {
    if (node.type === "image") {
      const src = node.attrs?.src;
      if (typeof src === "string" && src) out.push(src);
    }
    node.content?.forEach(walk);
  };
  walk((input ?? {}) as DocNode);
  return out;
}

const isEmptyParagraph = (n: DocNode | undefined) => n?.type === "paragraph" && !n.content?.length;

// Drops image nodes, plus the empty paragraph the old inserter added right
// after each one (so the text doesn't end up full of blank lines).
export function stripImages<T>(input: T): T {
  const strip = (node: DocNode): DocNode => {
    if (!node.content) return node;
    const content: DocNode[] = [];
    for (let i = 0; i < node.content.length; i++) {
      const child = node.content[i];
      if (child.type === "image") {
        if (isEmptyParagraph(node.content[i + 1])) i++;
        continue;
      }
      content.push(strip(child));
    }
    return { ...node, content };
  };
  if (extractImages(input).length === 0) return input;
  return strip(input as DocNode) as T;
}

type PhotoLike = { id: string; url: string; thumbUrl: string | null; color: string | null };

// Cover = the chosen photo if it still exists, else the first one.
export function coverFields(photos: PhotoLike[], coverPhotoId: string | null) {
  const cover = photos.find((p) => p.id === coverPhotoId) ?? photos[0];
  return {
    photoCount: photos.length,
    coverPhotoId: cover?.id ?? null,
    coverThumbUrl: cover ? (cover.thumbUrl ?? cover.url) : null,
    coverColor: cover?.color ?? null,
  };
}
