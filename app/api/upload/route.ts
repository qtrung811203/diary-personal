import { NextResponse } from "next/server";
import { requireUnlocked } from "@/lib/session";
import { uploadImage } from "@/lib/storage";
import { isAllowedImageType } from "@/lib/validation";

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const guard = await requireUnlocked();
  if (!guard.ok) return guard.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File) || !isAllowedImageType(file.type)) {
    return NextResponse.json(
      { error: "A valid PNG/JPEG/GIF/WebP image is required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(buffer, file.type);

  return NextResponse.json({ url });
}
