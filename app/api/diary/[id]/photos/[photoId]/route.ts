import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import { deletePhotoObjects, refreshCover } from "@/lib/photo-store";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const { id, photoId } = await params;
  const photo = await prisma.entryPhoto.findFirst({
    where: { id: photoId, entryId: id, userId: guard.userId },
    select: { id: true, url: true, thumbUrl: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.entryPhoto.delete({ where: { id: photo.id } });
  deletePhotoObjects([photo]);
  const cover = await refreshCover(id);
  return NextResponse.json(cover);
}
