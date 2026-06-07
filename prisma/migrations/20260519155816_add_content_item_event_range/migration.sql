-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "body" TEXT,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContentItem" ("body", "createdAt", "id", "metadataJson", "publishedAt", "scheduledAt", "slug", "status", "title", "type", "updatedAt", "userId") SELECT "body", "createdAt", "id", "metadataJson", "publishedAt", "scheduledAt", "slug", "status", "title", "type", "updatedAt", "userId" FROM "ContentItem";
DROP TABLE "ContentItem";
ALTER TABLE "new_ContentItem" RENAME TO "ContentItem";
CREATE INDEX "ContentItem_userId_type_idx" ON "ContentItem"("userId", "type");
CREATE INDEX "ContentItem_userId_status_idx" ON "ContentItem"("userId", "status");
CREATE INDEX "ContentItem_scheduledAt_idx" ON "ContentItem"("scheduledAt");
CREATE INDEX "ContentItem_startAt_idx" ON "ContentItem"("startAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
