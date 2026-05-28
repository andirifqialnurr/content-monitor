import { notFound } from "next/navigation";
import { PublicContentPage } from "@/components/content-bank/public-content-page";
import { prisma } from "@/lib/prisma";

export default async function PublicContentRoutePage({ params }) {
  const resolvedParams = await params;
  const contentItem = await prisma.contentItem.findFirst({
    where: {
      slug: resolvedParams["content-slug"],
      status: "PUBLISHED",
      user: {
        username: resolvedParams.username,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          publicPage: {
            select: {
              id: true,
              isPublished: true,
            },
          },
        },
      },
    },
  });

  if (!contentItem) {
    notFound();
  }

  return <PublicContentPage contentItem={contentItem} />;
}
