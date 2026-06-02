require("dotenv/config");

const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { timeline, topics } = require("../data/content");
const { seedQaScenario } = require("../data/qa-seed");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to .env before running the seed.");
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@content-monitor.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminPassword123!";
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminName = process.env.ADMIN_NAME ?? "Platform Admin";

  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        role: "ADMIN",
        username: adminUsername,
      },
      create: {
        name: adminName,
        email: adminEmail,
        username: adminUsername,
        role: "ADMIN",
        passwordHash: hashPassword(adminPassword),
      },
    });

    await tx.contentItem.deleteMany({
      where: {
        userId: admin.id,
        metadataJson: {
          contains: '"source":"legacy-topic"',
        },
      },
    });

    await tx.contentItem.createMany({
      data: buildLegacyContentItems(admin.id),
    });

    await seedQaScenario({
      tx,
      admin,
      hashPassword,
    });
  });
}

function buildLegacyContentItems(userId) {
  const now = new Date();
  const timelineByTopic = new Map(timeline.map((item) => [item.topicId, item]));

  return topics.flatMap((topic) => {
    const week = timelineByTopic.get(topic.id);

    return [
      buildLegacyContentItem(userId, topic, week, "CAROUSEL_POST", topic.carousel, "carousel", now),
      buildLegacyContentItem(userId, topic, week, "VIDEO_SHORT", topic.short, "short", now),
      buildLegacyContentItem(userId, topic, week, "BLOG", topic.article, "article", now),
    ];
  });
}

function buildLegacyContentItem(userId, topic, week, type, title, format, now) {
  return {
    id: `legacy-topic-${topic.id.toLowerCase()}-${format}`,
    userId,
    type,
    title,
    slug: normalizeSlug(`${topic.id}-${format}-${title}`),
    body: buildLegacyBody(topic, week, format),
    metadataJson: JSON.stringify({
      source: "legacy-topic",
      topicId: topic.id,
      cluster: topic.cluster,
      pillar: topic.pillar,
      format,
      timelineWeek: week?.week ?? null,
    }),
    status: "DRAFT",
    timezone: "Asia/Jakarta",
    createdAt: now,
    updatedAt: now,
  };
}

function buildLegacyBody(topic, week, format) {
  const lines = [
    `Legacy topic: ${topic.id}`,
    `Pillar: ${topic.pillar}`,
    `Cluster: ${topic.cluster}`,
    `Format: ${format}`,
    "",
    `Pain: ${topic.pain}`,
    `Promise: ${topic.promise}`,
    `CTA: ${topic.cta}`,
  ];

  if (week) {
    lines.push("", `Timeline week ${week.week}: ${week.theme}`);
  }

  if (topic.folders?.length) {
    lines.push("", `Folder references: ${topic.folders.join(", ")}`);
  }

  if (topic.linkedin) {
    lines.push("", `LinkedIn angle: ${topic.linkedin}`);
  }

  return lines.join("\n");
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

main()
  .then(async () => {
    console.log("Seeded content monitor data.");
    console.log("Admin login:", process.env.ADMIN_EMAIL ?? "admin@content-monitor.local");
    console.log("QA creator login: creator@content-monitor.local / CreatorPassword123!");
    console.log("QA buyer login: buyer@content-monitor.local / BuyerPassword123!");
    console.log("QA partner login: partner@content-monitor.local / PartnerPassword123!");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
