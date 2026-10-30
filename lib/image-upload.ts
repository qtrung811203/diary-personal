import { apiFetch } from "./api-client";

export const MAX_EDGE = 2000;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;
const SERVER_LIMIT_BYTES = 5 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

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

// Phone photos are several MB; shrink them to a JPEG that fits the 5MB
// upload limit. imageOrientation keeps portrait shots upright.
async function prepareImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") {
    if (file.size > SERVER_LIMIT_BYTES) throw new Error("Ảnh GIF quá lớn (tối đa 5MB).");
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Không đọc được ảnh này (định dạng không được hỗ trợ).");
  }

  try {
    if (!needsCompression({ type: file.type, size: file.size, width: bitmap.width, height: bitmap.height })) {
      return file;
    }
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không xử lý được ảnh.");
    // JPEG has no alpha: paint white first so transparent PNGs don't turn black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("Không nén được ảnh.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function uploadImageFile(file: File): Promise<string> {
  const blob = await prepareImage(file);
  if (blob.size > SERVER_LIMIT_BYTES) throw new Error("Ảnh quá lớn (tối đa 5MB).");

  const form = new FormData();
  form.append("file", blob, blob === file ? file.name : "photo.jpg");
  const res = await apiFetch("/api/upload", { method: "POST", body: form }).catch(() => null);
  if (!res) throw new Error("Không kết nối được máy chủ.");
  if (res.status === 423) throw new Error("Phiên đã khoá, nhập lại mã PIN.");
  if (!res.ok) throw new Error("Tải ảnh lên thất bại.");
  const data = (await res.json().catch(() => ({}))) as { url?: string };
  if (!data.url) throw new Error("Tải ảnh lên thất bại.");
  return data.url;
}
