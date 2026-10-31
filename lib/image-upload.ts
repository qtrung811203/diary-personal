import { apiFetch } from "./api-client";

export const MAX_EDGE = 2000;
// Thumbnails for lists, cards and calendars: small enough (~20–40KB) that a
// month of photos loads instantly.
export const THUMB_EDGE = 480;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;
const SERVER_LIMIT_BYTES = 5 * 1024 * 1024;
const JPEG_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;

export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// GIFs are never re-encoded (it would drop the animation).
export function needsCompression(img: { type: string; size: number; width: number; height: number }): boolean {
  if (img.type === "image/gif") return false;
  return img.size > COMPRESS_ABOVE_BYTES || Math.max(img.width, img.height) > MAX_EDGE;
}

export const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function draw(bitmap: ImageBitmap, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không xử lý được ảnh.");
  // JPEG has no alpha: paint white first so transparent PNGs don't turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, ctx };
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export type PreparedPhoto = { full: Blob; thumb: Blob; width: number; height: number; color: string };

// Phone photos are several MB: shrink to a JPEG under the 5MB limit, and make
// a small WebP thumbnail plus the average colour (shown while loading).
// imageOrientation keeps portrait shots upright.
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (file.type === "image/gif" && file.size > SERVER_LIMIT_BYTES) throw new Error("Ảnh GIF quá lớn (tối đa 5MB).");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Không đọc được ảnh này (định dạng không được hỗ trợ).");
  }

  try {
    const { width, height } = bitmap;
    let full: Blob = file;
    let size = { width, height };
    if (needsCompression({ type: file.type, size: file.size, width, height })) {
      size = fitWithin(width, height, MAX_EDGE);
      const blob = await toBlob(draw(bitmap, size.width, size.height).canvas, "image/jpeg", JPEG_QUALITY);
      if (!blob) throw new Error("Không nén được ảnh.");
      full = blob;
    }
    if (full.size > SERVER_LIMIT_BYTES) throw new Error("Ảnh quá lớn (tối đa 5MB).");

    const t = fitWithin(width, height, THUMB_EDGE);
    const { canvas } = draw(bitmap, t.width, t.height);
    // Safari before 14 can't encode WebP and silently returns PNG; use JPEG then.
    let thumb = await toBlob(canvas, "image/webp", THUMB_QUALITY);
    if (!thumb || thumb.type !== "image/webp") thumb = await toBlob(canvas, "image/jpeg", THUMB_QUALITY);
    if (!thumb) throw new Error("Không xử lý được ảnh.");

    const { ctx: px } = draw(bitmap, 1, 1);
    const [r, g, b] = px.getImageData(0, 0, 1, 1).data;

    return { full, thumb, width: size.width, height: size.height, color: toHex(r, g, b) };
  } finally {
    bitmap.close();
  }
}

export type UploadedPhoto = {
  id: string;
  url: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  color: string | null;
  sortOrder: number;
};

export type CoverFields = {
  photoCount: number;
  coverPhotoId: string | null;
  coverThumbUrl: string | null;
  coverColor: string | null;
};

export async function sendPhoto(
  entryId: string,
  file: File,
  p: PreparedPhoto
): Promise<{ photo: UploadedPhoto } & CoverFields> {
  const form = new FormData();
  form.append("file", p.full, p.full === file ? file.name : "photo.jpg");
  form.append("thumb", p.thumb, p.thumb.type === "image/webp" ? "thumb.webp" : "thumb.jpg");
  form.append("width", String(p.width));
  form.append("height", String(p.height));
  form.append("color", p.color);
  const res = await apiFetch(`/api/diary/${entryId}/photos`, { method: "POST", body: form }).catch(() => null);
  if (!res) throw new Error("Không kết nối được máy chủ.");
  if (res.status === 423) throw new Error("Phiên đã khoá, nhập lại mã PIN.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Tải ảnh lên thất bại.");
  return data;
}
