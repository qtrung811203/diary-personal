-- DropIndex
DROP INDEX "DiaryEntry_userId_date_key";

-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "moodId" TEXT,
ADD COLUMN     "preview" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "words" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "backgroundValue" SET DEFAULT '#FFF4DE';

-- Existing one-per-day entries: stamp their creation time as noon on their
-- own date (instead of "now", which would reorder every old entry to today).
-- title / preview / words stay empty here and are filled lazily by the
-- diary list API the first time each entry is read (see lib/doc.ts).
UPDATE "DiaryEntry" SET "createdAt" = ("date"::date + time '12:00:00');

-- CreateTable
CREATE TABLE "Mood" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Mood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mood_userId_idx" ON "Mood"("userId");

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_createdAt_idx" ON "DiaryEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_date_idx" ON "DiaryEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "Mood" ADD CONSTRAINT "Mood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "Mood"("id") ON DELETE SET NULL ON UPDATE CASCADE;
