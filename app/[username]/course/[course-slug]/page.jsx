import { notFound } from "next/navigation";
import { PublicProductSales } from "@/components/products/public-product-sales";
import { prisma } from "@/lib/prisma";
import { getPublicCheckoutAvailability } from "@/server/modules/platform-settings/platform-settings.service";

export default async function PublicCoursePage({ params }) {
  const resolvedParams = await params;
  const [course, checkoutAvailability] = await Promise.all([
    prisma.product.findFirst({
      where: {
        slug: resolvedParams["course-slug"],
        type: "COURSE",
        status: "ACTIVE",
        moderationStatus: { not: "DISABLED" },
        user: {
          username: resolvedParams.username,
        },
      },
      include: publicProductInclude,
    }),
    getPublicCheckoutAvailability(prisma),
  ]);

  if (!course) {
    notFound();
  }

  return <PublicProductSales product={course} checkoutAvailability={checkoutAvailability} />;
}

const publicProductInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
          isPreview: true,
          order: true,
        },
      },
    },
  },
};
