import { notFound } from "next/navigation";
import { PublicPageRenderer } from "@/components/appearance/public-page-renderer";
import { prisma } from "@/lib/prisma";

export default async function PublicProfilePage({ params }) {
  const resolvedParams = await params;
  const user = await prisma.user.findUnique({
    where: { username: resolvedParams.username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      publicPage: {
        include: {
          blocks: {
            where: { isVisible: true },
            orderBy: { order: "asc" },
            include: {
              product: true,
              contentItem: true,
            },
          },
        },
      },
      products: {
        where: {
          status: "ACTIVE",
          moderationStatus: { not: "DISABLED" },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 8,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const publicPage = user.publicPage?.isPublished ? user.publicPage : null;

  return <PublicPageRenderer publicPage={publicPage} user={user} fallbackProducts={user.products} />;
}
