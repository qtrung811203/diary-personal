import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidDateParam } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const entry = await prisma.diaryEntry.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  return NextResponse.json(entry);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const contentJson = body?.contentJson ?? {};
  const backgroundType =
    body?.backgroundType === "image" ? "image" : "color";
  const backgroundValue =
    typeof body?.backgroundValue === "string" ? body.backgroundValue : "#fbe9d6";

  const entry = await prisma.diaryEntry.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: {
      userId: session.user.id,
      date,
      contentJson,
      backgroundType,
      backgroundValue,
    },
    update: { contentJson, backgroundType, backgroundValue },
  });

  return NextResponse.json(entry);
}
