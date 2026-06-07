-- CreateTable
CREATE TABLE "ReferenceFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CadenceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyCalendarItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "TimelineWeek" (
    "week" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "carousel" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "linkedin" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "TimelineWeek_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cluster" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pain" TEXT NOT NULL,
    "promise" TEXT NOT NULL,
    "carousel" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "linkedin" TEXT,
    "cta" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TopicFolder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "TopicFolder_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentFormat" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceFile_path_key" ON "ReferenceFile"("path");

-- CreateIndex
CREATE UNIQUE INDEX "CadenceItem_mode_order_key" ON "CadenceItem"("mode", "order");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCalendarItem_order_key" ON "WeeklyCalendarItem"("order");

-- CreateIndex
CREATE UNIQUE INDEX "TopicFolder_topicId_order_key" ON "TopicFolder"("topicId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentFormat_order_key" ON "ContentFormat"("order");
