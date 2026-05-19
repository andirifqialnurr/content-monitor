require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { cadence, files, formats, timeline, topics, weeklyCalendar } = require("../data/content");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to .env before running the seed.");
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.timelineWeek.deleteMany();
    await tx.topicFolder.deleteMany();
    await tx.topic.deleteMany();
    await tx.contentFormat.deleteMany();
    await tx.weeklyCalendarItem.deleteMany();
    await tx.cadenceItem.deleteMany();
    await tx.referenceFile.deleteMany();

    await tx.referenceFile.createMany({
      data: files.map((file, index) => ({
        ...file,
        order: index + 1,
      })),
    });

    await tx.cadenceItem.createMany({
      data: Object.entries(cadence).flatMap(([mode, items]) =>
        items.map(([label, value], index) => ({
          mode,
          label,
          value,
          order: index + 1,
        })),
      ),
    });

    await tx.weeklyCalendarItem.createMany({
      data: weeklyCalendar.map(([day, item], index) => ({
        day,
        item,
        order: index + 1,
      })),
    });

    await tx.contentFormat.createMany({
      data: formats.map((format, index) => ({
        ...format,
        order: index + 1,
      })),
    });

    await tx.topic.createMany({
      data: topics.map(({ folders: _folders, linkedin, ...topic }) => ({
        ...topic,
        linkedin: linkedin ?? null,
      })),
    });

    const folderRows = topics.flatMap((topic) =>
      (topic.folders ?? []).map((folder, index) => ({
        topicId: topic.id,
        value: folder,
        order: index + 1,
      })),
    );

    if (folderRows.length > 0) {
      await tx.topicFolder.createMany({ data: folderRows });
    }

    await tx.timelineWeek.createMany({ data: timeline });
  });
}

main()
  .then(async () => {
    console.log("Seeded content monitor data.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
