-- Migrate the old planning dashboard topic bank into the current user-owned ContentItem model.
-- Legacy rows are attached to the first ADMIN user when available, otherwise to the first user.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

WITH owner AS (
  SELECT "id"
  FROM "User"
  ORDER BY CASE "role" WHEN 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
)
INSERT INTO "ContentItem" (
  "id",
  "userId",
  "type",
  "title",
  "slug",
  "body",
  "metadataJson",
  "status",
  "allDay",
  "timezone",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-topic-' || lower(t."id") || '-carousel',
  owner."id",
  'CAROUSEL_POST',
  t."carousel",
  lower(t."id") || '-carousel',
  'Legacy topic: ' || t."id" || char(10) ||
    'Pillar: ' || t."pillar" || char(10) ||
    'Cluster: ' || t."cluster" || char(10) ||
    'Format: carousel' || char(10) || char(10) ||
    'Pain: ' || t."pain" || char(10) ||
    'Promise: ' || t."promise" || char(10) ||
    'CTA: ' || t."cta" ||
    CASE WHEN w."week" IS NOT NULL THEN char(10) || char(10) || 'Timeline week ' || w."week" || ': ' || w."theme" ELSE '' END,
  '{"source":"legacy-topic","topicId":"' || replace(t."id", '"', '\"') ||
    '","cluster":"' || replace(t."cluster", '"', '\"') ||
    '","pillar":"' || replace(t."pillar", '"', '\"') ||
    '","format":"carousel","timelineWeek":' || COALESCE(CAST(w."week" AS TEXT), 'null') || '}',
  'DRAFT',
  false,
  'Asia/Jakarta',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Topic" t
CROSS JOIN owner
LEFT JOIN "TimelineWeek" w ON w."topicId" = t."id"
WHERE NOT EXISTS (
  SELECT 1 FROM "ContentItem" c WHERE c."id" = 'legacy-topic-' || lower(t."id") || '-carousel'
);

WITH owner AS (
  SELECT "id"
  FROM "User"
  ORDER BY CASE "role" WHEN 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
)
INSERT INTO "ContentItem" (
  "id",
  "userId",
  "type",
  "title",
  "slug",
  "body",
  "metadataJson",
  "status",
  "allDay",
  "timezone",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-topic-' || lower(t."id") || '-short',
  owner."id",
  'VIDEO_SHORT',
  t."short",
  lower(t."id") || '-short',
  'Legacy topic: ' || t."id" || char(10) ||
    'Pillar: ' || t."pillar" || char(10) ||
    'Cluster: ' || t."cluster" || char(10) ||
    'Format: short' || char(10) || char(10) ||
    'Pain: ' || t."pain" || char(10) ||
    'Promise: ' || t."promise" || char(10) ||
    'CTA: ' || t."cta" ||
    CASE WHEN w."week" IS NOT NULL THEN char(10) || char(10) || 'Timeline week ' || w."week" || ': ' || w."theme" ELSE '' END,
  '{"source":"legacy-topic","topicId":"' || replace(t."id", '"', '\"') ||
    '","cluster":"' || replace(t."cluster", '"', '\"') ||
    '","pillar":"' || replace(t."pillar", '"', '\"') ||
    '","format":"short","timelineWeek":' || COALESCE(CAST(w."week" AS TEXT), 'null') || '}',
  'DRAFT',
  false,
  'Asia/Jakarta',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Topic" t
CROSS JOIN owner
LEFT JOIN "TimelineWeek" w ON w."topicId" = t."id"
WHERE NOT EXISTS (
  SELECT 1 FROM "ContentItem" c WHERE c."id" = 'legacy-topic-' || lower(t."id") || '-short'
);

WITH owner AS (
  SELECT "id"
  FROM "User"
  ORDER BY CASE "role" WHEN 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
)
INSERT INTO "ContentItem" (
  "id",
  "userId",
  "type",
  "title",
  "slug",
  "body",
  "metadataJson",
  "status",
  "allDay",
  "timezone",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-topic-' || lower(t."id") || '-article',
  owner."id",
  'BLOG',
  t."article",
  lower(t."id") || '-article',
  'Legacy topic: ' || t."id" || char(10) ||
    'Pillar: ' || t."pillar" || char(10) ||
    'Cluster: ' || t."cluster" || char(10) ||
    'Format: article' || char(10) || char(10) ||
    'Pain: ' || t."pain" || char(10) ||
    'Promise: ' || t."promise" || char(10) ||
    'CTA: ' || t."cta" ||
    CASE WHEN w."week" IS NOT NULL THEN char(10) || char(10) || 'Timeline week ' || w."week" || ': ' || w."theme" ELSE '' END,
  '{"source":"legacy-topic","topicId":"' || replace(t."id", '"', '\"') ||
    '","cluster":"' || replace(t."cluster", '"', '\"') ||
    '","pillar":"' || replace(t."pillar", '"', '\"') ||
    '","format":"article","timelineWeek":' || COALESCE(CAST(w."week" AS TEXT), 'null') || '}',
  'DRAFT',
  false,
  'Asia/Jakarta',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Topic" t
CROSS JOIN owner
LEFT JOIN "TimelineWeek" w ON w."topicId" = t."id"
WHERE NOT EXISTS (
  SELECT 1 FROM "ContentItem" c WHERE c."id" = 'legacy-topic-' || lower(t."id") || '-article'
);

DROP TABLE IF EXISTS "TimelineWeek";
DROP TABLE IF EXISTS "TopicFolder";
DROP TABLE IF EXISTS "Topic";
DROP TABLE IF EXISTS "ContentFormat";
DROP TABLE IF EXISTS "WeeklyCalendarItem";
DROP TABLE IF EXISTS "CadenceItem";
DROP TABLE IF EXISTS "ReferenceFile";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
