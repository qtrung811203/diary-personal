-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "coverColor" TEXT,
ADD COLUMN     "coverPhotoId" TEXT,
ADD COLUMN     "coverThumbUrl" TEXT,
ADD COLUMN     "photoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "photoLayout" TEXT NOT NULL DEFAULT 'cover',
ADD COLUMN     "trackId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "musicAutoplay" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EntryPhoto" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "spotifyKind" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryPhoto_entryId_sortOrder_idx" ON "EntryPhoto"("entryId", "sortOrder");

-- CreateIndex
CREATE INDEX "EntryPhoto_userId_createdAt_idx" ON "EntryPhoto"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Track_userId_idx" ON "Track"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_userId_provider_externalId_key" ON "Track"("userId", "provider", "externalId");

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryPhoto" ADD CONSTRAINT "EntryPhoto_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryPhoto" ADD CONSTRAINT "EntryPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
