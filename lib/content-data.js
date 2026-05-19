import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [formats, cadenceItems, weeklyCalendar, timeline, topics] = await Promise.all([
    prisma.contentFormat.findMany({
      orderBy: { order: "asc" },
      select: { key: true, label: true },
    }),
    prisma.cadenceItem.findMany({
      orderBy: [{ mode: "asc" }, { order: "asc" }],
      select: { mode: true, label: true, value: true },
    }),
    prisma.weeklyCalendarItem.findMany({
      orderBy: { order: "asc" },
      select: { day: true, item: true },
    }),
    prisma.timelineWeek.findMany({
      orderBy: { week: "asc" },
      select: {
        week: true,
        theme: true,
        carousel: true,
        short: true,
        article: true,
        linkedin: true,
        topicId: true,
      },
    }),
    prisma.topic.findMany({
      orderBy: { id: "asc" },
      include: {
        folders: {
          orderBy: { order: "asc" },
          select: { value: true },
        },
      },
    }),
  ]);

  const cadence = cadenceItems.reduce((grouped, item) => {
    grouped[item.mode] ??= [];
    grouped[item.mode].push([item.label, item.value]);
    return grouped;
  }, {});

  return {
    cadence,
    formats,
    timeline,
    topics: topics.map(({ folders, ...topic }) => ({
      ...topic,
      folders: folders.map((folder) => folder.value),
    })),
    weeklyCalendar: weeklyCalendar.map(({ day, item }) => [day, item]),
  };
}
