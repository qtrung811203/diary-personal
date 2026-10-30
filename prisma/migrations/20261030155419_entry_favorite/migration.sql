-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_isFavorite_idx" ON "DiaryEntry"("userId", "isFavorite");
