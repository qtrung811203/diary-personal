import { prisma } from "@/lib/prisma";
import { DEFAULT_MOODS } from "@/lib/moods";

// Lists the user's moods, seeding the defaults the first time (new accounts
// and accounts that predate moods). Seeding is race-safe: Mood has a unique
// (userId, name), so a second concurrent seed just skips the duplicates.
export async function ensureMoods(userId: string) {
  const existing = await prisma.mood.count({ where: { userId } });
  if (existing === 0) {
    await prisma.mood.createMany({
      data: DEFAULT_MOODS.map((m, i) => ({ ...m, userId, sortOrder: i })),
      skipDuplicates: true,
    });
  }
  return prisma.mood.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
