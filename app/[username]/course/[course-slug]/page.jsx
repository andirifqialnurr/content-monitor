import { notFound } from "next/navigation";
import { PublicProductSales } from "@/components/products/public-product-sales";
import { prisma } from "@/lib/prisma";

export default async function PublicCoursePage({ params }) {
  const resolvedParams = await params;
  const course = await prisma.product.findFirst({
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
  });

  if (!course) {
    notFound();
  }

  return <PublicProductSales product={course} />;
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
