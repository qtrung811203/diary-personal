import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidMonthParam } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ yyyymm: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { yyyymm } = await params;
  if (!isValidMonthParam(yyyymm)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: session.user.id, date: { startsWith: yyyymm } },
    select: { date: true },
  });

  return NextResponse.json({ writtenDates: entries.map((e) => e.date) });
}
