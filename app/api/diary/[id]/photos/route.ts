import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { uploadImage } from "@/lib/storage";
import { isAllowedImageType } from "@/lib/validation";
import { MAX_PHOTOS_PER_ENTRY } from "@/lib/photos";
import { photoSelect, refreshCover } from "@/lib/photo-store";

type Ctx = { params: Promise<{ id: string }> };

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_THUMB_SIZE = 600 * 1024;
const COLOR = /^#[0-9a-f]{6}$/i;

const dim = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 20000 ? n : 0;
};

// Adds one photo (full image + optional small thumbnail made by the client).
export async function POST(request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;
  const userId = guard.userId;

  const { id } = await params;
  const entry = await prisma.diaryEntry.findFirst({ where: { id, userId }, select: { id: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const thumb = form?.get("thumb");
  if (!(file instanceof File) || !isAllowedImageType(file.type)) {
    return NextResponse.json({ error: "Ảnh phải là PNG/JPEG/GIF/WebP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ảnh quá lớn (tối đa 5MB)." }, { status: 413 });
  const hasThumb = thumb instanceof File && isAllowedImageType(thumb.type) && thumb.size <= MAX_THUMB_SIZE;

  const count = await prisma.entryPhoto.count({ where: { entryId: id } });
  if (count >= MAX_PHOTOS_PER_ENTRY) {
    return NextResponse.json({ error: `Mỗi nhật ký tối đa ${MAX_PHOTOS_PER_ENTRY} ảnh.` }, { status: 400 });
  }

  const [url, thumbUrl] = await Promise.all([
    uploadImage(Buffer.from(await file.arrayBuffer()), file.type),
    hasThumb ? uploadImage(Buffer.from(await (thumb as File).arrayBuffer()), (thumb as File).type) : null,
  ]);
  const color = String(form?.get("color") ?? "");
  const last = await prisma.entryPhoto.aggregate({ where: { entryId: id }, _max: { sortOrder: true } });
  const photo = await prisma.entryPhoto.create({
    data: {
      entryId: id,
      userId,
      url,
      thumbUrl,
      width: dim(form!.get("width")),
      height: dim(form!.get("height")),
      color: COLOR.test(color) ? color.toLowerCase() : null,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
    select: photoSelect,
  });
  const cover = await refreshCover(id);
  return NextResponse.json({ photo, ...cover }, { status: 201 });
}
